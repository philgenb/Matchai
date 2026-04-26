from typing import Literal

from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    id: str
    firebase_uid: str
    email: str
    name: str
    profile_image: str | None = None
    onboarding_completed: bool = False


class UserPreferences(BaseModel):
    interests: list[str] = Field(default_factory=lambda: ["Cafe", "Bar", "Restaurant"])
    home_city: str | None = None
    location_label: str | None = None
    calendar_connected: bool = False
    onboarding_completed: bool = False


class GroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=500)


class GroupMember(BaseModel):
    user: UserProfile
    role: str
    rsvp_status: str | None = None


class GroupSummary(BaseModel):
    id: str
    name: str
    description: str
    invite_code: str
    invite_link: str
    status: str
    member_count: int


class GroupDetail(GroupSummary):
    participants: list[GroupMember]
    current_proposal: "MeetingProposal | None" = None


class VenueCandidate(BaseModel):
    name: str
    address: str
    source_url: str | None = None
    image_url: str | None = None
    website_url: str | None = None
    price_level: int | None = None
    opens_at: str | None = None
    open_now: bool | None = None


class MeetingProposal(BaseModel):
    id: str
    group_id: str
    title: str
    summary: str
    starts_at: str
    ends_at: str
    location_name: str
    address: str
    image_url: str | None = None
    source_url: str | None = None
    website_url: str | None = None
    price_level: int | None = None
    opens_at: str | None = None
    open_now: bool | None = None
    rationale: str
    status: str
    rsvps: dict[str, str] = Field(default_factory=dict)


class RsvpCreate(BaseModel):
    status: str = Field(pattern="^(accept|maybe|decline)$")


class CalendarEventResponse(BaseModel):
    status: str
    message: str
    calendar_url: str | None = None


class CalendarConnectResponse(BaseModel):
    auth_url: str


class CalendarStatusResponse(BaseModel):
    connected: bool
    google_email: str | None = None
    scopes: list[str] = Field(default_factory=list)
    updated_at: str | None = None


class AccessibilityTtsRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    voice_id: str = Field(default="YTpq7expH9539ERJ", min_length=1)
    output_format: Literal["wav", "pcm", "opus"] = "wav"
    model_name: str = "default"
    pronunciation_id: str | None = None


GroupDetail.model_rebuild()
