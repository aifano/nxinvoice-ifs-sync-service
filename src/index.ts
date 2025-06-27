import express, { NextFunction, Request, Response } from 'express';
import { PORT } from './utilities/config';
import { prisma } from './utilities/prisma';
import { IfsTableSynchronizationService } from './services/ifs-sync-service';
import { IfsSyncController } from './controllers/ifs-sync-controller';
import { requireJwt } from './middlewares/jwt';

const app = express();

// Initialize services with simplified dependency injection
const ifsSynchronizationService = new IfsTableSynchronizationService(prisma);
const ifsSyncController = new IfsSyncController(ifsSynchronizationService);

app.use(express.json({
    verify: (req, _res, buf) => {
        (req as any).rawBody = buf.toString('utf8');
    }
}));

const jsonParsingErrorHandler: express.ErrorRequestHandler = (jsonParsingError, httpRequest, httpResponse, next) => {
    if (jsonParsingError instanceof SyntaxError && 'body' in jsonParsingError) {
        console.error('Invalid JSON payload received:', jsonParsingError.message);
        httpResponse.status(200).json({
          status: 400,
          message: 'Invalid JSON payload',
          success: false
        });
        return;
    }
    next();
};
app.use(jsonParsingErrorHandler);
app.use(requireJwt);

app.post('/ifs-sync/v1/:table', (httpRequest, httpResponse) =>
    ifsSyncController.handleSynchronizationRequest(httpRequest, httpResponse)
);
app.get('/health', (_, httpResponse) => {
    httpResponse.send('ok');
});

app.listen(PORT, () => {
    console.log(`IFS Sync Service started on port ${PORT}`);
    console.log(`Supported tables: ${ifsSynchronizationService.getSupportedTableNames().join(', ')}`);
});
