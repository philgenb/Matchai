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
from app.services.planner import CalendarAvailabilityError, create_meeting_proposal
from app.services.calendar import create_calendar_event
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
    """Create a new friend group owned by the authenticated user.

    The endpoint stores the group document in Firestore, creates the current
    user as the initial `owner` member, and generates a random invite code.
    The invite code is mirrored into the `invite_codes` collection so join
    requests can look up the group quickly without scanning all groups.

    The response includes the full group detail payload, including the owner
    participant and the generated invite link path for the frontend.
    """
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
    """List all groups that include the authenticated user.

    Membership is resolved from Firestore group member subcollections. Each
    returned item is a compact summary with the group metadata, invite code,
    current planning status, and member count. The detailed participant list
    and proposal are intentionally omitted here so dashboard screens can load
    quickly.
    """
    summaries: list[GroupSummary] = []
    for group_id in group_ids_for_user(current_user["id"]):
        snapshot = group_ref(group_id).get()
        if snapshot.exists:
            summaries.append(_group_summary(snapshot.id, snapshot.to_dict() or {}, count_group_members(snapshot.id)))
    return sorted(summaries, key=lambda item: item.id)


@router.get("/groups/{group_id}", response_model=GroupDetail)
def get_group(group_id: str, current_user: dict = Depends(get_or_create_current_user)) -> GroupDetail:
    """Return the full group screen data for a member.

    The caller must already be a member of the requested group. The response
    contains group metadata, participants, each participant's RSVP state when a
    proposal exists, and the current proposal if the group has one.

    This is the primary endpoint for rendering the shared group screen in the
    React app.
    """
    require_group_member(group_id, current_user["id"])
    _, group = _get_group_or_404(group_id)
    return _group_detail(group_id, group)


@router.post("/groups/{group_id}/join", response_model=GroupDetail)
def join_group_by_id(group_id: str, current_user: dict = Depends(get_or_create_current_user)) -> GroupDetail:
    """Join a group directly by its group ID.

    The frontend invite link can point to `/groups/join/{group_id}` without
    needing a separate invite-code lookup. Joining is idempotent and returns
    the current group detail.
    """
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


@router.post("/groups/join/{invite_code}", response_model=GroupDetail)
def join_group(invite_code: str, current_user: dict = Depends(get_or_create_current_user)) -> GroupDetail:
    """Join a group using its invite code.

    Invite links point to `/groups/join/{invite_code}` in the frontend. The
    backend resolves the code through the Firestore `invite_codes` index and
    inserts the authenticated user into the group's `members` subcollection.

    Joining is idempotent because the member document is written with merge
    semantics. Calling this endpoint again for the same user keeps them in the
    group and returns the current group detail.
    """
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
    """Start the scheduling flow for a group and return a meetup proposal.

    The caller must be a group member. The group status is first marked as
    `matching_in_progress`, then the planner service gathers group members,
    preferences, a mock availability slot, and either real or fallback venue
    and proposal content.

    If `GOOGLE_PLACES_API_KEY` or `GEMINI_API_KEY` are configured, the planner
    uses those integrations. Otherwise it creates a deterministic MVP proposal.
    The generated proposal is persisted in Firestore and returned immediately.
    """
    require_group_member(group_id, current_user["id"])
    if count_group_members(group_id) < 2:
        raise HTTPException(status_code=409, detail="Location matching needs at least 2 group members")

    group_ref(group_id).set({"status": "matching_in_progress", "updated_at": now_iso()}, merge=True)
    try:
        return create_meeting_proposal(group_id)
    except CalendarAvailabilityError as error:
        group_ref(group_id).set({"status": "no_meeting_planned", "updated_at": now_iso()}, merge=True)
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.get("/groups/{group_id}/proposal", response_model=MeetingProposal)
def get_group_proposal(
    group_id: str,
    current_user: dict = Depends(get_or_create_current_user),
) -> MeetingProposal:
    """Return the latest proposal for a group.

    The caller must be a member of the group. The repository first checks the
    group's `current_proposal_id` and falls back to the latest proposal by
    creation time. The response includes RSVP state keyed by user ID so the
    frontend can render accept/maybe/decline summaries.
    """
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
    """Record the authenticated user's RSVP for a proposal.

    Accepted RSVP values are `accept`, `maybe`, and `decline`. The endpoint
    resolves the proposal through the `proposal_index` collection, confirms the
    caller belongs to the proposal's group, and writes the RSVP into the
    proposal's `rsvps` subcollection.

    After saving the RSVP, the group and proposal status are recalculated. If
    every group member has accepted, both records are marked `confirmed`;
    otherwise they remain in `proposal_found`.
    """
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
    """Add a proposal to the user's calendar.

    This endpoint validates that the proposal exists and that the authenticated
    user belongs to the proposal's group. If the user has connected Google
    Calendar, the backend creates a real event in the user's primary calendar.
    If the user has not connected Calendar yet, the response explains that the
    calendar connection is required.
    """
    proposal = proposal_by_id(proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    require_group_member(proposal.group_id, current_user["id"])
    calendar_url = create_calendar_event(current_user["id"], proposal)
    if calendar_url:
        return CalendarEventResponse(
            status="created",
            message="Calendar event created in the user's primary Google Calendar.",
            calendar_url=calendar_url,
        )
    return CalendarEventResponse(
        status="calendar_not_connected",
        message="Connect Google Calendar before adding proposals to the calendar.",
        calendar_url=None,
    )
