import { Router } from 'express';
import { supabase } from '../config/supabase';
import { authenticate } from '../middlewares/auth';

const router = Router();

const PUBLIC_AGENT_COLUMNS = 'id, username, avatar_url, bio, rank, lp, winrate, riot_id, discord, preferred_roles, is_looking_for_team, is_captain, is_caster, role, created_at';

// Public: List all players (Free Agents prioritized in frontend)
router.get('/agents', async (req, res) => {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(`${PUBLIC_AGENT_COLUMNS}, team_members(team_id, team:team_id(name, tag))`)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });

  // Flatten the response to include team info directly
  const result = profiles.map((p: any) => {
    const memberInfo = p.team_members && p.team_members.length > 0 ? p.team_members[0] : null;
    return {
      ...p,
      team: memberInfo ? memberInfo.team : null
    };
  });

  res.json(result);
});

// Private: Get full inbox & outbox data
router.get('/inbox', authenticate, async (req: any, res) => {
  const userId = req.user.id;

  // 1. Notifications reçues
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // 2. Toutes les interactions impliquant l'utilisateur ou son équipe
  // On récupère d'abord l'ID de l'équipe si l'utilisateur est capitaine
  const { data: myTeam } = await supabase.from('teams').select('id').eq('captain_id', userId).maybeSingle();
  
  let query = supabase
    .from('applications')
    .select('*, team:team_id(name, tag), sender:sender_id(username, rank, id)');

  if (myTeam) {
    query = query.or(`sender_id.eq.${userId},team_id.eq.${myTeam.id}`);
  } else {
    query = query.eq('sender_id', userId);
  }

  const { data: interactions } = await query.order('created_at', { ascending: false });

  res.json({
    notifications: notifications || [],
    interactions: interactions || []
  });
});

// Private: Mark notification as read
router.patch('/notifications/:id', authenticate, async (req: any, res) => {
  const { data, error } = await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id).eq('user_id', req.user.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Private: Mark all notifications as read
router.post('/notifications/read-all', authenticate, async (req: any, res) => {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', req.user.id).eq('is_read', false);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Toutes les notifications ont été marquées comme lues.' });
});

export default router;
