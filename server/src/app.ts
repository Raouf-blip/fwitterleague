import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import profileRoutes from './routes/profile.routes';
import teamRoutes from './routes/team.routes';
import socialRoutes from './routes/social.routes';
import tournamentRoutes from './routes/tournament.routes';
import recruitmentRoutes from './routes/recruitment.routes';
import patchnoteRoutes from './routes/patchnote.routes';
import scrimRoutes from './routes/scrim.routes';
import statsRoutes from './routes/stats.routes';
import authRoutes from './routes/auth.routes';

const app = express();

app.use(helmet());
const FRONTEND_ORIGIN = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
app.use(cors({
  origin: FRONTEND_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Points d'entrée de l'API v1
const router = express.Router();

router.use('/profiles', profileRoutes);
router.use('/teams', teamRoutes);
router.use('/social', socialRoutes);
router.use('/tournaments', tournamentRoutes);
router.use('/recruitment', recruitmentRoutes);
router.use('/patchnotes', patchnoteRoutes);
router.use('/scrims', scrimRoutes);
router.use('/stats', statsRoutes);
router.use('/auth', authRoutes);

// Utilisation du versioning
app.use("/api/v1", router);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", version: "v1" });
});

// Middleware Global de gestion d'erreurs
app.use((err: any, req: any, res: any, next: any) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({
    error: "Une erreur interne est survenue.",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

export { app };
