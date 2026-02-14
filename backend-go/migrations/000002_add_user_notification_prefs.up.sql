-- Add notification preferences to users
ALTER TABLE users ADD COLUMN notification_settings JSON DEFAULT '{"announcements": {"email": true, "discord": false, "in_app": true}, "messages": {"email": false, "discord": false, "in_app": true}}';
