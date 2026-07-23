from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, and_, desc
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.message import Message
from app.models.user import User
from app.schemas.message import MessageCreate, MessageResponse, ConversationSummary
from app.schemas.user import UserResponse

router = APIRouter(prefix="/messages", tags=["messages"])

@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    msg_in: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if msg_in.receiver_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot message yourself"
        )

    receiver = db.query(User).filter(User.id == msg_in.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receiver user not found")

    message = Message(
        sender_id=current_user.id,
        receiver_id=msg_in.receiver_id,
        content=msg_in.content,
        listing_id=msg_in.listing_id
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message

@router.get("/conversations", response_model=List[ConversationSummary])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find all users with whom the current user has exchanged messages
    messages = db.query(Message).filter(
        or_(
            Message.sender_id == current_user.id,
            Message.receiver_id == current_user.id
        )
    ).order_by(desc(Message.created_at)).all()

    seen_user_ids = set()
    conversations = []

    for msg in messages:
        other_user_id = msg.receiver_id if msg.sender_id == current_user.id else msg.sender_id
        if other_user_id not in seen_user_ids:
            seen_user_ids.add(other_user_id)
            other_user = db.query(User).filter(User.id == other_user_id).first()
            if other_user:
                conversations.append(
                    ConversationSummary(
                        other_user=UserResponse.model_validate(other_user),
                        last_message=MessageResponse.model_validate(msg)
                    )
                )

    return conversations

@router.get("/with/{user_id}", response_model=List[MessageResponse])
def get_messages_with_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == user_id),
            and_(Message.sender_id == user_id, Message.receiver_id == current_user.id)
        )
    ).order_by(Message.created_at.asc()).all()

    return messages
