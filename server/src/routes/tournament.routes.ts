import { Router } from 'express';
import { supabase } from '../config/supabase';
import { authenticate } from '../middlewares/auth';
import { authorizeAdmin } from '../middlewares/admin';

const router = Router();

// Public: List all tournaments
router.get('/', async (req, res) => {
  const { data } = await supabase.from('tournaments').select('*').order('start_date', { ascending: true });
  res.json(data || []);
});

// Public: List recent matches (MUST be before /:id to avoid shadowing)
router.get('/matches', async (req, res) => {
  const { data } = await supabase.from('matches').select('*, team_1:team_1_id(name), team_2:team_2_id(name)').limit(20);
  res.json(data || []);
});

// Admin Only: Create Match (MUST be before /:id/register)
router.post('/matches', authenticate, authorizeAdmin, async (req: any, res) => {
  const { tournament_id, team_1_id, team_2_id, scheduled_at } = req.body;
  const { data, error } = await supabase.from('matches').insert({ tournament_id, team_1_id, team_2_id, scheduled_at }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Admin Only: Update Match
router.patch('/matches/:id', authenticate, authorizeAdmin, async (req: any, res) => {
  const { data, error } = await supabase.from('matches').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Public: Get tournament detail with teams
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('tournaments').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Tournoi introuvable.' });

  const { data: registrations } = await supabase.from('tournament_registrations').select('*, team:team_id(*)').eq('tournament_id', req.params.id);
  res.json({ ...data, registrations });
});

// Admin Only: Create tournament
router.post('/', authenticate, authorizeAdmin, async (req: any, res) => {
  const { name, description, max_teams, start_date, end_date } = req.body;

  // Case 7: Date Validation
  const start = new Date(start_date);
  const end = new Date(end_date);
  const now = new Date();

  if (start < now) return res.status(400).json({ error: 'La date de début doit être dans le futur.' });
  if (end <= start) return res.status(400).json({ error: 'La date de fin doit être après la date de début.' });

  const { data, error } = await supabase.from('tournaments').insert({ name, description, max_teams, start_date, end_date }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Private: Register a team to a tournament (Case 6)
router.post('/:id/register', authenticate, async (req: any, res) => {
  const tournamentId = req.params.id;
  const userId = req.user.id;

  // 1. Get user's team
  const { data: team } = await supabase.from('teams').select('id, name, captain_id').eq('captain_id', userId).single();
  if (!team) return res.status(403).json({ error: 'Seul un capitaine peut inscrire son équipe.' });

  // 2. Get tournament and check limits
  const { data: tournament } = await supabase.from('tournaments').select('*').eq('id', tournamentId).single();
  if (!tournament) return res.status(404).json({ error: 'Tournoi introuvable.' });
  if (tournament.status !== 'upcoming') return res.status(400).json({ error: 'Les inscriptions sont fermées pour ce tournoi.' });

  const { count } = await supabase.from('tournament_registrations').select('*', { count: 'exact', head: true }).eq('tournament_id', tournamentId);
  if (count && count >= tournament.max_teams) {
    return res.status(400).json({ error: 'Ce tournoi est déjà complet.' });
  }

  // 3. Register
  const { error: regError } = await supabase.from('tournament_registrations').insert({ tournament_id: tournamentId, team_id: team.id });
  if (regError) {
    if (regError.code === '23505') return res.status(400).json({ error: 'Votre équipe est déjà inscrite.' });
    return res.status(400).json({ error: regError.message });
  }

  res.json({ message: `L'équipe ${team.name} a été inscrite avec succès !` });
});

// Admin Only: Update tournament
router.patch('/:id', authenticate, authorizeAdmin, async (req: any, res) => {
  const { data, error } = await supabase.from('tournaments').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Admin Only: Delete tournament
router.delete('/:id', authenticate, authorizeAdmin, async (req: any, res) => {
  const { error } = await supabase.from('tournaments').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Tournoi supprimé.' });
});

export default router;
