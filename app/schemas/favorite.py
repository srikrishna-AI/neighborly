from datetime import datetime
from pydantic import BaseModel
from app.schemas.listing import ListingResponse

class FavoriteBase(BaseModel):
    listing_id: int

class FavoriteCreate(FavoriteBase):
    pass

class FavoriteResponse(FavoriteBase):
    id: int
    user_id: int
    created_at: datetime
    listing: ListingResponse

    model_config = {
        "from_attributes": True
    }
