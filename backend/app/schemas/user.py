from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from app.schemas.category import CategoryResponse

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class ProfileListingSchema(BaseModel):
    id: int
    title: str
    description: str
    type: str
    category_id: int
    category: Optional[CategoryResponse] = None
    availability: bool
    created_at: datetime
    image_url: Optional[str] = None
    location: Optional[str] = None
    price_per_day: Optional[float] = None
    condition: Optional[str] = None
    quantity: Optional[int] = 1
    available_quantity: Optional[int] = 1

    model_config = {
        "from_attributes": True
    }

class UserPublicProfile(BaseModel):
    id: int
    name: str
    active_listings: List[ProfileListingSchema]
    average_rating: Optional[float] = None

    model_config = {
        "from_attributes": True
    }
