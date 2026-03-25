import express from "express";
import { supabase } from "../config/supabase";

const router = express.Router();

// GET /stats/players - Get aggregated stats for all players
router.get("/players", async (req, res) => {
  try {
    // We want to fetch all stats and join with profiles.
    // Since Supabase JS client doesn't support complex aggregations very well directly on joined tables without views or RPCs,
    // we might need to fetch data and aggregate in memory for now, or use a raw query if we had a direct pg connection (which we don't here, we use supabase-js).
    // Alternatively, we use .rpc() if we create a function, but let's try to do it in JS for simplicity as we can't easily run migrations for functions here.

    // 1. Fetch all individual stats with profile info
    const { data: stats, error } = await supabase.from("scrim_stats_individual")
      .select(`
        *,
        profile:user_id (
          id,
          username,
          avatar_url,
          rank
        )
      `);

    if (error) throw error;

    // 2. Fetch all profiles to include players with 0 games?
    // The requirement says "listes de tous les joueurs", so we should also include those who haven't improved.
    // Let's fetch all profiles first.
    const { data: allProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, rank, lp");

    if (profileError) throw profileError;

    // 3. Aggregate stats
    const playerStatsMap = new Map();

    // Initialize with all profiles
    allProfiles.forEach((p: any) => {
      playerStatsMap.set(p.id, {
        id: p.id,
        username: p.username,
        avatar_url: p.avatar_url,
        rank: p.rank,
        lp: p.lp, // Added LP
        games_played: 0,
        wins: 0,
        losses: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        cs: 0,
        cs_min_total: 0,
        win_rate: 0,
        kda: 0,
        cs_min_avg: 0,
      });
    });

    // Process stats
    stats.forEach((s: any) => {
      if (playerStatsMap.has(s.user_id)) {
        const p = playerStatsMap.get(s.user_id);
        p.games_played++;
        if (s.win) p.wins++;
        else p.losses++;

        p.kills += s.kills || 0;
        p.deaths += s.deaths || 0;
        p.assists += s.assists || 0;
        p.cs += s.cs || 0;
        p.cs_min_total += s.cs_min || 0;
      }
    });

    // Calculate averages and ratios, and filter out players with 0 games
    const aggregated = Array.from(playerStatsMap.values())
      .filter((p) => p.games_played > 0) // Filter inactive players
      .map((p) => {
        // Win Rate
        p.win_rate = p.games_played > 0 ? (p.wins / p.games_played) * 100 : 0;

        // KDA
        // (K + A) / D. If D is 0, treat as 1 (or handle infinity).
        const deaths = p.deaths === 0 ? 1 : p.deaths;
        p.kda = (p.kills + p.assists) / deaths;

        // CS/min Avg
        p.cs_min_avg = p.games_played > 0 ? p.cs_min_total / p.games_played : 0;

        // Clean up internal fields if needed (like cs_min_total)
        delete p.cs_min_total;

        return p;
      });

    res.json(aggregated);
  } catch (error: any) {
    console.error("Error fetching player stats:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
