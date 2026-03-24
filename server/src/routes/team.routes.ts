import { Router } from 'express';
import { supabase } from '../config/supabase';
import { authenticate } from '../middlewares/auth';
import { checkTeamLock } from '../utils/team-lock';

const router = Router();

// Public: List all teams
router.get('/', async (req, res) => {
  const { data: teams, error } = await supabase.from('teams').select('*').order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });

  if (!teams || teams.length === 0) {
    return res.json([]);
  }

  const teamIds = teams.map(t => t.id);
  const { data: members } = await supabase.from('team_members')
    .select('*, profile:profile_id(*)')
    .in('team_id', teamIds);

  const teamsWithMembers = teams.map(t => ({
    ...t,
    members: members ? members.filter(m => m.team_id === t.id) : []
  }));

  res.json(teamsWithMembers);
});

// Public: Get team detail with members
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('teams').select('*, captain:captain_id(username)').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Équipe non trouvée' });
  
  const { data: members } = await supabase.from('team_members').select('*, profile:profile_id(*)').eq('team_id', req.params.id);
  const isLocked = await checkTeamLock(req.params.id);
  
  res.json({ ...data, members, is_locked: isLocked });
});

// Private: Create a team
router.post('/', authenticate, async (req: any, res) => {
  const { name, tag, description, logo_url } = req.body;
  if (!name || !tag || tag.length > 4) return res.status(400).json({ error: 'Nom requis et Tag (max 4 car.) requis.' });

  const { data: team, error } = await supabase.from('teams').insert({ name, tag, description, logo_url, captain_id: req.user.id }).select().single();
  if (error) return res.status(400).json({ error: error.message });

  await supabase.from('team_members').insert({ team_id: team.id, profile_id: req.user.id, role: 'Captain' });
  await supabase.from('profiles').update({ is_captain: true, is_looking_for_team: false }).eq('id', req.user.id);
  res.json(team);
});

// Private: Update team info
router.patch('/:id', authenticate, async (req: any, res) => {
  if (await checkTeamLock(req.params.id)) return res.status(403).json({ error: 'L\'équipe est verrouillée car elle participe à un tournoi en cours.' });

  const { name, tag, description, logo_url } = req.body;
  const teamId = req.params.id;

  const { data: team } = await supabase.from('teams').select('captain_id').eq('id', teamId).single();
  if (!team || team.captain_id !== req.user.id) return res.status(403).json({ error: 'Seul le capitaine peut modifier l\'équipe.' });

  const { data: updatedTeam, error } = await supabase.from('teams').update({ name, tag, description, logo_url }).eq('id', teamId).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(updatedTeam);
});

// Private: Disband team (captain or superadmin)
router.delete('/:id', authenticate, async (req: any, res) => {
  const teamId = req.params.id;
  const { data: userProfile } = await supabase.from('profiles').select('role').eq('id', req.user.id).single();
  const isSuperAdmin = userProfile?.role === 'superadmin';

  if (!isSuperAdmin && await checkTeamLock(teamId)) {
    return res.status(403).json({ error: 'Impossible de dissoudre une équipe engagée dans un tournoi actif.' });
  }

  const { data: team } = await supabase.from('teams').select('captain_id, name').eq('id', teamId).single();
  if (!team) return res.status(404).json({ error: 'Équipe introuvable.' });
  if (!isSuperAdmin && team.captain_id !== req.user.id) {
    return res.status(403).json({ error: 'Seul le capitaine peut dissoudre l\'équipe.' });
  }

  const { data: members } = await supabase.from('team_members').select('profile_id').eq('team_id', teamId);
  const profileIds = members?.map(m => m.profile_id) || [];

  // Notify all members
  const notifMessage = isSuperAdmin
    ? `Votre équipe ${team.name} a été dissoute par un administrateur.`
    : `Votre équipe ${team.name} a été dissoute par le capitaine.`;
  const notificationPromises = profileIds
    .filter(id => id !== req.user.id)
    .map(id => supabase.from('notifications').insert({
      user_id: id,
      title: 'Équipe dissoute',
      message: notifMessage,
      type: 'system'
    }));
  await Promise.all(notificationPromises);

  // Reset members: remove captain status, set as free agent
  await supabase.from('profiles').update({ is_captain: false, is_looking_for_team: true }).in('id', profileIds);

  const { error } = await supabase.from('teams').delete().eq('id', teamId);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Équipe dissoute.' });
});

