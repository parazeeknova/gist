-- Fix space_members constraint to enforce exactly one of user_id or group_id
ALTER TABLE space_members
DROP CONSTRAINT IF EXISTS space_members_user_or_group_check;

ALTER TABLE space_members
ADD CONSTRAINT space_members_user_or_group_check
CHECK ((user_id IS NOT NULL) <> (group_id IS NOT NULL));
