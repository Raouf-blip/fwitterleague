import { Router } from "express";
import { supabase } from "../config/supabase";
import { authenticate } from "../middlewares/auth";
import { analyzeScreenshot } from "../services/ai.service";

const router = Router();

// GET / - List all scrims (with filters)
router.get("/", async (req, res) => {
  const { type, status } = req.query;

  let query = supabase
    .from("scrims")
    .select(
      `
      *,
      creator:profiles!creator_id(username, id),
      challenger_team:teams!challenger_team_id(name, tag, logo_url, captain_id),
      challenged_team:teams!challenged_team_id(name, tag, logo_url, captain_id),
      participants:scrim_participants(id)
    `,
    )
    .order("scheduled_at", { ascending: true });

  if (type) query = query.eq("type", type);
  // Default to showing pending/scheduled unless specified
  if (status) {
    query = query.eq("status", status);
  } else {
    // Par défaut on ne montre pas les annulés/a venir trop loin?
    // Pour l'instant on montre tout sauf cancelled/completed si pas demandé spécifiquement
    // Mais le front gérera souvent le filtrage 'history' vs 'upcoming'
  }

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

// GET /:id - Get specific scrim details
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const { data: scrim, error } = await supabase
    .from("scrims")
    .select(
      `
      *,
      creator:profiles(username, id),
      challenger_team:teams!challenger_team_id(name, tag, logo_url, captain_id),
      challenged_team:teams!challenged_team_id(name, tag, logo_url, captain_id)
    `,
    )
    .eq("id", id)
    .single();

  if (error) return res.status(404).json({ error: "Scrim non trouvé" });

  // Récupérer les participants
  const { data: participants } = await supabase
    .from("scrim_participants")
    .select(
      `
      *,
      profile:user_id(username, rank, avatar_url, id)
    `,
    )
    .eq("scrim_id", id);

  // Récupérer les stats si le match est terminé
  let stats: any[] = [];
  if (scrim.status === "completed") {
    const { data: s } = await supabase
      .from("scrim_stats_individual")
      .select(
        `
        *,
        profile:user_id(username)
      `,
      )
      .eq("scrim_id", id);
    stats = s || [];
  }

  res.json({ ...scrim, participants, stats });
});

