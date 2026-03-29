import { supabase } from '../config/supabase';

const userCache = new Map<string, { user: any; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export const authenticate = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const cached = userCache.get(token);
  if (cached && cached.expiry > Date.now()) {
    req.user = cached.user;
    return next();
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    userCache.delete(token);
    return res.status(401).json({ error: 'Invalid token' });
  }

  userCache.set(token, { user, expiry: Date.now() + CACHE_TTL });
  req.user = user;
  next();
};
