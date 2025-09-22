import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppConfig } from '../config/app.config';

export function jwtMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.toLowerCase().startsWith('bearer ')) {
    res.status(401).json({
      message: 'JWT token missing',
      success: false
    });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded: any = jwt.verify(token, AppConfig.jwtSecret);
    if (!decoded?.org?.id) {
      res.status(403).json({
        message: 'Missing org.id in JWT',
        success: false
      });
      return;
    }
    (req as any).organizationId = decoded.org.id;
    next();
  } catch (err) {
    res.status(403).json({
      message: 'Invalid JWT token',
      success: false
    });
    return;
  }
}
