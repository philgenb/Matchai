from typing import Any

from fastapi import HTTPException
from google.cloud.firestore_v1 import FieldFilter

from app.firebase import firestore_client
from app.schemas import GroupMember, MeetingProposal, UserProfile
from app.storage import now_iso

DEFAULT_INTERESTS = ["Cafe", "Bar", "Restaurant"]


def user_ref(user_id: str):
    return firestore_client().collection("users").document(user_id)


def group_ref(group_id: str):
    return firestore_client().collection("groups").document(group_id)


def proposal_ref(group_id: str, proposal_id: str):
    return group_ref(group_id).collection("proposals").document(proposal_id)


def rsvp_ref(group_id: str, proposal_id: str, user_id: str):
    return proposal_ref(group_id, proposal_id).collection("rsvps").document(user_id)


def user_profile_from_doc(doc_id: str, data: dict[str, Any]) -> UserProfile:
    return UserProfile(
        id=doc_id,
        firebase_uid=data["firebase_uid"],
        email=data["email"],
        name=data["name"],
        profile_image=data.get("profile_image"),
    )


def current_user_profile(user: dict[str, Any]) -> UserProfile:
    return UserProfile(
        id=user["id"],
        firebase_uid=user["firebase_uid"],
        email=user["email"],
        name=user["name"],
        profile_image=user.get("profile_image"),
    )


def get_user(user_id: str) -> UserProfile | None:
    snapshot = user_ref(user_id).get()
    if not snapshot.exists:
        return None
    return user_profile_from_doc(snapshot.id, snapshot.to_dict() or {})


def user_preferences(user_id: str) -> dict[str, Any]:
    snapshot = user_ref(user_id).collection("private").document("preferences").get()
    if not snapshot.exists:
        return {
            "interests": DEFAULT_INTERESTS,
            "home_city": None,
            "location_label": None,
            "calendar_connected": False,
        }

    data = snapshot.to_dict() or {}
    return {
        "interests": data.get("interests") or DEFAULT_INTERESTS,
        "home_city": data.get("home_city"),
        "location_label": data.get("location_label"),
        "calendar_connected": bool(data.get("calendar_connected", False)),
    }


def save_user_preferences(user_id: str, preferences: dict[str, Any]) -> None:
    user_ref(user_id).collection("private").document("preferences").set(
        {
            **preferences,
            "updated_at": now_iso(),
        },
        merge=True,
    )


def calendar_integration_ref(user_id: str):
    return user_ref(user_id).collection("integrations").document("google_calendar")


def calendar_oauth_state_ref(state: str):
    return firestore_client().collection("calendar_oauth_states").document(state)


def get_calendar_integration(user_id: str) -> dict[str, Any] | None:
    snapshot = calendar_integration_ref(user_id).get()
    if not snapshot.exists:
        return None
    data = snapshot.to_dict() or {}
    if not data.get("connected"):
        return None
    return data


def save_calendar_integration(user_id: str, integration: dict[str, Any]) -> None:
    calendar_integration_ref(user_id).set(
        {
            **integration,
            "connected": True,
            "updated_at": now_iso(),
        },
        merge=True,
    )
    save_user_preferences(
        user_id,
        {
            **user_preferences(user_id),
            "calendar_connected": True,
        },
    )


def delete_calendar_integration(user_id: str) -> None:
    calendar_integration_ref(user_id).delete()
    save_user_preferences(
        user_id,
        {
            **user_preferences(user_id),
            "calendar_connected": False,
        },
    )


def proposal_from_doc(group_id: str, proposal_id: str, data: dict[str, Any]) -> MeetingProposal:
    rsvps = {
        snapshot.id: (snapshot.to_dict() or {}).get("status")
        for snapshot in proposal_ref(group_id, proposal_id).collection("rsvps").stream()
    }
    return MeetingProposal(
        id=proposal_id,
        group_id=group_id,
        title=data["title"],
        summary=data["summary"],
        starts_at=data["starts_at"],
        ends_at=data["ends_at"],
        location_name=data["location_name"],
        address=data["address"],
        image_url=data.get("image_url"),
        source_url=data.get("source_url"),
        rationale=data["rationale"],
        status=data["status"],
        rsvps={user_id: status for user_id, status in rsvps.items() if status},
    )


def proposal_for_group(group_id: str) -> MeetingProposal | None:
    group = group_ref(group_id).get()
    if not group.exists:
        return None

    latest_proposal_id = (group.to_dict() or {}).get("current_proposal_id")
    if latest_proposal_id:
        snapshot = proposal_ref(group_id, latest_proposal_id).get()
        if snapshot.exists:
            return proposal_from_doc(group_id, snapshot.id, snapshot.to_dict() or {})

    proposals = (
        group_ref(group_id)
        .collection("proposals")
        .order_by("created_at", direction="DESCENDING")
        .limit(1)
        .stream()
    )
    for snapshot in proposals:
        return proposal_from_doc(group_id, snapshot.id, snapshot.to_dict() or {})
    return None


def proposal_by_id(proposal_id: str) -> MeetingProposal | None:
    index = firestore_client().collection("proposal_index").document(proposal_id).get()
    if not index.exists:
        return None
    group_id = (index.to_dict() or {}).get("group_id")
    if not group_id:
        return None
    snapshot = proposal_ref(group_id, proposal_id).get()
    if not snapshot.exists:
        return None
    return proposal_from_doc(group_id, snapshot.id, snapshot.to_dict() or {})


def group_members(group_id: str) -> list[GroupMember]:
    proposal = proposal_for_group(group_id)
    rsvps = proposal.rsvps if proposal else {}
    members: list[GroupMember] = []

    snapshots = group_ref(group_id).collection("members").order_by("joined_at").stream()
    for snapshot in snapshots:
        member_data = snapshot.to_dict() or {}
        user = get_user(snapshot.id)
        if user:
            members.append(
                GroupMember(
                    user=user,
                    role=member_data.get("role", "member"),
                    rsvp_status=rsvps.get(snapshot.id),
                )
            )
    return members


def require_group_member(group_id: str, user_id: str) -> None:
    if not group_ref(group_id).collection("members").document(user_id).get().exists:
        raise HTTPException(status_code=403, detail="You are not a member of this group")


def count_group_members(group_id: str) -> int:
    return sum(1 for _ in group_ref(group_id).collection("members").stream())


def group_id_for_invite(invite_code: str) -> str | None:
    snapshot = firestore_client().collection("invite_codes").document(invite_code).get()
    if not snapshot.exists:
        return None
    return (snapshot.to_dict() or {}).get("group_id")


def group_ids_for_user(user_id: str) -> list[str]:
    snapshots = (
        firestore_client()
        .collection_group("members")
        .where(filter=FieldFilter("user_id", "==", user_id))
        .stream()
    )
    group_ids: list[str] = []
    for snapshot in snapshots:
        group_doc = snapshot.reference.parent.parent
        if group_doc:
            group_ids.append(group_doc.id)
    return group_ids
