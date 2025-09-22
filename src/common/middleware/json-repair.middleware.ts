import { repairAndParseJSON } from '../utils/json-repair.util';

// Simple approach: Replace express.json() with our own JSON parser
export function jsonRepairMiddleware(req: any, res: any, next: any) {
  // Only process JSON content
  if (!req.headers['content-type']?.includes('application/json')) {
    next();
    return;
  }

  let body = '';

  req.on('data', (chunk: any) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    if (!body) {
      req.body = {};
      next();
      return;
    }

    try {
      // First try normal JSON parsing
      req.body = JSON.parse(body);
      next();
    } catch (error) {
      // Try to repair and parse the JSON
      const repairResult = repairAndParseJSON(body);

      if (repairResult.success) {
        req.body = repairResult.data;
        next();
      } else {
        res.status(200).json({
          message: 'Invalid JSON payload',
          success: false
        });
      }
    }
  });

  req.on('error', () => {
    res.status(200).json({
      message: 'Request error',
      success: false
    });
  });
}
