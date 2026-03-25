import express from "express";
import { supabase } from "../config/supabase";

const router = express.Router();

// GET /stats/players - Get aggregated stats for all players
router.get("/players", async (req, res) => {
  try {
    // Utilisation de la vue SQL optimisée 'player_stats_view'
    // Filtre: Seulement joueurs avec au moins 1 game
    const { data, error } = await supabase
      .from("player_stats_view")
      .select("*")
      .gt("games_played", 0)
      .order("rank", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error("Error aggregating stats:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /stats/teams - Get aggregated stats for all teams
router.get("/teams", async (req, res) => {
  try {
    // Filtre: Seulement équipes avec au moins 1 game
    const { data, error } = await supabase
      .from("team_stats_view")
      .select("*")
      .gt("games_played", 0)
      .order("win_rate", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error("Error aggregating team stats:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
