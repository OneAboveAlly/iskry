-- Add archived column to notifications table with default value false
ALTER TABLE "Notification" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false; 