// POST / - Create a new scrim
router.post("/", authenticate, async (req: any, res) => {
  const { type, scheduled_at, challenger_team_id, challenged_team_id } =
    req.body;
  const userId = req.user.id;

  if (!type || !scheduled_at)
    return res
      .status(400)
      .json({ error: "Champs manquants (type, scheduled_at)" });

  if (new Date(scheduled_at) < new Date()) {
    return res
      .status(400)
      .json({ error: "La date du scrim doit être ultérieure à maintenant." });
  }

  if (type === "team") {
    if (!challenger_team_id || !challenged_team_id)
      return res.status(400).json({
        error:
          "Les équipes doivent être spécifiées pour un scrim Team vs Team.",
      });

    // Vérifier que l'utilisateur est bien capitaine de l'équipe hôte
    const { data: teamHost } = await supabase
      .from("teams")
      .select("captain_id")
      .eq("id", challenger_team_id)
      .single();
    if (!teamHost || teamHost.captain_id !== userId) {
      return res
        .status(403)
        .json({ error: "Vous devez être capitaine pour proposer un scrim." });
    }

    const { data: scrim, error } = await supabase
      .from("scrims")
      .insert({
        type: "team",
        scheduled_at,
        creator_id: userId,
        challenger_team_id,
        challenged_team_id,
        status: "pending", // En attente de validation par l'équipe adverse
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // Notification au capitaine adverse
    const { data: teamGuest } = await supabase
      .from("teams")
      .select("captain_id, name")
      .eq("id", challenged_team_id)
      .single();
    if (teamGuest) {
      // Récup nom de l'équipe host pour le message
      const { data: hostInfo } = await supabase
        .from("teams")
        .select("name")
        .eq("id", challenger_team_id)
        .single();

      if (hostInfo) {
        await supabase.from("notifications").insert({
          user_id: teamGuest.captain_id,
          type: "info", // ou 'scrim_request' si on crée un nouveau type
          title: "Défi de Scrim reçu",
          message: `L'équipe ${hostInfo.name} vous défie pour un scrim le ${new Date(scheduled_at).toLocaleString()}.`,
          // On pourrait ajouter un lien ou ID pour rediriger
        });
      }
    }

    return res.json(scrim);
  } else if (type === "open") {
    // Scrim ouvert (mix de joueurs)
    const { data: scrim, error } = await supabase
      .from("scrims")
      .insert({
        type: "open",
        scheduled_at,
        creator_id: userId,
        status: "scheduled",
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // Ajouter le créateur comme premier participant
    await supabase.from("scrim_participants").insert({
      scrim_id: scrim.id,
      user_id: userId,
      side: "blue", // Par défaut
    });

    return res.json(scrim);
  } else {
    return res.status(400).json({ error: "Type de scrim invalide." });
  }
});

// POST /:id/join - Join an Open Scrim
router.post("/:id/join", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { side, role } = req.body; // 'blue', 'red' or 'reserve'; role (optional for reserve)
  console.log(
    `User ${userId} joining scrim ${id}. Side: ${side}, Role: ${role}`,
  );

  // Normaliser la side
  let normalizedSide = side;
  if (!normalizedSide) normalizedSide = "blue"; // default
  if (normalizedSide === "reserve") normalizedSide = null;

  // Validation Role pour Open Scrims
  const VALID_ROLES = ["Top", "Jungle", "Mid", "ADC", "Support"];
  if (normalizedSide && (!role || !VALID_ROLES.includes(role))) {
    // Note: On n'impose pas le role pour les scrims Team pour l'instant si on ne veut pas casser l'existant,
    // mais le code frontend ne l'envoie que pour Open Scrim
  }

  // Vérifier le scrim
  const { data: scrim } = await supabase
    .from("scrims")
    .select("type, status, challenger_team_id, challenged_team_id")
    .eq("id", id)
    .single();
  if (!scrim) return res.status(404).json({ error: "Scrim non trouvé" });
  if (scrim.status !== "scheduled")
    return res.status(400).json({ error: "Ce scrim n'est pas ouvert." });

  if (
    scrim.type === "open" &&
    normalizedSide &&
    (!role || !VALID_ROLES.includes(role))
  ) {
    return res.status(400).json({
      error: `Un rôle valide est requis pour rejoindre un Open Scrim. (Role reçu: '${role}', Side: '${normalizedSide}')`,
    });
  }

  // Si c'est un Scrim d'équipe, on vérifie l'appartenance
  if (scrim.type === "team") {
    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("profile_id", userId)
      .in("team_id", [scrim.challenger_team_id, scrim.challenged_team_id]); // Returns array

    // Check if user is in one of the teams
    const userTeamId =
      membership && membership.length > 0 ? membership[0].team_id : null;

    if (!userTeamId) {
      return res.status(403).json({
        error: "Vous ne faites pas partie d'une équipe participant à ce scrim.",
      });
    }

    // Enforce Side
    if (userTeamId === scrim.challenger_team_id) {
      if (normalizedSide && normalizedSide !== "blue") {
        return res
          .status(400)
          .json({ error: "Votre équipe joue coté Bleu (Challenger)." });
      }
      if (!normalizedSide) normalizedSide = "blue";
    } else if (userTeamId === scrim.challenged_team_id) {
      if (normalizedSide && normalizedSide !== "red") {
        return res
          .status(400)
          .json({ error: "Votre équipe joue coté Rouge (Challenged)." });
      }
      if (!normalizedSide) normalizedSide = "red";
    }
  } else if (scrim.type !== "open") {
    return res.status(400).json({
      error: "Ce scrim n'est pas ouvert aux inscriptions individuelles.",
    });
  }

  // Check Role Conflict (Open Scrims Only)
  if (scrim.type === "open" && normalizedSide) {
    const { data: conflict } = await supabase
      .from("scrim_participants")
      .select("id")
      .eq("scrim_id", id)
      .eq("side", normalizedSide)
      .eq("role", role)
      .neq("user_id", userId)
      .maybeSingle();

    if (conflict) {
      return res.status(400).json({ error: `Le rôle ${role} est déjà pris.` });
    }
  }

  // Vérifier si déjà inscrit
  const { data: existing } = await supabase
    .from("scrim_participants")
    .select("id, side, role")
    .eq("scrim_id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    // Update existing
    const updates: any = {};
    if (existing.side !== normalizedSide) updates.side = normalizedSide;
    if (role && existing.role !== role) updates.role = role;
    if (!normalizedSide) updates.role = null;

    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabase
        .from("scrim_participants")
        .update(updates)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) return res.status(400).json({ error: error.message });
      return res.json(data);
    }
    return res.json(existing);
  }

  // Inscription
  const { data, error } = await supabase
    .from("scrim_participants")
    .insert({
      scrim_id: id,
      user_id: userId,
      side: normalizedSide,
      role: normalizedSide ? role : null,
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

// POST /:id/leave - Leave an Open Scrim
router.post("/:id/leave", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const { error } = await supabase
    .from("scrim_participants")
    .delete()
    .eq("scrim_id", id)
    .eq("user_id", userId);

  if (error) return res.status(400).json({ error: error.message });

  res.json({ message: "Désinscription réussie." });
});

// PATCH /:id/status - Manually update status (e.g. to completed)
router.patch("/:id/status", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  if (!["completed", "cancelled"].includes(status)) {
    return res.status(400).json({ error: "Statut invalide." });
  }

  // Check admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  const isAdmin = profile?.role === "admin" || profile?.role === "superadmin";

  // Check generic rights (Creator or Host Captain or Guest Captain)
  const { data: scrim } = await supabase
    .from("scrims")
    .select(
      "*, challenger_team:challenger_team_id(captain_id), challenged_team:challenged_team_id(captain_id)",
    )
    .eq("id", id)
    .single();

  if (!scrim) return res.status(404).json({ error: "Scrim non trouvé" });

  const isCreator = scrim.creator_id === userId;
  const isChallengerCaptain =
    (scrim.challenger_team as any)?.captain_id === userId;
  const isChallengedCaptain =
    (scrim.challenged_team as any)?.captain_id === userId;

  if (!isCreator && !isChallengerCaptain && !isChallengedCaptain && !isAdmin) {
    return res.status(403).json({ error: "Non autorisé." });
  }

  const { error } = await supabase
    .from("scrims")
    .update({ status })
    .eq("id", id);
  if (error) return res.status(400).json({ error: error.message });

  res.json({ message: "Statut mis à jour." });
});

// POST /:id/challenge - Respond into a Team Challenge
router.post("/:id/challenge", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'accept' | 'decline'
  const userId = req.user.id;

  const { data: scrim } = await supabase
    .from("scrims")
    .select(
      "*, challenged_team:challenged_team_id(captain_id), challenger_team:challenger_team_id(captain_id, name)",
    )
    .eq("id", id)
    .single();

  if (!scrim) return res.status(404).json({ error: "Scrim non trouvé" });
  if (scrim.type !== "team")
    return res
      .status(400)
      .json({ error: "Action invalide pour ce type de scrim." });

  // Vérifier que c'est bien le capitaine de l'équipe adverse qui répond
  // (Note: on caste guest_team car via la jointure on récupère l'objet)
  const guestCaptainId = (scrim.challenged_team as any)?.captain_id;

  if (guestCaptainId !== userId) {
    return res
      .status(403)
      .json({ error: "Seul le capitaine de l'équipe défiée peut répondre." });
  }

  let newStatus = scrim.status;
  let notifMessage = "";

  if (action === "accept") {
    newStatus = "scheduled";
    notifMessage = `L'équipe adverse a accepté votre défi pour le scrim du ${new Date(scrim.scheduled_at).toLocaleString()}.`;
  } else if (action === "decline") {
    newStatus = "cancelled"; // ou supprimer carrément la ligne ? "cancelled" garde une trace.
    notifMessage = `L'équipe adverse a décliné votre défi pour le scrim.`;
  } else {
    return res.status(400).json({ error: "Action invalide." });
  }

  const { error } = await supabase
    .from("scrims")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) return res.status(400).json({ error: error.message });

  // Notifier le créateur du défi (Host)
  const hostCaptainId = (scrim.challenger_team as any)?.captain_id;
  if (hostCaptainId) {
    await supabase.from("notifications").insert({
      user_id: hostCaptainId,
      type: action === "accept" ? "success" : "error",
      title: `Défi ${action === "accept" ? "Accepté" : "Refusé"}`,
      message: notifMessage,
    });
  }

  res.json({ status: newStatus });
});

// POST /:id/results - Submit Stats (OCR validated by client)
router.post("/:id/results", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { screenshot_url, stats, game_duration } = req.body;
  // stats: tableau d'objets { user_id, champion_name, kills, deaths, assists, cs, win }
  // game_duration: duration in seconds (INT)
  const userId = req.user.id;

  // Check rights
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  const isAdmin = profile?.role === "admin" || profile?.role === "superadmin";

  const { data: scrim } = await supabase
    .from("scrims")
    .select(
      "*, challenger_team:challenger_team_id(captain_id), challenged_team:challenged_team_id(captain_id)",
    )
    .eq("id", id)
    .single();

  if (!scrim) {
    return res.status(404).json({ error: "Scrim non trouvé" });
  }

  const isCreator = scrim.creator_id === userId;
  const isChallengerCaptain =
    (scrim.challenger_team as any)?.captain_id === userId;
  const isChallengedCaptain =
    (scrim.challenged_team as any)?.captain_id === userId;

  if (!isCreator && !isChallengerCaptain && !isChallengedCaptain && !isAdmin) {
    return res.status(403).json({
      error: "Seul l'organisateur ou un admin peut soumettre les résultats.",
    });
  }

  // Update scrim status
  const updatePayload: any = {
    status: "completed",
    screenshot_url: screenshot_url, // Can be null/empty
  };

  if (game_duration) {
    updatePayload.game_duration = game_duration;
  }

  const { error: updateError } = await supabase
    .from("scrims")
    .update(updatePayload)
    .eq("id", id);

  if (updateError) {
    console.error("Error updating scrim results:", updateError);
    return res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour du scrim." });
  }

  // Insert stats
  // On suppose que le client envoie un tableau propre
  if (stats && Array.isArray(stats) && stats.length > 0) {
    // Determine game duration for CS/min if not provided in stats
    // Priority: req.body.game_duration -> scrim.game_duration
    const durationSec = game_duration || scrim.game_duration || 0;
    const durationMin = durationSec > 0 ? durationSec / 60 : 0;

    const statsToInsert = stats.map((s: any) => {
      // Calculate CS/min
      // If client sent cs_min, use it. Else calculate from CS & Duration.
      let csMin = s.cs_min;
      if (csMin === undefined && durationMin > 0 && s.cs !== undefined) {
        csMin = Number((s.cs / durationMin).toFixed(1));
      }

      return {
        scrim_id: id,
        user_id: s.user_id,
        champion_name: s.champion_name,
        kills: s.kills,
        deaths: s.deaths,
        assists: s.assists,
        cs: s.cs,
        cs_min: csMin || 0, // Fallback to 0
        win: s.win || false,
        role: s.role,
      };
    });

    const { error } = await supabase
      .from("scrim_stats_individual")
      .upsert(statsToInsert, { onConflict: "scrim_id,user_id" }); // Upsert pour éviter doublons si re-submission

    if (error)
      return res.status(400).json({
        error: "Erreur lors de la sauvegarde des stats: " + error.message,
      });
  }

  res.json({ message: "Résultats enregistrés avec succès." });
});