// Private: Add a member (superadmin only)
router.post('/:id/members', authenticate, async (req: any, res) => {
  const teamId = req.params.id;
  const { profile_id } = req.body;
  if (!profile_id) return res.status(400).json({ error: 'profile_id requis.' });

  const { data: userProfile } = await supabase.from('profiles').select('role').eq('id', req.user.id).single();
  if (userProfile?.role !== 'superadmin') return res.status(403).json({ error: 'Action réservée aux super admins.' });

  const { data: team } = await supabase.from('teams').select('name, tag').eq('id', teamId).single();
  if (!team) return res.status(404).json({ error: 'Équipe introuvable.' });

  // Check player is not already in a team
  const { data: existing } = await supabase.from('team_members').select('id').eq('profile_id', profile_id).maybeSingle();
  if (existing) return res.status(400).json({ error: 'Ce joueur est déjà dans une équipe.' });

  // Check team size
  const { data: members } = await supabase.from('team_members').select('id').eq('team_id', teamId);
  if (members && members.length >= 6) return res.status(400).json({ error: 'L\'équipe est complète (6 joueurs max).' });

  await supabase.from('team_members').insert({ team_id: teamId, profile_id, role: 'Member' });
  await supabase.from('profiles').update({ is_looking_for_team: false }).eq('id', profile_id);

  await supabase.from('notifications').insert({
    user_id: profile_id,
    title: 'Ajouté à une équipe',
    message: `Un administrateur vous a ajouté à l'équipe ${team.name} [${team.tag}].`,
    type: 'system'
  });

  res.json({ message: 'Joueur ajouté à l\'équipe.' });
});

// Private: Kick a member (captain or superadmin)
router.delete('/:id/members/:profileId', authenticate, async (req: any, res) => {
  const { id: teamId, profileId } = req.params;

  const { data: userProfile } = await supabase.from('profiles').select('role').eq('id', req.user.id).single();
  const isSuperAdmin = userProfile?.role === 'superadmin';

  if (!isSuperAdmin && await checkTeamLock(teamId)) return res.status(403).json({ error: 'Impossible d\'expulser un joueur pendant un tournoi actif.' });
  if (profileId === req.user.id) return res.status(400).json({ error: 'Action impossible sur soi-même.' });

  const { data: team } = await supabase.from('teams').select('captain_id, name').eq('id', teamId).single();
  if (!team) return res.status(404).json({ error: 'Équipe introuvable.' });

  // Captain of this team can't be kicked
  if (profileId === team.captain_id) return res.status(400).json({ error: 'Impossible de retirer le capitaine de l\'équipe.' });

  if (!isSuperAdmin && team.captain_id !== req.user.id) return res.status(403).json({ error: 'Action réservée au capitaine.' });

  const notifMessage = isSuperAdmin
    ? `Un administrateur vous a retiré de l'équipe ${team.name}.`
    : `Vous avez été expulsé de l'équipe ${team.name}.`;

  await supabase.from('notifications').insert({
    user_id: profileId,
    title: 'Retrait d\'équipe',
    message: notifMessage,
    type: 'system'
  });

  await supabase.from('team_members').delete().eq('team_id', teamId).eq('profile_id', profileId);
  await supabase.from('profiles').update({ is_looking_for_team: true }).eq('id', profileId);
  res.json({ message: 'Joueur retiré.' });
});

// Private: Leave team
router.post('/:id/leave', authenticate, async (req: any, res) => {
  if (await checkTeamLock(req.params.id)) return res.status(403).json({ error: 'Vous ne pouvez pas quitter l\'équipe pendant un tournoi actif.' });

  const teamId = req.params.id;
  const { data: team } = await supabase.from('teams').select('captain_id').eq('id', teamId).single();
  if (team?.captain_id === req.user.id) return res.status(400).json({ error: 'Le capitaine ne peut pas quitter l\'équipe.' });

  await supabase.from('team_members').delete().eq('team_id', teamId).eq('profile_id', req.user.id);
  await supabase.from('profiles').update({ is_looking_for_team: false }).eq('id', req.user.id);
  res.json({ message: 'Vous avez quitté l\'équipe.' });
});

export default router;
