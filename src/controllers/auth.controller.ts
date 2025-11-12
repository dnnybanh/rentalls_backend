import { Request, Response } from 'express';
import { RegisterRequest, RegisterResponse } from '../types/auth.types';
import { logRegistration } from '../utils/loggers';

export const register = (req: Request<{}, RegisterResponse, RegisterRequest>, res: Response<RegisterResponse>) => {
  try {
    const { email, fullName } = req.body;

    logRegistration('attempt', {
      email,
      fullName,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Simple registration - just return success
    res.status(200).json({ success: true });

    logRegistration('success', {
      email,
      fullName,
    });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error('Unknown error');
    logRegistration('failure', {
      email: req.body?.email,
      fullName: req.body?.fullName,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      error: errorObj,
    });

    res.status(500).json({ success: false });
  }
};

