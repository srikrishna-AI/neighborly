from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models.user import User
from app.models.listing import Listing
from app.models.request import BorrowRequest
from app.models.review import Review
from app.schemas.user import UserPublicProfile

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/{id}", response_model=UserPublicProfile)
def get_user_profile(id: int, db: Session = Depends(get_db)):
    # Verify user exists
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get user's active listings
    active_listings = db.query(Listing).filter(
        Listing.owner_id == id,
        Listing.availability == True
    ).all()

    # Calculate average rating of reviews received for listings owned by this user
    avg_rating = db.query(func.avg(Review.rating)).select_from(Review).join(
        BorrowRequest, Review.request_id == BorrowRequest.id
    ).join(
        Listing, BorrowRequest.listing_id == Listing.id
    ).filter(
        Listing.owner_id == id
    ).scalar()

    # If avg_rating is not None, format to a float (average is returned as Decimal by database)
    avg_rating_float = float(avg_rating) if avg_rating is not None else None

    return UserPublicProfile(
        id=user.id,
        name=user.name,
        active_listings=active_listings,
        average_rating=avg_rating_float
    )
