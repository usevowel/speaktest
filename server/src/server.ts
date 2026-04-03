/**
 * Main Express server for vowel.to tester
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { projectRoutes } from './routes/projects';
import { translationRoutes } from './routes/translation';
import { ttsRoutes } from './routes/tts';
import { sttRoutes } from './routes/stt';
import { transcriptionRoutes } from './routes/transcriptions';
import { markdownRoutes } from './routes/markdown';

// Load environment variables
dotenv.config({ path: join(dirname(dirname(fileURLToPath(import.meta.url))), '..', '.env') });

const app = express();
const PORT = process.env.PORT || 9090;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:8080',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/translate', translationRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/stt', sttRoutes);
app.use('/api/transcriptions', transcriptionRoutes);
app.use('/api/markdown', markdownRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Projects directory: ${process.env.PROJECTS_DIR || 'workspace root (default)'}`);
  console.log(`🔑 Deepgram API configured: ${!!process.env.DEEPGRAM_API_KEY}`);
  console.log(`🔑 Groq API configured: ${!!process.env.GROQ_API_KEY}`);
});

export default app;
