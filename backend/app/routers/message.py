# app/routers/message.py
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_approved_user
from app.models.user import User
from app.schemas.message import (
    MessageCreate,
    MessageResponse,
    ConversationCreate,
    ConversationResponse,
    ConversationDetailResponse,
    ConversationListResponse,
    SendMessageRequest,
    MarkReadRequest,
    UnreadCountResponse,
)
from app.services.message import MessageService

router = APIRouter(prefix="/api/messages", tags=["messages"])


@router.get("/conversations", response_model=ConversationListResponse)
async def get_my_conversations(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Get all conversations for the current user."""
    service = MessageService(db)
    conversations = await service.get_user_conversations(
        user_id=current_user.id,
        limit=limit,
        offset=offset
    )
    
    # Get total unread count
    total_unread = await service.get_unread_count(current_user.id)
    
    # Format response
    result = []
    for conv in conversations:
        # Determine which user is the other participant
        is_user1 = conv.user1_id == current_user.id
        other_user_id = conv.user2_id if is_user1 else conv.user1_id
        unread_count = conv.unread_count_user1 if is_user1 else conv.unread_count_user2
        
        # Get other user info
        other_user = conv.user2 if is_user1 else conv.user1
        
        result.append(ConversationResponse(
            id=conv.id,
            user1_id=conv.user1_id,
            user2_id=conv.user2_id,
            other_user_id=other_user_id,
            other_user_name=other_user.display_name if other_user else f"User {other_user_id}",
            other_user_avatar=other_user.avatar_url if other_user else None,
            last_message_at=conv.last_message_at,
            last_message_preview=conv.last_message_preview,
            last_message_sender_id=conv.last_message_sender_id,
            unread_count=unread_count,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
        ))
    
    return ConversationListResponse(
        conversations=result,
        total_unread=total_unread
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Get a specific conversation with messages."""
    service = MessageService(db)
    
    # Get conversation
    conversation = await service.get_conversation_by_id(conversation_id, current_user.id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Get messages
    messages = await service.get_conversation_messages(
        conversation_id=conversation_id,
        user_id=current_user.id,
        limit=limit,
        offset=offset
    )
    
    # Mark messages as read
    await service.mark_messages_as_read(conversation_id, current_user.id)
    
    # Format response
    is_user1 = conversation.user1_id == current_user.id
    other_user_id = conversation.user2_id if is_user1 else conversation.user1_id
    other_user = conversation.user2 if is_user1 else conversation.user1
    unread_count = conversation.unread_count_user1 if is_user1 else conversation.unread_count_user2
    
    # Format messages
    message_responses = []
    for msg in reversed(messages):  # Reverse to show oldest first
        message_responses.append(MessageResponse(
            id=msg.id,
            conversation_id=msg.conversation_id,
            sender_id=msg.sender_id,
            sender_name=msg.sender.display_name if msg.sender else None,
            content=msg.content,
            is_read=msg.is_read,
            read_at=msg.read_at,
            created_at=msg.created_at,
            is_me=msg.sender_id == current_user.id,
        ))
    
    return ConversationDetailResponse(
        id=conversation.id,
        user1_id=conversation.user1_id,
        user2_id=conversation.user2_id,
        other_user_id=other_user_id,
        other_user_name=other_user.display_name if other_user else f"User {other_user_id}",
        other_user_avatar=other_user.avatar_url if other_user else None,
        last_message_at=conversation.last_message_at,
        last_message_preview=conversation.last_message_preview,
        last_message_sender_id=conversation.last_message_sender_id,
        unread_count=0,  # Reset after marking as read
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=message_responses,
    )


@router.post("/send", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    data: SendMessageRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Send a message to another user."""
    service = MessageService(db)
    
    # Prevent messaging yourself
    if data.recipient_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send message to yourself"
        )
    
    message = await service.send_message(
        sender_id=current_user.id,
        recipient_id=data.recipient_id,
        content=data.content
    )
    
    return MessageResponse(
        id=message.id,
        conversation_id=message.conversation_id,
        sender_id=message.sender_id,
        sender_name=current_user.display_name,
        content=message.content,
        is_read=message.is_read,
        read_at=message.read_at,
        created_at=message.created_at,
        is_me=True,
    )


@router.post("/conversations/{conversation_id}/read", response_model=dict)
async def mark_conversation_read(
    conversation_id: int,
    data: MarkReadRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Mark messages in a conversation as read."""
    service = MessageService(db)
    
    count = await service.mark_messages_as_read(
        conversation_id=conversation_id,
        user_id=current_user.id,
        message_ids=data.message_ids
    )
    
    return {"marked_read": count}


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get total unread message count."""
    service = MessageService(db)
    count = await service.get_unread_count(current_user.id)
    
    return UnreadCountResponse(
        total_unread=count,
        has_unread=count > 0
    )


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Delete a conversation (marks it as deleted for the user)."""
    service = MessageService(db)
    
    success = await service.delete_conversation(conversation_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
