-- Adaptation du schéma existant pour supporter les Scrims "Open" et les Stats Individuelles

-- 1. Modification de la table existante 'scrims'
-- La table existe déjà avec : id, challenger_team_id, challenged_team_id, status, scheduled_at, winner_id, ...
-- On doit la rendre flexible pour supporter les scrims "Open" (sans équipes prédéfinies) et stocker des infos supplémentaires.

DO $$ 
BEGIN
    -- Utilisation de IF NOT EXISTS pour éviter les erreurs lors des ré-exécutions
    
    -- Ajout de la colonne 'type'
    BEGIN
        ALTER TABLE scrims ADD COLUMN type TEXT NOT NULL DEFAULT 'team' CHECK (type IN ('team', 'open'));
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'Column type already exists in scrims.';
    END;

    -- Ajout de la colonne 'creator_id' (Indispensable pour Open Scrims)
    BEGIN
        ALTER TABLE scrims ADD COLUMN creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'Column creator_id already exists in scrims.';
    END;

    -- Ajout de la colonne 'start_time' (Utilisé par le code Scrims)
    BEGIN
        ALTER TABLE scrims ADD COLUMN start_time TIMESTAMPTZ;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'Column start_time already exists in scrims.';
    END;

    -- Ajout de la colonne 'screenshot_url' pour l'OCR
    BEGIN
        ALTER TABLE scrims ADD COLUMN screenshot_url TEXT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'Column screenshot_url already exists in scrims.';
    END;

    -- Mise à jour de la contrainte CHECK sur 'status' pour inclure les nouveaux statuts
    BEGIN
        ALTER TABLE scrims DROP CONSTRAINT IF EXISTS scrims_status_check;
        ALTER TABLE scrims ADD CONSTRAINT scrims_status_check CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled'));
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Error updating status check: %', SQLERRM;
    END;

    -- Rendre les colonnes d'équipe optionnelles (NULLABLE) car non utilisées en mode 'open'
    ALTER TABLE scrims ALTER COLUMN challenger_team_id DROP NOT NULL;
    ALTER TABLE scrims ALTER COLUMN challenged_team_id DROP NOT NULL;
END $$;


-- 2. Création de la table 'scrim_participants' 
-- Nécessaire pour gérer les joueurs individuels dans les Scrims "Open" (Lobby)
CREATE TABLE IF NOT EXISTS scrim_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scrim_id UUID NOT NULL REFERENCES scrims(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  side TEXT CHECK (side IN ('blue', 'red')), 
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scrim_id, user_id)
);


-- 3. Création de la table 'scrim_stats_individual' (Nommé ainsi pour éviter confusion avec stats d'équipe)
-- Pour stocker les statistiques individuelles (KDA, CS) extraites par OCR
CREATE TABLE IF NOT EXISTS scrim_stats_individual (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scrim_id UUID NOT NULL REFERENCES scrims(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  champion_name TEXT,
  kills INT DEFAULT 0,
  deaths INT DEFAULT 0,
  assists INT DEFAULT 0,
  cs INT DEFAULT 0,
  win BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(scrim_id, user_id)
);

-- Activation RLS
ALTER TABLE scrim_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrim_stats_individual ENABLE ROW LEVEL SECURITY;

-- Politiques RLS (Exemples de base)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scrim_participants' AND policyname = 'Public read participants') THEN
        CREATE POLICY "Public read participants" ON scrim_participants FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scrim_participants' AND policyname = 'Users can join') THEN
        CREATE POLICY "Users can join" ON scrim_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scrim_stats_individual' AND policyname = 'Public read stats') THEN
        CREATE POLICY "Public read stats" ON scrim_stats_individual FOR SELECT USING (true);
    END IF;
END $$;
