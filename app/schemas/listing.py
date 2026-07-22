from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.category import CategoryResponse
from app.schemas.user import UserResponse

class ListingBase(BaseModel):
    title: str
    description: str
    type: str  # "item" or "skill"
    category_id: int
    availability: bool = True
    quantity: int = 1
    image_url: Optional[str] = None
    location: Optional[str] = None
    price_per_day: float = 0.0
    condition: str = "Good"

class ListingCreate(ListingBase):
    pass

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    category_id: Optional[int] = None
    availability: Optional[bool] = None
    quantity: Optional[int] = None
    image_url: Optional[str] = None
    location: Optional[str] = None
    price_per_day: Optional[float] = None
    condition: Optional[str] = None

class ListingResponse(ListingBase):
    id: int
    owner_id: int
    created_at: datetime
    owner: UserResponse
    category: CategoryResponse
    available_quantity: Optional[int] = None
    is_favorited: Optional[bool] = False

    model_config = {
        "from_attributes": True
    }
