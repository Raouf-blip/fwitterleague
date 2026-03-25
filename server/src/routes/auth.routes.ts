import { Router } from 'express';
import { supabase } from '../config/supabase';
import { authenticate } from '../middlewares/auth';
import crypto from 'crypto';

const router = Router();

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Helper to sign/verify state (prevents CSRF and links the response to the right user)
function signState(userId: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'default_secret';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(userId);
  return `${userId}.${hmac.digest('hex')}`;
}

function verifyState(state: string): string | null {
  const [userId, mac] = state.split('.');
  if (!userId || !mac) return null;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'default_secret';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(userId);
  if (hmac.digest('hex') === mac) return userId;
  return null;
}

// Route to get the Discord Authorization URL
router.get('/discord', authenticate, (req: any, res) => {
  const state = signState(req.user.id);
  const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI!)}&response_type=code&scope=identify&state=${state}`;
  res.json({ url });
});

// OAuth Callback
router.get('/discord/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${FRONTEND_URL}/profile?error=discord_denied`);
  }

  if (!code || !state) {
    return res.redirect(`${FRONTEND_URL}/profile?error=invalid_callback`);
  }

  const userId = verifyState(state as string);
  if (!userId) {
    return res.redirect(`${FRONTEND_URL}/profile?error=invalid_state`);
  }

  try {
    // 1. Exchange code for token
    const tokenParams = new URLSearchParams();
    tokenParams.append('client_id', DISCORD_CLIENT_ID!);
    tokenParams.append('client_secret', DISCORD_CLIENT_SECRET!);
    tokenParams.append('grant_type', 'authorization_code');
    tokenParams.append('code', code as string);
    tokenParams.append('redirect_uri', DISCORD_REDIRECT_URI!);

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: tokenParams,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!tokenRes.ok) {
      const errorData = await tokenRes.json();
      console.error('[Discord OAuth] Token Error:', errorData);
      throw new Error('Failed to exchange code for token');
    }

    const { access_token } = (await tokenRes.json()) as any;

    // 2. Get User Info
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userRes.ok) throw new Error('Failed to fetch Discord user info');

    const discordUser = (await userRes.json()) as any;

    // 3. Update Supabase Profile
    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        discord_id: discordUser.id,
        discord: discordUser.username, // Update with the latest handle
      })
      .eq('id', userId);

    if (dbError) {
      console.error('[Discord OAuth] DB Update Error:', dbError.message);
      throw new Error('Failed to update profile');
    }

    // Success: Redirect back to profile
    res.redirect(`${FRONTEND_URL}/profile?success=discord_synced`);
  } catch (err: any) {
    console.error('[Discord OAuth] Error:', err.message);
    res.redirect(`${FRONTEND_URL}/profile?error=sync_failed`);
  }
});

export default router;
