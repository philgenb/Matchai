from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_or_create_current_user
from app.firebase import firestore_client
from app.repositories import (
    count_group_members,
    group_id_for_invite,
    group_ids_for_user,
    group_members,
    group_ref,
    proposal_by_id,
    proposal_for_group,
    proposal_ref,
    require_group_member,
    rsvp_ref,
)
from app.schemas import (
    CalendarEventResponse,
    GroupCreate,
    GroupDetail,
    GroupSummary,
    MeetingProposal,
    RsvpCreate,
)
from app.services.planner import create_meeting_proposal
from app.storage import new_id, new_invite_code, now_iso

router = APIRouter(tags=["groups"])


def _invite_link(invite_code: str) -> str:
    return f"/groups/join/{invite_code}"


def _group_summary(group_id: str, data: dict, member_count: int) -> GroupSummary:
    return GroupSummary(
        id=group_id,
        name=data["name"],
        description=data.get("description", ""),
        invite_code=data["invite_code"],
        invite_link=_invite_link(data["invite_code"]),
        status=data.get("status", "no_meeting_planned"),
        member_count=member_count,
    )


def _get_group_or_404(group_id: str) -> tuple[str, dict]:
    snapshot = group_ref(group_id).get()
    if not snapshot.exists:
        raise HTTPException(status_code=404, detail="Group not found")
    return snapshot.id, snapshot.to_dict() or {}


def _group_detail(group_id: str, data: dict) -> GroupDetail:
    summary = _group_summary(group_id, data, count_group_members(group_id))
    return GroupDetail(
        **summary.model_dump(),
        participants=group_members(group_id),
        current_proposal=proposal_for_group(group_id),
    )


def _sync_group_status(group_id: str, proposal_id: str) -> MeetingProposal | None:
    proposal = proposal_by_id(proposal_id)
    if not proposal:
        return None

    members = group_members(group_id)
    all_accepted = bool(members) and all(proposal.rsvps.get(member.user.id) == "accept" for member in members)
    next_status = "confirmed" if all_accepted else "proposal_found"
    current = now_iso()

    group_ref(group_id).set({"status": next_status, "updated_at": current}, merge=True)
    proposal_ref(group_id, proposal_id).set({"status": next_status, "updated_at": current}, merge=True)
    return proposal_by_id(proposal_id)


@router.post("/groups", response_model=GroupDetail)
def create_group(
    payload: GroupCreate,
    current_user: dict = Depends(get_or_create_current_user),
) -> GroupDetail:
    db = firestore_client()
    group_id = new_id("grp")
    invite_code = new_invite_code()
    current = now_iso()
    group = {
        "name": payload.name,
        "description": payload.description,
        "invite_code": invite_code,
        "status": "no_meeting_planned",
        "created_by_user_id": current_user["id"],
        "created_at": current,
        "updated_at": current,
        "current_proposal_id": None,
    }
    batch = db.batch()
    batch.set(group_ref(group_id), group)
    batch.set(
        group_ref(group_id).collection("members").document(current_user["id"]),
        {
            "user_id": current_user["id"],
            "role": "owner",
            "joined_at": current,
        },
    )
    batch.set(db.collection("invite_codes").document(invite_code), {"group_id": group_id})
    batch.commit()
    return _group_detail(group_id, group)


@router.get("/groups", response_model=list[GroupSummary])
def list_groups(current_user: dict = Depends(get_or_create_current_user)) -> list[GroupSummary]:
    summaries: list[GroupSummary] = []
    for group_id in group_ids_for_user(current_user["id"]):
        snapshot = group_ref(group_id).get()
        if snapshot.exists:
            summaries.append(_group_summary(snapshot.id, snapshot.to_dict() or {}, count_group_members(snapshot.id)))
    return sorted(summaries, key=lambda item: item.id)


@router.get("/groups/{group_id}", response_model=GroupDetail)
def get_group(group_id: str, current_user: dict = Depends(get_or_create_current_user)) -> GroupDetail:
    require_group_member(group_id, current_user["id"])
    _, group = _get_group_or_404(group_id)
    return _group_detail(group_id, group)


@router.post("/groups/join/{invite_code}", response_model=GroupDetail)
def join_group(invite_code: str, current_user: dict = Depends(get_or_create_current_user)) -> GroupDetail:
    group_id = group_id_for_invite(invite_code)
    if not group_id:
        raise HTTPException(status_code=404, detail="Invite code not found")

    _, group = _get_group_or_404(group_id)
    group_ref(group_id).collection("members").document(current_user["id"]).set(
        {
            "user_id": current_user["id"],
            "role": "member",
            "joined_at": now_iso(),
        },
        merge=True,
    )
    return _group_detail(group_id, group)


@router.post("/groups/{group_id}/schedule", response_model=MeetingProposal)
def schedule_group(group_id: str, current_user: dict = Depends(get_or_create_current_user)) -> MeetingProposal:
    require_group_member(group_id, current_user["id"])
    group_ref(group_id).set({"status": "matching_in_progress", "updated_at": now_iso()}, merge=True)
    return create_meeting_proposal(group_id)


@router.get("/groups/{group_id}/proposal", response_model=MeetingProposal)
def get_group_proposal(
    group_id: str,
    current_user: dict = Depends(get_or_create_current_user),
) -> MeetingProposal:
    require_group_member(group_id, current_user["id"])
    proposal = proposal_for_group(group_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="No proposal found")
    return proposal


@router.post("/proposals/{proposal_id}/rsvp", response_model=MeetingProposal)
def rsvp_to_proposal(
    proposal_id: str,
    payload: RsvpCreate,
    current_user: dict = Depends(get_or_create_current_user),
) -> MeetingProposal:
    proposal = proposal_by_id(proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    require_group_member(proposal.group_id, current_user["id"])
    rsvp_ref(proposal.group_id, proposal_id, current_user["id"]).set(
        {
            "user_id": current_user["id"],
            "status": payload.status,
            "updated_at": now_iso(),
        },
        merge=True,
    )
    updated = _sync_group_status(proposal.group_id, proposal_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return updated


@router.post("/proposals/{proposal_id}/add-to-calendar", response_model=CalendarEventResponse)
def add_to_calendar(
    proposal_id: str,
    current_user: dict = Depends(get_or_create_current_user),
) -> CalendarEventResponse:
    proposal = proposal_by_id(proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    require_group_member(proposal.group_id, current_user["id"])
    return CalendarEventResponse(
        status="mocked",
        message="Calendar creation is mocked for the MVP. Connect Google Calendar to create real events.",
        calendar_url=None,
    )
