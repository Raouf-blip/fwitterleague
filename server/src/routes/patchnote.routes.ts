import { Router } from 'express';
import { supabase } from '../config/supabase';
import { authenticate } from '../middlewares/auth';
import { authorizeAdmin } from '../middlewares/admin';

const router = Router();

// Public: List all patch notes (newest first)
router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('patch_notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Admin: Create a patch note
router.post('/', authenticate, authorizeAdmin, async (req: any, res) => {
  const { version, title, date, categories } = req.body;

  if (!version || !title || !date) {
    return res.status(400).json({ error: 'version, title et date sont requis.' });
  }

  const { data, error } = await supabase
    .from('patch_notes')
    .insert({ version, title, date, categories: categories || [] })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// Admin: Update a patch note
router.put('/:id', authenticate, authorizeAdmin, async (req: any, res) => {
  const { version, title, date, categories } = req.body;

  const { data, error } = await supabase
    .from('patch_notes')
    .update({ version, title, date, categories })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Admin: Delete a patch note
router.delete('/:id', authenticate, authorizeAdmin, async (req: any, res) => {
  const { error } = await supabase
    .from('patch_notes')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Patch note supprimé.' });
});

export default router;
