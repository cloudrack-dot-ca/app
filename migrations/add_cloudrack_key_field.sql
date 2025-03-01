-- Add isCloudRackKey field to ssh_keys table
ALTER TABLE ssh_keys ADD COLUMN IF NOT EXISTS is_cloudrack_key BOOLEAN NOT NULL DEFAULT FALSE;