-- ============================================================================
-- Backfill: create default "Everyone" group for existing workspaces
-- ============================================================================
-- This migration runs safely for workspaces created before the groups feature.
-- It checks extensively before inserting anything.
-- ============================================================================

DO $$
DECLARE
    ws RECORD;
    owner_user_id UUID;
    new_group_id UUID;
    default_space_uuid UUID;
    workspace_has_default_group BOOLEAN;
    workspace_has_owner BOOLEAN;
BEGIN
    -- Only proceed if the groups table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'groups'
    ) THEN
        RAISE NOTICE 'groups table does not exist, skipping backfill';
        RETURN;
    END IF;

    -- Only proceed if the group_users table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'group_users'
    ) THEN
        RAISE NOTICE 'group_users table does not exist, skipping backfill';
        RETURN;
    END IF;

    -- Iterate over every workspace
    FOR ws IN
        SELECT w.id, w.default_space_id
        FROM workspaces w
        WHERE w.deleted_at IS NULL
    LOOP
        -- Check 1: does this workspace already have a default group?
        SELECT EXISTS (
            SELECT 1 FROM groups g
            WHERE g.workspace_id = ws.id
              AND g.is_default = true
              AND g.deleted_at IS NULL
        ) INTO workspace_has_default_group;

        IF workspace_has_default_group THEN
            CONTINUE;
        END IF;

        -- Check 2: find an owner for this workspace
        SELECT wm.user_id INTO owner_user_id
        FROM workspace_members wm
        WHERE wm.workspace_id = ws.id
          AND wm.role = 'owner'
        LIMIT 1;

        SELECT (owner_user_id IS NOT NULL) INTO workspace_has_owner;

        IF NOT workspace_has_owner THEN
            -- Fallback: pick any member as creator so the group can still be created
            SELECT wm.user_id INTO owner_user_id
            FROM workspace_members wm
            WHERE wm.workspace_id = ws.id
            LIMIT 1;

            IF owner_user_id IS NULL THEN
                RAISE NOTICE 'workspace % has no members, skipping', ws.id;
                CONTINUE;
            END IF;
        END IF;

        -- Create the default group
        INSERT INTO groups (
            id, workspace_id, name, description, is_default, creator_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            ws.id,
            'Everyone',
            'All workspace members',
            true,
            owner_user_id,
            NOW(),
            NOW()
        )
        RETURNING id INTO new_group_id;

        -- Check 3: verify the group was actually created
        IF new_group_id IS NULL THEN
            RAISE NOTICE 'failed to create default group for workspace %, skipping', ws.id;
            CONTINUE;
        END IF;

        -- Add every workspace member to the default group
        INSERT INTO group_users (group_id, user_id, added_at)
        SELECT new_group_id, wm.user_id, NOW()
        FROM workspace_members wm
        WHERE wm.workspace_id = ws.id
          AND NOT EXISTS (
              SELECT 1 FROM group_users gu
              WHERE gu.group_id = new_group_id AND gu.user_id = wm.user_id
          );

        -- Check 4: if the workspace has a default space, add the group to it as writer
        default_space_uuid := ws.default_space_id;

        IF default_space_uuid IS NOT NULL THEN
            -- Verify the space actually exists and is not deleted
            IF EXISTS (
                SELECT 1 FROM spaces s
                WHERE s.id = default_space_uuid AND s.deleted_at IS NULL
            ) THEN
                -- Only insert if not already present
                IF NOT EXISTS (
                    SELECT 1 FROM space_members sm
                    WHERE sm.space_id = default_space_uuid
                      AND sm.group_id = new_group_id
                ) THEN
                    INSERT INTO space_members (space_id, group_id, role, joined_at)
                    VALUES (default_space_uuid, new_group_id, 'writer', NOW());
                END IF;
            END IF;
        END IF;

        RAISE NOTICE 'created default Everyone group % for workspace %', new_group_id, ws.id;
    END LOOP;
END $$;
