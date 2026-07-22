from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, and_, func
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.request import BorrowRequest
from app.models.listing import Listing
from app.models.user import User
from app.schemas.request import BorrowRequestCreate, BorrowRequestResponse, BorrowRequestStatusUpdate

router = APIRouter(prefix="/requests", tags=["requests"])

@router.post("", response_model=BorrowRequestResponse, status_code=status.HTTP_201_CREATED)
def create_borrow_request(
    request_in: BorrowRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listing = db.query(Listing).filter(Listing.id == request_in.listing_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )

    if listing.owner_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot request to borrow your own listing"
        )

    if request_in.start_date > request_in.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be before or equal to end date"
        )

    if request_in.quantity < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity requested must be at least 1"
        )

    # Calculate booked quantity for overlapping approved or active requests
    booked_quantity = db.query(func.sum(BorrowRequest.quantity)).filter(
        BorrowRequest.listing_id == request_in.listing_id,
        BorrowRequest.status.in_(["approved", "active"]),
        and_(
            BorrowRequest.start_date <= request_in.end_date,
            BorrowRequest.end_date >= request_in.start_date
        )
    ).scalar() or 0

    max_quantity = listing.quantity if listing.type == "item" else 1
    available_qty = max(0, max_quantity - booked_quantity)

    if request_in.quantity > available_qty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {available_qty} unit(s) of this listing are available for the requested dates"
        )

    db_request = BorrowRequest(
        listing_id=request_in.listing_id,
        requester_id=current_user.id,
        start_date=request_in.start_date,
        end_date=request_in.end_date,
        status="pending",
        quantity=request_in.quantity
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

@router.get("/mine", response_model=List[BorrowRequestResponse])
def get_my_requests(
    role: str = "requester",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if role == "owner":
        return db.query(BorrowRequest).join(Listing).filter(
            Listing.owner_id == current_user.id
        ).all()
    else:
        return db.query(BorrowRequest).filter(
            BorrowRequest.requester_id == current_user.id
        ).all()

@router.patch("/{id}/status", response_model=BorrowRequestResponse)
def update_request_status(
    id: int,
    status_in: BorrowRequestStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    borrow_request = db.query(BorrowRequest).filter(BorrowRequest.id == id).first()
    if not borrow_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Borrow request not found"
        )

    new_status = status_in.status.lower()
    allowed_statuses = ["approved", "active", "returned", "cancelled"]
    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of {allowed_statuses}"
        )

    listing = borrow_request.listing
    is_owner = listing.owner_id == current_user.id
    is_requester = borrow_request.requester_id == current_user.id

    if new_status in ["approved", "active", "returned"]:
        if not is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the listing owner can approve, activate, or mark a request as returned"
            )
    elif new_status == "cancelled":
        if not (is_owner or is_requester):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the owner or the requester can cancel a request"
            )

    current_status = borrow_request.status
    if current_status == new_status:
        return borrow_request

    if current_status == "pending" and new_status not in ["approved", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pending requests can only be transitioned to approved or cancelled"
        )
    elif current_status == "approved" and new_status not in ["active", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Approved requests can only be transitioned to active or cancelled"
        )
    elif current_status == "active" and new_status != "returned":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active requests can only be transitioned to returned"
        )
    elif current_status in ["returned", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update status of a request in a terminal state"
        )

    # Perform quantity overlap check when approving
    if new_status == "approved":
        booked_quantity = db.query(func.sum(BorrowRequest.quantity)).filter(
            BorrowRequest.listing_id == borrow_request.listing_id,
            BorrowRequest.id != borrow_request.id,
            BorrowRequest.status.in_(["approved", "active"]),
            and_(
                BorrowRequest.start_date <= borrow_request.end_date,
                BorrowRequest.end_date >= borrow_request.start_date
            )
        ).scalar() or 0

        max_quantity = listing.quantity if listing.type == "item" else 1
        available_qty = max(0, max_quantity - booked_quantity)

        if borrow_request.quantity > available_qty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot approve because only {available_qty} unit(s) are available for these dates"
            )

    borrow_request.status = new_status
    db.commit()
    db.refresh(borrow_request)
    return borrow_request
