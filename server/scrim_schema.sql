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

    -- Ajout de la colonne 'game_duration' (en secondes)
    BEGIN
        ALTER TABLE scrims ADD COLUMN game_duration INT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'Column game_duration already exists in scrims.';
    END;

    -- Ajout de la colonne 'is_validated' pour la validation par un admin
    BEGIN
        ALTER TABLE scrims ADD COLUMN is_validated BOOLEAN DEFAULT FALSE;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'Column is_validated already exists in scrims.';
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
  role TEXT, -- Added role column
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scrim_id, user_id)
);

-- Migration pour ajouter la colonne 'role' si la table 'scrim_participants' existe déjà sans
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE scrim_participants ADD COLUMN role TEXT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'Column role already exists in scrim_participants.';
    END;
END $$;




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
  cs_min FLOAT DEFAULT 0,
  win BOOLEAN DEFAULT FALSE,
  role TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(scrim_id, user_id)
);

-- Migration pour ajouter la colonne 'role' si la table existait déjà sans
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE scrim_stats_individual ADD COLUMN role TEXT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'Column role already exists in scrim_stats_individual.';
    END;
END $$;

-- Migration pour ajouter cs_min si ce n'est pas fait (retro-compat)
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE scrim_stats_individual ADD COLUMN cs_min FLOAT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'Column cs_min already exists in scrim_stats_individual.';
    END;
END $$;

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


-- 5. Vues SQL pour l'optimisation des statistiques
-- Vue pour le classement des joueurs (Player Stats)
CREATE OR REPLACE VIEW player_stats_view AS
SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.rank,
    p.lp,
    COALESCE(st.games_played, 0) as games_played,
    COALESCE(st.wins, 0) as wins,
    COALESCE(st.losses, 0) as losses,
    COALESCE(st.kills, 0) as kills,
    COALESCE(st.deaths, 0) as deaths,
    COALESCE(st.assists, 0) as assists,
    COALESCE(st.avg_cs_min, 0) as avg_cs_min,
    CASE 
        WHEN COALESCE(st.games_played, 0) > 0 THEN (CAST(COALESCE(st.wins, 0) AS FLOAT) / st.games_played) * 100 
        ELSE 0 
    END as win_rate,
    CASE 
        WHEN COALESCE(st.deaths, 0) = 0 THEN CAST(COALESCE(st.kills, 0) + COALESCE(st.assists, 0) AS FLOAT) 
        ELSE (CAST(COALESCE(st.kills, 0) + COALESCE(st.assists, 0) AS FLOAT) / st.deaths) 
    END as kda
FROM profiles p
LEFT JOIN (
    SELECT 
        s.user_id,
        COUNT(*) as games_played,
        COUNT(CASE WHEN s.win THEN 1 END) as wins,
        COUNT(CASE WHEN NOT s.win THEN 1 END) as losses,
        SUM(s.kills) as kills,
        SUM(s.deaths) as deaths,
        SUM(s.assists) as assists,
        AVG(s.cs_min) as avg_cs_min
    FROM scrim_stats_individual s
    JOIN scrims sc ON s.scrim_id = sc.id
    WHERE sc.is_validated = TRUE
    GROUP BY s.user_id
) st ON p.id = st.user_id;

-- Vue pour le classement des équipes (Team Stats)
CREATE OR REPLACE VIEW team_stats_view AS
SELECT 
    t.id,
    t.name,
    t.tag,
    t.logo_url,
    COUNT(s.id) as games_played,
    COUNT(CASE WHEN s.winner_id = t.id THEN 1 END) as wins,
    COUNT(CASE WHEN s.winner_id IS NOT NULL AND s.winner_id != t.id THEN 1 END) as losses,
    CASE 
        WHEN COUNT(s.id) > 0 THEN (CAST(COUNT(CASE WHEN s.winner_id = t.id THEN 1 END) AS FLOAT) / COUNT(s.id)) * 100 
        ELSE 0 
    END as win_rate
FROM teams t
LEFT JOIN scrims s ON (s.challenger_team_id = t.id OR s.challenged_team_id = t.id) AND s.status = 'completed' AND s.is_validated = TRUE
GROUP BY t.id;

-- 4. Configuration du Storage pour les screenshots de Scrims
-- Nécessaire pour l'upload des captures d'écran
INSERT INTO storage.buckets (id, name, public)
VALUES ('scrim-screenshots', 'scrim-screenshots', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Politiques de sécurité pour le bucket 'scrim-screenshots'
DO $$
BEGIN
    -- Lecture publique pour tout le monde
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Scrim Screenshots' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Public Access Scrim Screenshots" ON storage.objects FOR SELECT USING (bucket_id = 'scrim-screenshots');
    END IF;

    -- Upload autorisé pour les utilisateurs connectés
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Upload Scrim Screenshots' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Authenticated Upload Scrim Screenshots" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'scrim-screenshots' AND auth.role() = 'authenticated');
    END IF;
END $$;
