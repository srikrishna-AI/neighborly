from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)

    # Relationships
    listings = relationship("Listing", back_populates="category")
