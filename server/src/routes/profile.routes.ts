import { Router } from "express";
import { supabase } from "../config/supabase";
import { authenticate } from "../middlewares/auth";
import { authorizeAdmin, authorizeSuperAdmin } from "../middlewares/admin";

const router = Router();

// Admin: List all profiles (with team info)
router.get('/', authenticate, authorizeAdmin, async (req: any, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, team_members(team_id, team:team_id(id, name, tag))')
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });

  // Flatten team info
  const result = (data || []).map((p: any) => {
    const memberInfo = p.team_members && p.team_members.length > 0 ? p.team_members[0] : null;
    return {
      ...p,
      team: memberInfo ? memberInfo.team : null,
      team_members: undefined
    };
  });

  res.json(result);
});

// Private: Delete my account (GDPR)
router.delete("/me", authenticate, async (req: any, res) => {
  const { data: team } = await supabase
    .from("teams")
    .select("id, name")
    .eq("captain_id", req.user.id)
    .maybeSingle();

  if (team) {
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

  const { error: authError } = await supabase.auth.admin.deleteUser(
    req.user.id,
  );
  if (authError) return res.status(400).json({ error: authError.message });

  await supabase.from("profiles").delete().eq("id", req.user.id);

  res.json({ message: "Compte supprimé définitivement." });
});

// SuperAdmin: Delete a user account (HEAD version with explicit cleanup)
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

  try {
    // 1. If user is captain, disband their team (this also deletes team_members for that team)
    const { data: captainTeam } = await supabase.from('teams').select('id').eq('captain_id', targetId).maybeSingle();
    if (captainTeam) {
      await supabase.from('team_members').delete().eq('team_id', captainTeam.id);
      await supabase.from('applications').delete().eq('team_id', captainTeam.id);
      await supabase.from('teams').delete().eq('id', captainTeam.id);
    }

    // 2. Remove user from any team they belong to as a member
    await supabase.from('team_members').delete().eq('profile_id', targetId);

    // 3. Clean up applications (sent or received via sender_id)
    await supabase.from('applications').delete().eq('sender_id', targetId);

    // 4. Clean up notifications
    await supabase.from('notifications').delete().eq('user_id', targetId);

    // 5. Delete the profile
    await supabase.from('profiles').delete().eq('id', targetId);

    // 6. Delete the auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(targetId);
    if (authError) {
      console.error('[DeleteUser] Auth deletion error:', authError.message);
      // Profile is already gone, just log the auth error
    }

    res.json({ message: 'Utilisateur supprimé.' });
  } catch (e: any) {
    console.error('[DeleteUser] Error:', e.message);
    res.status(500).json({ error: 'Erreur lors de la suppression: ' + e.message });
  }
});

// Private: Get my profile (Scrim version with stats)
router.get("/me", authenticate, async (req: any, res) => {
  const userId = req.user.id;

  const [profileResult, memberResult, statsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("team_members").select("team_id").eq("profile_id", userId).maybeSingle(),
    supabase.from("player_stats_view").select("games_played, wins, losses, kda, avg_cs_min").eq("id", userId).maybeSingle(),
  ]);

  if (profileResult.error) {
    if (profileResult.error.code === "PGRST116")
      return res.status(404).json({ error: "Profil non existant." });
    return res.status(400).json({ error: profileResult.error.message });
  }

  let team = null;
  if (memberResult.data) {
    const teamId = memberResult.data.team_id;
    const [teamResult, countResult] = await Promise.all([
      supabase.from("teams").select("*").eq("id", teamId).single(),
      supabase.from("team_members").select("*", { count: "exact", head: true }).eq("team_id", teamId),
    ]);
    if (teamResult.data) {
      team = { ...teamResult.data, member_count: countResult.count || 0 };
    }
  }

  const statsView = statsResult.data;
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

  res.json({ ...profileResult.data, team, scrim_stats });
});

// Private: Update my profile
router.patch("/me", authenticate, async (req: any, res) => {
  const ALLOWED_FIELDS = ['username', 'bio', 'avatar_url', 'preferred_roles', 'is_looking_for_team'];
  const updateData: Record<string, any> = {};
  for (const key of ALLOWED_FIELDS) {
    if (req.body[key] !== undefined) updateData[key] = req.body[key];
  }

  // Autoriser UNIQUEMENT la suppression du riot_id manuelle. L'ajout/modification passe par /sync-riot.
  if (req.body.riot_id === "" || req.body.riot_id === null) {
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

// Admin: Change user status
router.patch('/:id/status', authenticate, authorizeAdmin, async (req: any, res) => {
  const { is_captain, is_looking_for_team, is_caster } = req.body;
  const updateData: any = {};
  if (is_captain !== undefined) updateData.is_captain = is_captain;
  if (is_looking_for_team !== undefined) updateData.is_looking_for_team = is_looking_for_team;
  if (is_caster !== undefined) updateData.is_caster = is_caster;

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

const PUBLIC_PROFILE_COLUMNS = 'id, username, avatar_url, bio, rank, lp, winrate, riot_id, discord, discord_id, preferred_roles, is_looking_for_team, is_captain, is_caster, role, created_at';

// Public: Get profile by ID
router.get("/:id", async (req, res) => {
  const targetId = req.params.id;

  const [profileResult, memberResult, statsResult] = await Promise.all([
    supabase.from("profiles").select(PUBLIC_PROFILE_COLUMNS).eq("id", targetId).single(),
    supabase.from("team_members").select("team_id").eq("profile_id", targetId).maybeSingle(),
    supabase.from("player_stats_view").select("games_played, wins, losses, kda, avg_cs_min").eq("id", targetId).maybeSingle(),
  ]);

  if (profileResult.error) return res.status(404).json({ error: "Profil non trouvé" });

  let team = null;
  if (memberResult.data) {
    const { data: teamData } = await supabase
      .from("teams")
      .select("*")
      .eq("id", memberResult.data.team_id)
      .single();
    team = teamData;
  }

  const statsView = statsResult.data;
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

  res.json({ ...profileResult.data, team, scrim_stats });
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
  const { data: profile } = await supabase.from('profiles').select('last_riot_sync, riot_id').eq('id', req.user.id).single();

  // Cooldown only if we are syncing the SAME ID. If it's a new ID, we allow it to bypass the timer.
  if (profile?.last_riot_sync && profile.riot_id === riotId) {
    const diff = new Date().getTime() - new Date(profile.last_riot_sync).getTime();
    if (diff < 2 * 60 * 1000) { // 2 minutes de cooldown
      return res.status(429).json({ error: 'Veuillez patienter 2 minutes entre chaque synchronisation.' });
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
    const rankedSolo = leaData.find(
      (entry: any) => entry.queueType === "RANKED_SOLO_5x5",
    );

    let rank = "Unranked";
    let tier = "";
    let lp = 0;
    let winrate = 0;

    if (rankedSolo) {
      tier = rankedSolo.tier;
      rank = `${rankedSolo.tier} ${rankedSolo.rank}`;
      lp = rankedSolo.leaguePoints;
      const total = rankedSolo.wins + rankedSolo.losses;
      winrate = total > 0 ? Math.round((rankedSolo.wins / total) * 100) : 0;
    }

    // Update Profile
    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({
        riot_id: `${accData.gameName}#${accData.tagLine}`,
        rank,
        lp,
        winrate,
        last_riot_sync: new Date().toISOString(),
      })
      .eq("id", req.user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json(updated);
  } catch (err: any) {
    console.error("Riot Sync Error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
