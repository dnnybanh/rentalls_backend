import { Request, Response, NextFunction } from 'express';
import {
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  LoginRequest,
  LoginResponse,
} from '../types/auth.types';
import { logRegistration, logAuthEvent, logLoginAttempt } from '../utils/loggers';
import { createUser, sendEmailVerification, verifyEmailByUid, loginUser } from '../services/firebase.service';
import {
  UserExistsError,
  FirebaseError,
  UserNotFoundError,
  InvalidCredentialsError,
  EmailNotVerifiedError,
} from '../utils/errors';
import { logValidationError } from '../utils/loggers';

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation: at least 6 characters (Firebase minimum requirement)
const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (!password || password.length < 6) {
    return {
      valid: false,
      message: 'Password must be at least 6 characters long',
    };
  }
  return { valid: true };
};

// Email format validation
const validateEmail = (email: string): { valid: boolean; message?: string } => {
  if (!email || !emailRegex.test(email)) {
    return {
      valid: false,
      message: 'Invalid email format',
    };
  }
  return { valid: true };
};

export const register = async (
  req: Request<{}, RegisterResponse, RegisterRequest>,
  res: Response<RegisterResponse>,
  next: NextFunction
) => {
  try {
    const { email, fullName, password } = req.body;

    // Log registration attempt
    logRegistration('attempt', {
      email,
      fullName,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Validate required fields
    if (!email || !fullName || !password) {
      logValidationError('registration_fields', req.body, 'Missing required fields', {
        schema: 'user_registration',
      });
      return res.status(400).json({
        success: false,
        message: 'Email, fullName, and password are required',
      });
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      logValidationError('email', email, emailValidation.message || 'Invalid email format', {
        schema: 'user_registration',
      });
      return res.status(400).json({
        success: false,
        message: emailValidation.message,
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      logValidationError('password', '***', passwordValidation.message || 'Invalid password', {
        schema: 'user_registration',
      });
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    // Create user in Firebase
    const userRecord = await createUser({
      email,
      password,
      displayName: fullName,
    });

    // Send email verification
    try {
      await sendEmailVerification(userRecord.uid);
      logAuthEvent('email_verification_link_sent', 'info', {
        userId: userRecord.uid,
        email: userRecord.email,
      });
    } catch (verificationError) {
      // Log error but don't fail registration if email verification fails
      logAuthEvent('email_verification_link_failed', 'warn', {
        userId: userRecord.uid,
        email: userRecord.email,
        error: verificationError instanceof Error ? verificationError.message : 'Unknown error',
      });
    }

    // Log successful registration
    logRegistration('success', {
      userId: userRecord.uid,
      email: userRecord.email,
      fullName,
    });

    // Return success response
    res.status(201).json({
      success: true,
      userId: userRecord.uid,
      emailVerified: userRecord.emailVerified,
      message: 'User registered successfully. Please check your email for verification.',
    });
  } catch (error) {
    // Handle specific Firebase errors
    if (error instanceof UserExistsError) {
      logRegistration('failure', {
        email: req.body?.email,
        fullName: req.body?.fullName,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        error: error,
      });
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    if (error instanceof FirebaseError) {
      logRegistration('failure', {
        email: req.body?.email,
        fullName: req.body?.fullName,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        error: error,
      });
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    // Handle unknown errors
    const errorObj = error instanceof Error ? error : new Error('Unknown error');
    logRegistration('failure', {
      email: req.body?.email,
      fullName: req.body?.fullName,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      error: errorObj,
    });

    // Pass to error handler middleware
    next(errorObj);
  }
};

export const verifyEmail = async (
  req: Request<{}, VerifyEmailResponse, VerifyEmailRequest>,
  res: Response<VerifyEmailResponse>,
  next: NextFunction
) => {
  try {
    const { uid } = req.body;

    // Validate required field
    if (!uid) {
      logValidationError('uid', req.body, 'Missing required field: uid', {
        schema: 'email_verification',
      });
      return res.status(400).json({
        success: false,
        message: 'User ID (uid) is required',
      });
    }

    // Log verification attempt
    logAuthEvent('email_verification_attempt', 'info', {
      userId: uid,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Verify email
    const userRecord = await verifyEmailByUid(uid);

    // Log successful verification
    logAuthEvent('email_verification_success', 'info', {
      userId: uid,
      email: userRecord.email,
    });

    res.status(200).json({
      success: true,
      emailVerified: userRecord.emailVerified,
      message: 'Email verified successfully',
    });
  } catch (error) {
    // Handle specific errors
    if (error instanceof UserNotFoundError) {
      logAuthEvent('email_verification_failed', 'warn', {
        userId: req.body?.uid,
        ip: req.ip,
        error: error.message,
      });
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error instanceof FirebaseError) {
      logAuthEvent('email_verification_failed', 'error', {
        userId: req.body?.uid,
        ip: req.ip,
        error: error.message,
      });
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    // Handle unknown errors
    const errorObj = error instanceof Error ? error : new Error('Unknown error');
    logAuthEvent('email_verification_failed', 'error', {
      userId: req.body?.uid,
      ip: req.ip,
      error: errorObj,
    });

    // Pass to error handler middleware
    next(errorObj);
  }
};

export const login = async (
  req: Request<{}, LoginResponse, LoginRequest>,
  res: Response<LoginResponse>,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      logValidationError('login_fields', req.body, 'Missing required fields', {
        schema: 'user_login',
      });
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      logValidationError('email', email, emailValidation.message || 'Invalid email format', {
        schema: 'user_login',
      });
      return res.status(400).json({
        success: false,
        message: emailValidation.message,
      });
    }

    // Log login attempt
    logLoginAttempt(false, {
      email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Attempt login
    const loginResult = await loginUser(email, password);

    // Log successful login
    logLoginAttempt(true, {
      userId: loginResult.user.uid,
      email: loginResult.user.email,
      ip: req.ip,
    });

    // Return success response
    res.status(200).json({
      success: true,
      userId: loginResult.user.uid,
      emailVerified: loginResult.user.emailVerified,
      token: loginResult.idToken,
    });
  } catch (error) {
    // Handle specific Firebase errors
    if (error instanceof InvalidCredentialsError) {
      logLoginAttempt(false, {
        email: req.body?.email,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        error: error.message,
      });
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    if (error instanceof EmailNotVerifiedError) {
      logLoginAttempt(false, {
        email: req.body?.email,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        error: error.message,
      });
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (error instanceof FirebaseError) {
      logLoginAttempt(false, {
        email: req.body?.email,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        error: error.message,
      });
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    // Handle unknown errors
    const errorObj = error instanceof Error ? error : new Error('Unknown error');
    logLoginAttempt(false, {
      email: req.body?.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      error: errorObj,
    });

    // Pass to error handler middleware
    next(errorObj);
  }
};

