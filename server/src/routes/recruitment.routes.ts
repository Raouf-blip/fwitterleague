import { Router } from 'express';
import { supabase } from '../config/supabase';
import { authenticate } from '../middlewares/auth';
import { checkTeamLock } from '../utils/team-lock';

const router = Router();

// Private: Apply to a team (Player -> Team)
router.post('/apply/:teamId', authenticate, async (req: any, res) => {
  const team_id = req.params.teamId;
  const { message } = req.body;
  const sender_id = req.user.id;

  if (await checkTeamLock(team_id)) {
    return res.status(403).json({ error: 'Cette équipe participe à un tournoi actif et ne peut pas recruter.' });
  }

  // Check if player is already in a team
  const { data: member } = await supabase.from('team_members').select('id').eq('profile_id', sender_id).maybeSingle();
  if (member) return res.status(400).json({ error: 'Vous faites déjà partie d\'une équipe.' });

  // Check for duplicate pending application
  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('team_id', team_id)
    .eq('sender_id', sender_id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) return res.status(400).json({ error: 'Une candidature est déjà en attente pour cette équipe.' });

  const { data: app, error } = await supabase
    .from('applications')
    .insert({ team_id, sender_id, message, type: 'application' })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json(app);
});

// Private: Invite a player (Team -> Player)
router.post('/invite/:playerId', authenticate, async (req: any, res) => {
  const player_id = req.params.playerId;
  const { team_id, message } = req.body;
  const userId = req.user.id;

  if (await checkTeamLock(team_id)) {
    return res.status(403).json({ error: 'Votre équipe participe à un tournoi actif et ne peut pas recruter.' });
  }

  // Check if requester is captain of this team
  const { data: team } = await supabase.from('teams').select('name').eq('id', team_id).eq('captain_id', userId).single();
  if (!team) return res.status(403).json({ error: 'Seul le capitaine de cette équipe peut envoyer des invitations.' });

  // Check if player is already in a team
  const { data: member } = await supabase.from('team_members').select('id').eq('profile_id', player_id).maybeSingle();
  if (member) return res.status(400).json({ error: 'Ce joueur fait déjà partie d\'une équipe.' });

  // Check for duplicate pending offer
  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('team_id', team_id)
    .eq('sender_id', player_id)
    .eq('status', 'pending')
    .eq('type', 'offer')
    .maybeSingle();

  if (existing) return res.status(400).json({ error: 'Une invitation est déjà en attente pour ce joueur.' });

  const { data: app, error } = await supabase
    .from('applications')
    .insert({ team_id, sender_id: player_id, message, type: 'offer' })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json(app);
});

// Private: Respond to request (Accept/Reject)
router.patch('/:id/respond', authenticate, async (req: any, res) => {
  const { status } = req.body;
  const userId = req.user.id;
  const appId = req.params.id;

  const { data: app } = await supabase.from('applications').select('*, team:team_id(captain_id, name)').eq('id', appId).single();
  if (!app) return res.status(404).json({ error: 'Interaction non trouvée' });

  if (status === 'accepted' && await checkTeamLock(app.team_id)) {
    return res.status(403).json({ error: 'Action impossible : l\'équipe est engagée dans un tournoi actif.' });
  }

  // Permissions
  if (app.type === 'application' && app.team.captain_id !== userId) {
    return res.status(403).json({ error: 'Seul le capitaine peut répondre.' });
  }
  if (app.type === 'offer' && app.sender_id !== userId) {
    return res.status(403).json({ error: 'Seul le joueur concerné peut répondre.' });
  }

  if (app.status !== 'pending') return res.status(400).json({ error: 'Demande déjà traitée.' });

  if (status === 'accepted') {
    const { data: member } = await supabase.from('team_members').select('id').eq('profile_id', app.sender_id).maybeSingle();
    if (member) return res.status(400).json({ error: 'Le joueur a déjà rejoint une équipe.' });

    // Case 5: Team Member Limit (Max 7)
    const { count } = await supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('team_id', app.team_id);
    if (count && count >= 7) {
      return res.status(400).json({ error: 'L\'équipe est déjà complète (max 7 joueurs).' });
    }

    await supabase.from('team_members').insert({ team_id: app.team_id, profile_id: app.sender_id, role: 'Member' });
    await supabase.from('profiles').update({ is_looking_for_team: false }).eq('id', app.sender_id);
    
    // Auto-clean other pending applications/offers for THIS specific player
    // This prevents them from being in multiple teams and cleans up the UI for other captains
    await supabase.from('applications')
      .update({ status: 'rejected' })
      .eq('sender_id', app.sender_id)
      .eq('status', 'pending')
      .neq('id', appId); // Don't reject the one we just accepted
  }

  const { data: updated, error: updateError } = await supabase.from('applications').update({ status }).eq('id', appId).select().single();
  if (updateError) return res.status(400).json({ error: updateError.message });

  // Cleanup related "System" notifications for the recipient so the bell goes away
  // This helps when multiple notifications were sent or to just clean up.
  await supabase.from('notifications')
    .delete()
    .eq('user_id', userId)
    .or(`message.ilike.%${app.team.name}%`);

  const targetId = (app.type === 'application') ? app.sender_id : app.team.captain_id;
  await supabase.from('notifications').insert({
    user_id: targetId,
    title: status === 'accepted' ? 'Félicitations !' : 'Réponse reçue',
    message: status === 'accepted' 
      ? `Votre demande pour rejoindre l'équipe ${app.team.name} a été acceptée !`
      : `L'équipe ${app.team.name} a décliné votre candidature.`,
    type: 'system'
  });

  res.json(updated);
});

export default router;