// POST /:id/analyze-screenshot - AI Vision Analysis for Stats
router.post("/:id/analyze-screenshot", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: "Aucune URL d'image fournie." });
  }

  try {
    // 1. Get Participants for context based on Scrim Type
    const { data: scrim } = await supabase
      .from("scrims")
      .select("type, challenger_team_id, challenged_team_id")
      .eq("id", id)
      .single();

    if (!scrim) throw new Error("Scrim introuvable");

    let participants: any[] = [];

    if (scrim.type === "team") {
      // For Team Scrims, fetch all members from both teams
      const teamIds = [
        scrim.challenger_team_id,
        scrim.challenged_team_id,
      ].filter(Boolean);
      const { data: members } = await supabase
        .from("team_members")
        .select("team_id, profile_id, profile:profile_id(id, username)")
        .in("team_id", teamIds);

      // Normalize to match scrim_participants structure (user_id instead of profile_id)
      participants = (members || []).map((m: any) => ({
        user_id: m.profile_id,
        profile: m.profile,
      }));
    } else {
      // For Open Scrims, fetch scrim_participants directly
      const { data: openParticipants } = await supabase
        .from("scrim_participants")
        .select("*, profile:user_id(username)")
        .eq("scrim_id", id);
      participants = openParticipants || [];
    }

    // Extract unique usernames (just in case)
    const participantNames = participants
      .map((p: any) => p.profile?.username)
      .filter(Boolean);

    console.log(
      `Analyzing screenshot for Scrim ${id} with players: ${participantNames.join(", ")}`,
    );

    // 2. Call OpenAI Vision (now Gemini)
    // Note: analyzeScreenshot returns { pseudo, champion, kills, deaths, assists, cs, cs_min, win, game_duration }
    const results: any[] = await analyzeScreenshot(imageUrl, participantNames);

    // Extract global game duration if detected (it's duplicated in each player object)
    const detectedDuration = results[0]?.game_duration || null;

    // 3. Match back to user IDs
    const matchedStats = results
      .map((result: any) => {
        // Find exact or closest match in participants
        // The AI returns "pseudo" (or formerly "matched_username")
        const detectedName = result.pseudo || result.matched_username;

        const match = participants.find(
          (p: any) =>
            p.profile.username.toLowerCase() === detectedName.toLowerCase(),
        );

        if (match) {
          return {
            user_id: match.user_id,
            champion_name: result.champion || result.champion_name,
            kills: result.kills,
            deaths: result.deaths,
            assists: result.assists,
            cs: result.cs,
            cs_min: result.cs_min,
            win: result.win === true || result.win === "true",
            // Include role from registration if available
            role: (match as any).role || null,
          };
        }
        return null; // Ignore unmatched players (as requested)
      })
      .filter((s) => s !== null);

    res.json({ stats: matchedStats, game_duration: detectedDuration });
  } catch (error: any) {
    console.error("AI Route Error:", error);
    res
      .status(500)
      .json({ error: error.message || "Erreur lors de l'analyse avec l'IA." });
  }
});

export default router;
