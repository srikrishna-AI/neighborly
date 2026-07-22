from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.review import Review
from app.models.request import BorrowRequest
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewResponse

router = APIRouter(prefix="", tags=["reviews"])

@router.post("/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    review_in: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch borrow request
    borrow_request = db.query(BorrowRequest).filter(BorrowRequest.id == review_in.request_id).first()
    if not borrow_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Borrow request not found"
        )

    # Only the requester can review
    if borrow_request.requester_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester of the item/skill can write a review"
        )

    # Reviews can only be created for requests with status "returned"
    if borrow_request.status != "returned":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reviews can only be submitted for completed ('returned') borrow requests"
        )

    # Prevent duplicate reviews for the same request
    existing_review = db.query(Review).filter(Review.request_id == review_in.request_id).first()
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A review has already been submitted for this request"
        )

    db_review = Review(
        request_id=review_in.request_id,
        reviewer_id=current_user.id,
        rating=review_in.rating,
        comment=review_in.comment
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

@router.get("/listings/{id}/reviews", response_model=List[ReviewResponse])
def get_listing_reviews(id: int, db: Session = Depends(get_db)):
    # Get reviews for the specified listing id by joining Review with BorrowRequest
    reviews = db.query(Review).join(BorrowRequest).filter(
        BorrowRequest.listing_id == id
    ).all()
    return reviews
