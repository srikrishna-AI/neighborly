from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.user import UserResponse

class ReviewBase(BaseModel):
    request_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: str

class ReviewCreate(ReviewBase):
    pass

class ReviewResponse(ReviewBase):
    id: int
    reviewer_id: int
    created_at: datetime
    reviewer: UserResponse

    model_config = {
        "from_attributes": True
    }
