# Migration Instructions for Scrim Results Update

To support the new "Game Duration" and "Screenshot URL" features in Scrim Results, please run the following SQL commands in your Supabase SQL Editor:

```sql
-- Add columns to 'scrims' table if they don't exist
DO $$
BEGIN
    -- Add 'screenshot_url'
    BEGIN
        ALTER TABLE scrims ADD COLUMN screenshot_url TEXT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'Column screenshot_url already exists in scrims.';
    END;

    -- Add 'game_duration' (in seconds)
    BEGIN
        ALTER TABLE scrims ADD COLUMN game_duration INT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'Column game_duration already exists in scrims.';
    END;
END $$;
```

These changes are required for the new "Saisie des Résultats" form to work correctly.
