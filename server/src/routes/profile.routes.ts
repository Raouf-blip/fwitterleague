import { Router } from "express";
import { supabase } from "../config/supabase";
import { authenticate } from "../middlewares/auth";
import { authorizeAdmin, authorizeSuperAdmin } from "../middlewares/admin";

const router = Router();

// Admin: List all profiles
router.get("/", authenticate, authorizeAdmin, async (req: any, res) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

// SuperAdmin: Delete a user account
router.delete(
  "/:id",
  authenticate,
  authorizeSuperAdmin,
  async (req: any, res) => {
    const targetId = req.params.id;
    if (targetId === req.user.id) {
      return res.status(400).json({
        error:
          "Vous ne pouvez pas supprimer votre propre compte via cette route.",
      });
    }

    // If user is captain, disband their team
    const { data: team } = await supabase
      .from("teams")
      .select("id")
      .eq("captain_id", targetId)
      .maybeSingle();
    if (team) {
      await supabase.from("teams").delete().eq("id", team.id);
    }

    // Delete auth user (cascades profile via RLS/trigger)
    const { error: authError } = await supabase.auth.admin.deleteUser(targetId);
    if (authError) return res.status(400).json({ error: authError.message });

    await supabase.from("profiles").delete().eq("id", targetId);
    res.json({ message: "Utilisateur supprime." });
  },
);

// Private: Get my profile
router.get("/me", authenticate, async (req: any, res) => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", req.user.id)
    .single();
  if (error) {
    if (error.code === "PGRST116")
      return res.status(404).json({ error: "Profil non existant." });
    return res.status(400).json({ error: error.message });
  }

  const { data: member } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("profile_id", req.user.id)
    .maybeSingle();
  let team = null;
  if (member) {
    const { data: teamData } = await supabase
      .from("teams")
      .select("*")
      .eq("id", member.team_id)
      .single();
    if (teamData) {
      const { count } = await supabase
        .from("team_members")
        .select("*", { count: "exact", head: true })
        .eq("team_id", member.team_id);
      team = { ...teamData, member_count: count || 0 };
    }
  }

  // Get Scrim Stats via View
  const { data: statsView } = await supabase
    .from("player_stats_view")
    .select("games_played, wins, losses, kda, avg_cs_min")
    .eq("id", req.user.id)
    .maybeSingle();

  const scrim_stats =
    statsView && statsView.games_played > 0
      ? {
          games_played: statsView.games_played,
          wins: statsView.wins,
          losses: statsView.losses,
          kda: Number(statsView.kda).toFixed(2),
          avg_cs: Number(statsView.avg_cs_min).toFixed(1),
        }
      : null;

  res.json({ ...profile, team, scrim_stats });
});

