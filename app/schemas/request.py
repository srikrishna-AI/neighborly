from datetime import date, datetime
from pydantic import BaseModel
from app.schemas.listing import ListingResponse
from app.schemas.user import UserResponse

class BorrowRequestBase(BaseModel):
    listing_id: int
    start_date: date
    end_date: date
    quantity: int = 1

class BorrowRequestCreate(BorrowRequestBase):
    pass

class BorrowRequestStatusUpdate(BaseModel):
    status: str  # pending, approved, active, returned, cancelled

class BorrowRequestResponse(BorrowRequestBase):
    id: int
    requester_id: int
    status: str
    created_at: datetime
    listing: ListingResponse
    requester: UserResponse

    model_config = {
        "from_attributes": True
    }
