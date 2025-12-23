// src/middleware/validateUserContext.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request interface to include userContext
declare global {
  namespace Express {
    interface Request {
      userContext?: {
        userId: string;
        email: string;
        role: 'student' | 'admin' | 'enterprise';
        status: 'active' | 'blocked';
        isAuthenticated: boolean;
      };
    }
  }
}

export const validateUserContext = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Unauthorized: No token provided' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (decoded.type !== 'access') {
      res.status(403).json({ message: 'Invalid token type' });
      return;
    }

    // Check if user is blocked
    if (decoded.status === 'blocked') {
      res.status(403).json({ 
        message: 'Account has been blocked. Please contact support.' 
      });
      return;
    }

    req.userContext = {
      userId: decoded.id,
      email: decoded.email,
      role: decoded.role,
      status: decoded.status,
      isAuthenticated: true,
    };

    next();
  } catch (err: any) {
    console.error('User context validation error:', err.message);
    
    // Provide more specific error messages
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ 
        message: 'Token expired',
        error: 'Please refresh your token or login again' 
      });
      return;
    }
    
    if (err.name === 'JsonWebTokenError') {
      res.status(401).json({ 
        message: 'Invalid token',
        error: 'Token signature verification failed' 
      });
      return;
    }
    
    res.status(401).json({ message: 'Invalid token' });
  }
};