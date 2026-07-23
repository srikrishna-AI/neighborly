from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.favorite import Favorite
from app.models.listing import Listing
from app.models.user import User
from app.schemas.listing import ListingResponse
from app.routers.listings import compute_available_quantity

router = APIRouter(prefix="/favorites", tags=["favorites"])

@router.post("/{listing_id}", status_code=status.HTTP_201_CREATED)
def add_favorite(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.listing_id == listing_id
    ).first()

    if existing:
        return {"message": "Listing is already favorited"}

    favorite = Favorite(user_id=current_user.id, listing_id=listing_id)
    db.add(favorite)
    db.commit()
    return {"message": "Listing bookmarked successfully"}

@router.delete("/{listing_id}", status_code=status.HTTP_200_OK)
def remove_favorite(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    favorite = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.listing_id == listing_id
    ).first()

    if not favorite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bookmark not found")

    db.delete(favorite)
    db.commit()
    return {"message": "Bookmark removed successfully"}

@router.get("", response_model=List[ListingResponse])
def get_user_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    favorites = db.query(Favorite).filter(Favorite.user_id == current_user.id).all()
    results = []
    for fav in favorites:
        resp = ListingResponse.model_validate(fav.listing)
        resp.available_quantity = compute_available_quantity(fav.listing, db)
        resp.is_favorited = True
        results.append(resp)
    return results
