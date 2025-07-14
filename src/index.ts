import express from 'express';
import { PORT } from './utilities/config';
import { prisma } from './utilities/prisma';
import { IfsTableSynchronizationService } from './services/ifs-sync-service';
import { IfsSyncController } from './controllers/ifs-sync-controller';
import { requireJwt } from './middlewares/jwt';
import { repairAndParseJSON } from './utilities/json-repair';

const app = express();

// Initialize services with simplified dependency injection
const ifsSynchronizationService = new IfsTableSynchronizationService(prisma);
const ifsSyncController = new IfsSyncController(ifsSynchronizationService);

// Custom middleware to handle JSON parsing with repair fallback
app.use((req, res, next) => {
    if (req.headers['content-type']?.includes('application/json')) {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                // First try normal JSON parsing
                req.body = JSON.parse(body);
                next();
            } catch (error) {
                console.log('JSON parse failed, attempting repair...', error);
                console.log('Raw body:', body);

                // Try to repair and parse the JSON
                const repairResult = repairAndParseJSON(body);

                if (repairResult.success) {
                    console.log('JSON repair successful!');
                    console.log('Repaired JSON:', JSON.stringify(repairResult.data, null, 2));
                    req.body = repairResult.data;
                    next();
                } else {
                    console.error('JSON repair failed:', repairResult.error);
                    res.status(400).json({
                        error: "Invalid JSON payload",
                        details: repairResult.error,
                        originalBody: body
                    });
                }
            }
        });
    } else {
        next();
    }
});

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

app.post('/:table', (httpRequest, httpResponse) =>
    ifsSyncController.handleSynchronizationRequest(httpRequest, httpResponse)
);
app.get('/health', (_, httpResponse) => {
    httpResponse.send('ok');
});

app.listen(PORT, () => {
    console.log(`IFS Sync Service started on port ${PORT}`);
    console.log(`Supported tables: ${ifsSynchronizationService.getSupportedTableNames().join(', ')}`);
});
