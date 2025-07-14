// src/middleware/requireJwt.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../utilities/config';

export function requireJwt(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.toLowerCase().startsWith('bearer ')) {
    res.status(401).json({ error: 'JWT token missing' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (!decoded?.org?.id) {
      res.status(403).json({ error: 'Missing org.id in JWT' });
      return;
    }
    (req as any).orgId = decoded.org.id;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid JWT token', details: (err as any).message });
    return;
  }
}
