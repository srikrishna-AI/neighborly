from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Integer, Boolean, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # "item" or "skill"
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    availability: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # New fields for quantity, image, location, pricing, and condition
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    price_per_day: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    condition: Mapped[str] = mapped_column(String(50), default="Good", nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    owner = relationship("User", back_populates="listings")
    category = relationship("Category", back_populates="listings")
    requests = relationship("BorrowRequest", back_populates="listing", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="listing", cascade="all, delete-orphan")
