import { supabase } from '../config/supabase';

// Middleware pour autoriser uniquement les admin et superadmin
export const authorizeAdmin = async (req: any, res: any, next: any) => {
  if (!req.user) return res.status(401).json({ error: 'Non authentifié' });

  // On récupère le rôle depuis le profil pour être sûr qu'il est à jour
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', req.user.id).single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
    return res.status(403).json({ error: 'Accès refusé. Droits administrateur requis.' });
  }

  next();
};

// Middleware pour autoriser uniquement les superadmin
export const authorizeSuperAdmin = async (req: any, res: any, next: any) => {
  if (!req.user) return res.status(401).json({ error: 'Non authentifié' });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', req.user.id).single();

  if (!profile || profile.role !== 'superadmin') {
    return res.status(403).json({ error: 'Accès refusé. Droits superadmin requis.' });
  }

  next();
};
