from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.user import UserResponse
from app.schemas.user import ProfileListingSchema

class MessageCreate(BaseModel):
    receiver_id: int
    content: str
    listing_id: Optional[int] = None

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    listing_id: Optional[int] = None
    content: str
    created_at: datetime
    sender: UserResponse
    receiver: UserResponse
    listing: Optional[ProfileListingSchema] = None

    model_config = {
        "from_attributes": True
    }

class ConversationSummary(BaseModel):
    other_user: UserResponse
    last_message: MessageResponse
