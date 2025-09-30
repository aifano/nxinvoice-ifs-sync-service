import express from 'express';
import { AppConfig } from './common/config/app.config';
import { jwtMiddleware } from './common/middleware/jwt.middleware';
import { jsonRepairMiddleware } from './common/middleware/json-repair.middleware';
import { healthRoutes } from './modules/health/health.module';
import { ifsSyncRoutes } from './modules/ifs-sync/ifs-sync.module';

const app = express();

// JSON repair middleware (replaces express.json())
app.use(jsonRepairMiddleware);

// Health check routes (no JWT required)
app.use('/', healthRoutes);

// Apply JWT middleware to all other routes
app.use(jwtMiddleware);

// IFS Sync routes
app.use('/', ifsSyncRoutes);

const PORT = AppConfig.port;
app.listen(PORT, () => console.log(`IFS Sync Service running on port ${PORT}`));
