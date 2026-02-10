# app/services/message.py
from typing import Optional, List
from datetime import datetime
from sqlalchemy import select, desc, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.message import Conversation, Message
from app.models.user import User
from app.schemas.message import MessageCreate, ConversationCreate
from app.services.notification import NotificationService


class MessageService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_conversation(
        self,
        user1_id: int,
        user2_id: int,
    ) -> Conversation:
        """Get existing conversation or create a new one between two users."""
        # Ensure user1_id is always the smaller ID for consistency
        uid1, uid2 = min(user1_id, user2_id), max(user1_id, user2_id)
        
        # Check if conversation exists
        result = await self.db.execute(
            select(Conversation).where(
                and_(
                    Conversation.user1_id == uid1,
                    Conversation.user2_id == uid2
                )
            )
        )
        conversation = result.scalar_one_or_none()
        
        if conversation:
            return conversation
        
        # Create new conversation
        conversation = Conversation(
            user1_id=uid1,
            user2_id=uid2,
            unread_count_user1=0,
            unread_count_user2=0,
        )
        self.db.add(conversation)
        await self.db.commit()
        await self.db.refresh(conversation)
        return conversation

    async def send_message(
        self,
        sender_id: int,
        recipient_id: int,
        content: str,
    ) -> Message:
        """Send a message to another user."""
        # Get or create conversation
        conversation = await self.get_or_create_conversation(sender_id, recipient_id)
        
        # Create message
        message = Message(
            conversation_id=conversation.id,
            sender_id=sender_id,
            content=content,
            is_read=False,
        )
        self.db.add(message)
        
        # Update conversation metadata
        conversation.last_message_at = datetime.utcnow()
        conversation.last_message_preview = content[:100] if len(content) > 100 else content
        conversation.last_message_sender_id = sender_id
        
        # Increment unread count for recipient
        if recipient_id == conversation.user1_id:
            conversation.unread_count_user1 += 1
        else:
            conversation.unread_count_user2 += 1
        
        await self.db.commit()
        await self.db.refresh(message)
        
        # Send notification to recipient
        await self._send_message_notification(sender_id, recipient_id, content, conversation.id)
        
        return message

    async def _send_message_notification(
        self,
        sender_id: int,
        recipient_id: int,
        content: str,
        conversation_id: int,
    ) -> None:
        """Send a notification about a new message."""
        # Get sender name
        result = await self.db.execute(
            select(User.display_name).where(User.id == sender_id)
        )
        sender_name = result.scalar() or f"User {sender_id}"
        
        # Create notification
        notification_service = NotificationService(self.db)
        await notification_service.create_notification(
            user_id=recipient_id,
            notification_type="message_received",
            title="New Message",
            message=f"{sender_name}: {content[:50]}{'...' if len(content) > 50 else ''}",
            link=f"/messages/{conversation_id}",
            data={
                "conversation_id": conversation_id,
                "sender_id": sender_id,
                "sender_name": sender_name,
            },
            triggered_by_id=sender_id,
        )

    async def get_conversation_messages(
        self,
        conversation_id: int,
        user_id: int,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Message]:
        """Get messages in a conversation for a specific user."""
        # Verify user is part of this conversation
        result = await self.db.execute(
            select(Conversation).where(
                and_(
                    Conversation.id == conversation_id,
                    or_(
                        Conversation.user1_id == user_id,
                        Conversation.user2_id == user_id
                    )
                )
            )
        )
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            return []
        
        # Get messages, excluding those deleted by this user
        is_user1 = conversation.user1_id == user_id
        delete_filter = Message.deleted_by_user1 if is_user1 else Message.deleted_by_recipient
        
        result = await self.db.execute(
            select(Message)
            .where(
                and_(
                    Message.conversation_id == conversation_id,
                    delete_filter == False
                )
            )
            .order_by(desc(Message.created_at))
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_user_conversations(
        self,
        user_id: int,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Conversation]:
        """Get all conversations for a user."""
        result = await self.db.execute(
            select(Conversation)
            .where(
                or_(
                    Conversation.user1_id == user_id,
                    Conversation.user2_id == user_id
                )
            )
            .order_by(desc(Conversation.last_message_at))
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_conversation_by_id(
        self,
        conversation_id: int,
        user_id: int,
    ) -> Optional[Conversation]:
        """Get a specific conversation if user is a participant."""
        result = await self.db.execute(
            select(Conversation).where(
                and_(
                    Conversation.id == conversation_id,
                    or_(
                        Conversation.user1_id == user_id,
                        Conversation.user2_id == user_id
                    )
                )
            )
        )
        return result.scalar_one_or_none()

    async def mark_messages_as_read(
        self,
        conversation_id: int,
        user_id: int,
        message_ids: Optional[List[int]] = None,
    ) -> int:
        """Mark messages as read. Returns count of marked messages."""
        # Get conversation
        conversation = await self.get_conversation_by_id(conversation_id, user_id)
        if not conversation:
            return 0
        
        # Build query
        query = select(Message).where(
            and_(
                Message.conversation_id == conversation_id,
                Message.sender_id != user_id,  # Only mark others' messages
                Message.is_read == False
            )
        )
        
        if message_ids:
            query = query.where(Message.id.in_(message_ids))
        
        result = await self.db.execute(query)
        messages = result.scalars().all()
        
        count = 0
        for message in messages:
            message.is_read = True
            message.read_at = datetime.utcnow()
            count += 1
        
        # Reset unread count for this user
        if conversation.user1_id == user_id:
            conversation.unread_count_user1 = 0
        else:
            conversation.unread_count_user2 = 0
        
        await self.db.commit()
        return count

    async def get_unread_count(self, user_id: int) -> int:
        """Get total unread message count for a user."""
        result = await self.db.execute(
            select(func.count(Message.id))
            .join(Conversation)
            .where(
                and_(
                    or_(
                        and_(
                            Conversation.user1_id == user_id,
                            Conversation.unread_count_user1 > 0
                        ),
                        and_(
                            Conversation.user2_id == user_id,
                            Conversation.unread_count_user2 > 0
                        )
                    )
                )
            )
        )
        
        # Alternative: count unread messages directly
        result = await self.db.execute(
            select(func.count(Message.id))
            .join(Conversation)
            .where(
                and_(
                    Message.is_read == False,
                    Message.sender_id != user_id,
                    or_(
                        Conversation.user1_id == user_id,
                        Conversation.user2_id == user_id
                    )
                )
            )
        )
        return result.scalar() or 0

    async def delete_conversation(
        self,
        conversation_id: int,
        user_id: int,
    ) -> bool:
        """Delete a conversation for a user (marks all messages as deleted for them)."""
        conversation = await self.get_conversation_by_id(conversation_id, user_id)
        if not conversation:
            return False
        
        # Mark all messages as deleted for this user
        is_user1 = conversation.user1_id == user_id
        
        result = await self.db.execute(
            select(Message).where(Message.conversation_id == conversation_id)
        )
        messages = result.scalars().all()
        
        for message in messages:
            if is_user1:
                message.deleted_by_user1 = True
            else:
                message.deleted_by_recipient = True
        
        # If both users have deleted, we could delete the conversation entirely
        # For now, just mark it
        await self.db.commit()
        return True

    async def get_other_user_in_conversation(
        self,
        conversation: Conversation,
        user_id: int,
    ) -> int:
        """Get the other user's ID in a conversation."""
        return conversation.user2_id if conversation.user1_id == user_id else conversation.user1_id
