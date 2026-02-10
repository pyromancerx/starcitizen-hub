# app/routers/notification.py
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_approved_user, require_permission
from app.models.user import User
from app.models.notification import NotificationType
from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
    NotificationPreferenceResponse,
    NotificationPreferenceUpdate,
    MarkReadRequest,
    UnreadCountResponse,
)
from app.services.notification import NotificationService

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/", response_model=NotificationListResponse)
async def get_my_notifications(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Get the current user's notifications."""
    service = NotificationService(db)
    notifications, unread_count, total_count = await service.get_user_notifications(
        user_id=current_user.id,
        unread_only=unread_only,
        limit=limit,
        offset=offset,
    )
    
    return NotificationListResponse(
        notifications=[
            NotificationResponse(
                id=n.id,
                type=n.type,
                title=n.title,
                message=n.message,
                link=n.link,
                data=n.data,
                priority=n.priority,
                user_id=n.user_id,
                is_read=n.is_read,
                read_at=n.read_at,
                triggered_by_id=n.triggered_by_id,
                triggered_by_name=getattr(n, 'triggered_by_name', None),
                created_at=n.created_at,
            )
            for n in notifications
        ],
        unread_count=unread_count,
        total_count=total_count,
        has_more=offset + len(notifications) < total_count,
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get the count of unread notifications for the current user."""
    service = NotificationService(db)
    _, unread_count, _ = await service.get_user_notifications(
        user_id=current_user.id,
        unread_only=True,
        limit=1,
    )
    
    return UnreadCountResponse(
        count=unread_count,
        has_unread=unread_count > 0,
    )


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get a specific notification."""
    service = NotificationService(db)
    notification = await service.get_notification_by_id(
        notification_id=notification_id,
        user_id=current_user.id,
    )
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Auto-mark as read when viewed
    if not notification.is_read:
        notification = await service.mark_as_read(notification)
    
    return NotificationResponse(
        id=notification.id,
        type=notification.type,
        title=notification.title,
        message=notification.message,
        link=notification.link,
        data=notification.data,
        priority=notification.priority,
        user_id=notification.user_id,
        is_read=notification.is_read,
        read_at=notification.read_at,
        triggered_by_id=notification.triggered_by_id,
        triggered_by_name=getattr(notification, 'triggered_by_name', None),
        created_at=notification.created_at,
    )


@router.post("/mark-read", response_model=dict)
async def mark_notifications_read(
    data: MarkReadRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Mark notifications as read. If no IDs provided, marks all as read."""
    service = NotificationService(db)
    
    if data.notification_ids:
        # Mark specific notifications as read
        count = 0
        for notification_id in data.notification_ids:
            notification = await service.get_notification_by_id(
                notification_id=notification_id,
                user_id=current_user.id,
            )
            if notification:
                await service.mark_as_read(notification)
                count += 1
        return {"marked_read": count}
    else:
        # Mark all as read
        count = await service.mark_all_as_read(current_user.id)
        return {"marked_read": count}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Delete a notification."""
    service = NotificationService(db)
    notification = await service.get_notification_by_id(
        notification_id=notification_id,
        user_id=current_user.id,
    )
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    await service.delete_notification(notification)


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_read_notifications(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Delete all read notifications."""
    service = NotificationService(db)
    await service.delete_all_read(current_user.id)


# === Preferences Endpoints ===

@router.get("/preferences/me", response_model=NotificationPreferenceResponse)
async def get_my_preferences(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get the current user's notification preferences."""
    service = NotificationService(db)
    pref = await service.get_or_create_preferences(current_user.id)
    
    return NotificationPreferenceResponse(
        id=pref.id,
        user_id=pref.user_id,
        notifications_enabled=pref.notifications_enabled,
        enabled_types=pref.enabled_types,
        disabled_types=pref.disabled_types or [],
        created_at=pref.created_at,
        updated_at=pref.updated_at,
    )


@router.put("/preferences/me", response_model=NotificationPreferenceResponse)
async def update_my_preferences(
    data: NotificationPreferenceUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Update the current user's notification preferences."""
    service = NotificationService(db)
    pref = await service.update_preferences(current_user.id, data)
    
    return NotificationPreferenceResponse(
        id=pref.id,
        user_id=pref.user_id,
        notifications_enabled=pref.notifications_enabled,
        enabled_types=pref.enabled_types,
        disabled_types=pref.disabled_types or [],
        created_at=pref.created_at,
        updated_at=pref.updated_at,
    )


@router.post("/preferences/me/enable/{notification_type}")
async def enable_notification_type(
    notification_type: NotificationType,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Enable a specific notification type."""
    service = NotificationService(db)
    pref = await service.enable_notification_type(current_user.id, notification_type)
    
    return {"message": f"{notification_type.value} notifications enabled"}


@router.post("/preferences/me/disable/{notification_type}")
async def disable_notification_type(
    notification_type: NotificationType,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Disable a specific notification type."""
    service = NotificationService(db)
    pref = await service.disable_notification_type(current_user.id, notification_type)
    
    return {"message": f"{notification_type.value} notifications disabled"}


@router.get("/types/available", response_model=List[str])
async def get_available_notification_types(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get all available notification types."""
    return [t.value for t in NotificationType]
