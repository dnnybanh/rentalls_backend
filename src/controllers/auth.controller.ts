import { Request, Response } from 'express';
import { RegisterRequest, RegisterResponse } from '../types/auth.types';

export const register = (req: Request<{}, RegisterResponse, RegisterRequest>, res: Response<RegisterResponse>) => {
  // Simple registration - just return success
  res.status(200).json({ success: true });
};