// Private: Update my profile
router.patch("/me", authenticate, async (req: any, res) => {
  // On empêche la modification manuelle du rôle via cette route
  const { role, is_captain, last_riot_sync, riot_id, ...updateData } = req.body;

  // Autoriser UNIQUEMENT la suppression du riot_id manuelle. L'ajout/modificaiton passe par /sync-riot.
  if (riot_id === "" || riot_id === null) {
    updateData.riot_id = null;
    updateData.rank = "Unranked";
    updateData.winrate = 0;
    updateData.lp = null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", req.user.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Private: Delete my account (GDPR)
router.delete("/me", authenticate, async (req: any, res) => {
  // Case 1: If user is captain, disband their team first
  const { data: team } = await supabase
    .from("teams")
    .select("id, name")
    .eq("captain_id", req.user.id)
    .maybeSingle();

  if (team) {
    // Check if team is locked (active tournament)
    const { checkTeamLock } = await import("../utils/team-lock");
    if (await checkTeamLock(team.id)) {
      return res.status(403).json({
        error:
          "Impossible de supprimer votre compte : votre équipe est engagée dans un tournoi actif.",
      });
    }

    const { data: members } = await supabase
      .from("team_members")
      .select("profile_id")
      .eq("team_id", team.id);
    const profileIds = members?.map((m) => m.profile_id) || [];

    // Notify other members
    const notificationPromises = profileIds
      .filter((id) => id !== req.user.id)
      .map((id) =>
        supabase.from("notifications").insert({
          user_id: id,
          title: "Équipe dissoute",
          message: `Votre équipe ${team.name} a été dissoute car le capitaine a supprimé son compte.`,
          type: "system",
        }),
      );
    await Promise.all(notificationPromises);

    await supabase
      .from("profiles")
      .update({ is_captain: false, is_looking_for_team: false })
      .in("id", profileIds);
    await supabase.from("teams").delete().eq("id", team.id);
  }

  // Note: auth.deleteUser nécessite une clé service_role (déjà configurée dans notre client supabase serveur)
  const { error: authError } = await supabase.auth.admin.deleteUser(
    req.user.id,
  );
  if (authError) return res.status(400).json({ error: authError.message });

  // Le profil sera supprimé via cascade ou manuellement :
  await supabase.from("profiles").delete().eq("id", req.user.id);

  res.json({ message: "Compte supprimé définitivement." });
});

// SuperAdmin Only: Change user role (promote to admin)
router.patch(
  "/:id/role",
  authenticate,
  authorizeSuperAdmin,
  async (req: any, res) => {
    const { role } = req.body;
    if (!["user", "admin", "superadmin"].includes(role)) {
      return res.status(400).json({ error: "Rôle invalide." });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
  },
);

// Public: Get profile by ID
router.get("/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", req.params.id)
    .single();
  if (error) return res.status(404).json({ error: "Profil non trouvé" });

  const { data: member } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("profile_id", req.params.id)
    .maybeSingle();
  let team = null;
  if (member) {
    const { data: teamData } = await supabase
      .from("teams")
      .select("*")
      .eq("id", member.team_id)
      .single();
    team = teamData;
  }

  // Get Scrim Stats via View
  const { data: statsView } = await supabase
    .from("player_stats_view")
    .select("games_played, wins, losses, kda, avg_cs_min")
    .eq("id", req.params.id)
    .maybeSingle();

  const scrim_stats =
    statsView && statsView.games_played > 0
      ? {
          games_played: statsView.games_played,
          wins: statsView.wins,
          losses: statsView.losses,
          kda: Number(statsView.kda).toFixed(2),
          avg_cs: Number(statsView.avg_cs_min).toFixed(1),
        }
      : null;

  res.json({ ...data, team, scrim_stats });
});

// Private: Get my sent applications
router.get("/me/applications", authenticate, async (req: any, res) => {
  const { data, error } = await supabase
    .from("applications")
    .select("*, team:team_id(name, tag)")
    .eq("sender_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Private: Sync Riot Data
router.post("/sync-riot", authenticate, async (req: any, res) => {
  const { riotId } = req.body;

  if (!riotId || !riotId.includes("#")) {
    return res
      .status(400)
      .json({ error: "Format Riot ID invalide (attendu: Nom#TAG)" });
  }

  // Rate Limiter
  const { data: profile } = await supabase
    .from("profiles")
    .select("last_riot_sync")
    .eq("id", req.user.id)
    .single();
  if (profile?.last_riot_sync) {
    const diff =
      new Date().getTime() - new Date(profile.last_riot_sync).getTime();
    if (diff < 2 * 60 * 1000) {
      // 2 minutes de cooldown
      return res.status(429).json({
        error: "Veuillez patienter 2 minutes entre chaque synchronisation.",
      });
    }
  }

  const RIOT_API_KEY =
    process.env.VITE_RIOT_API_KEY || process.env.RIOT_API_KEY;

  if (!RIOT_API_KEY) {
    return res.status(500).json({
      error: "La clé API Riot est manquante dans le fichier .env du serveur.",
    });
  }

  try {
    const [name, tag] = riotId.split("#");

    // Étape 1 : Obtenir le PUUID via Account API (Région Europe)
    const accRes = await fetch(
      `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?api_key=${RIOT_API_KEY}`,
    );
    if (accRes.status === 403)
      throw new Error("La clé API Riot est invalide ou expirée.");
    if (accRes.status === 404)
      throw new Error(
        `Joueur ${name}#${tag} introuvable sur la région Europe.`,
      );
    if (!accRes.ok)
      throw new Error(`Erreur Account API (Status: ${accRes.status})`);

    const accData: any = await accRes.json();
    // Étape 2 : Obtenir le Rang via League API (Région EUW)
    const leaRes = await fetch(
      `https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/${accData.puuid}?api_key=${RIOT_API_KEY}`,
    );
    if (!leaRes.ok)
      throw new Error(`Erreur League API (Status: ${leaRes.status})`);
    const leaData: any = await leaRes.json();

    const soloQ = leaData.find(
      (entry: any) => entry.queueType === "RANKED_SOLO_5x5",
    );
    const rank = soloQ ? `${soloQ.tier} ${soloQ.rank}` : "Unranked";
    const winrate = !soloQ?.inactive
      ? Math.round((soloQ.wins / (soloQ.wins + soloQ.losses)) * 100)
      : 0;
    const lp = soloQ ? soloQ.leaguePoints : null;

    // Mise à jour du profil AVEC le Riot ID puisqu'il est validé
    await supabase
      .from("profiles")
      .update({
        riot_id: riotId,
        rank,
        winrate,
        lp,
        last_riot_sync: new Date().toISOString(),
      })
      .eq("id", req.user.id);

    res.json({ rank, winrate, lp });
  } catch (e: any) {
    console.error("[RiotSync Error]:", e.message);
    res.status(400).json({ error: "Riot Sync Failed: " + e.message });
  }
});

export default router;
