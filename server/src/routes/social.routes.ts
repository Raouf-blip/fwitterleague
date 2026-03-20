import { Router } from 'express';
import { supabase } from '../config/supabase';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Public: List all free agents (filtered to exclude players already in a team)
router.get('/agents', async (req, res) => {
  const { data, error } = await supabase.from('free_agents').select('*').order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
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
  const { data, error } = await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;
