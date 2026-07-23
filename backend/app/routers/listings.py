from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.listing import Listing
from app.models.request import BorrowRequest
from app.models.user import User
from app.models.category import Category
from app.schemas.listing import ListingCreate, ListingResponse, ListingUpdate

router = APIRouter(prefix="/listings", tags=["listings"])

def compute_available_quantity(listing: Listing, db: Session) -> int:
    """Dynamically calculates remaining available quantity based on active/approved bookings."""
    if listing.type == "skill":
        return 1  # Skills are flexible/unconstrained
    
    today = date.today()
    booked_qty = db.query(func.sum(BorrowRequest.quantity)).filter(
        BorrowRequest.listing_id == listing.id,
        BorrowRequest.status.in_(["approved", "active"]),
        BorrowRequest.end_date >= today
    ).scalar() or 0

    return max(0, listing.quantity - booked_qty)

@router.get("", response_model=List[ListingResponse])
def get_listings(
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    location: Optional[str] = None,
    max_price: Optional[float] = None,
    condition: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Listing)
    
    if category_id is not None:
        query = query.filter(Listing.category_id == category_id)
        
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Listing.title.ilike(search_filter),
                Listing.description.ilike(search_filter),
                Listing.location.ilike(search_filter)
            )
        )
        
    if location:
        query = query.filter(Listing.location.ilike(f"%{location}%"))

    if max_price is not None:
        query = query.filter(Listing.price_per_day <= max_price)

    if condition:
        query = query.filter(Listing.condition.ilike(f"%{condition}%"))
        
    listings = query.all()
    results = []
    for item in listings:
        resp = ListingResponse.model_validate(item)
        resp.available_quantity = compute_available_quantity(item, db)
        results.append(resp)
        
    return results

@router.get("/{id}", response_model=ListingResponse)
def get_listing(id: int, db: Session = Depends(get_db)):
    listing = db.query(Listing).filter(Listing.id == id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    resp = ListingResponse.model_validate(listing)
    resp.available_quantity = compute_available_quantity(listing, db)
    return resp

@router.post("", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
def create_listing(
    listing_in: ListingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(Category.id == listing_in.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid category ID"
        )

    db_listing = Listing(
        owner_id=current_user.id,
        title=listing_in.title,
        description=listing_in.description,
        type=listing_in.type,
        category_id=listing_in.category_id,
        availability=listing_in.availability,
        quantity=listing_in.quantity if listing_in.type == "item" else 1,
        image_url=listing_in.image_url,
        location=listing_in.location,
        price_per_day=listing_in.price_per_day,
        condition=listing_in.condition
    )
    db.add(db_listing)
    db.commit()
    db.refresh(db_listing)
    
    resp = ListingResponse.model_validate(db_listing)
    resp.available_quantity = compute_available_quantity(db_listing, db)
    return resp

@router.put("/{id}", response_model=ListingResponse)
def update_listing(
    id: int,
    listing_in: ListingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listing = db.query(Listing).filter(Listing.id == id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if listing.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this listing"
        )
        
    update_data = listing_in.model_dump(exclude_unset=True)
    if "category_id" in update_data:
        category = db.query(Category).filter(Category.id == update_data["category_id"]).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid category ID"
            )

    for field, value in update_data.items():
        setattr(listing, field, value)
        
    db.commit()
    db.refresh(listing)
    
    resp = ListingResponse.model_validate(listing)
    resp.available_quantity = compute_available_quantity(listing, db)
    return resp

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listing = db.query(Listing).filter(Listing.id == id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
        
    if listing.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this listing"
        )
        
    active_requests = db.query(BorrowRequest).filter(
        BorrowRequest.listing_id == id,
        BorrowRequest.status.in_(["pending", "approved", "active"])
    ).first()
    
    if active_requests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete listing with non-terminal borrow requests attached"
        )
        
    db.delete(listing)
    db.commit()
    return
