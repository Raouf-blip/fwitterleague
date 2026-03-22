import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import profileRoutes from './routes/profile.routes';
import teamRoutes from './routes/team.routes';
import socialRoutes from './routes/social.routes';
import tournamentRoutes from './routes/tournament.routes';
import recruitmentRoutes from './routes/recruitment.routes';

const app = express();

// Basic security headers
app.use(helmet());

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per `window`
  message: { error: 'Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard.' }
});
app.use(limiter);

// Restrict CORS
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests) or allowed origins
    if (!origin || allowedOrigins.includes(origin as string)) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  }
}));

app.use(express.json());

// Points d'entrée de l'API v1
const router = express.Router();

router.use('/profiles', profileRoutes);
router.use('/teams', teamRoutes);
router.use('/social', socialRoutes);
router.use('/tournaments', tournamentRoutes);
router.use('/recruitment', recruitmentRoutes);

// Utilisation du versioning
app.use('/api/v1', router);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: 'v1' });
});

// Middleware Global de gestion d'erreurs
app.use((err: any, req: any, res: any, next: any) => {
  console.error('SERVER ERROR:', err);
  res.status(500).json({ 
    error: 'Une erreur interne est survenue.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export { app };
