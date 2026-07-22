from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sender_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    listing_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("listings.id", ondelete="SET NULL"), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")
    listing = relationship("Listing")
