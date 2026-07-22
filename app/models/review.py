from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    request_id: Mapped[int] = mapped_column(Integer, ForeignKey("borrow_requests.id", ondelete="CASCADE"), nullable=False)
    reviewer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 to 5
    comment: Mapped[str] = mapped_column(String(1000), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    request = relationship("BorrowRequest", back_populates="reviews")
    reviewer = relationship("User", back_populates="reviews_written")
