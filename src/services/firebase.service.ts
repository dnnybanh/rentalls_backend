import { auth, getFirebaseApiKey } from '../config/firebase.config';
import {
  FirebaseError,
  UserExistsError,
  UserNotFoundError,
  InvalidTokenError,
  InvalidCredentialsError,
} from '../utils/errors';
import { logAuthEvent } from '../utils/loggers';

export interface CreateUserParams {
  email: string;
  password: string;
  displayName?: string;
}

export interface UserRecord {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  createdAt: number;
}

/**
 * Create a new user in Firebase Auth
 */
export const createUser = async (params: CreateUserParams): Promise<UserRecord> => {
  try {
    const { email, password, displayName } = params;

    // Check if user already exists
    try {
      await auth.getUserByEmail(email);
      throw new UserExistsError(email);
    } catch (error: any) {
      // If error is not "user not found", re-throw it
      if (error instanceof UserExistsError) {
        throw error;
      }
      // If it's a "user not found" error, continue with user creation
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create the user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: false, // Email verification will be sent separately
    });

    logAuthEvent('user_created', 'info', {
      userId: userRecord.uid,
      email: userRecord.email,
    });

    return {
      uid: userRecord.uid,
      email: userRecord.email || '',
      emailVerified: userRecord.emailVerified || false,
      displayName: userRecord.displayName || displayName,
      createdAt: userRecord.metadata.creationTime
        ? new Date(userRecord.metadata.creationTime).getTime()
        : Date.now(),
    };
  } catch (error: any) {
    if (error instanceof UserExistsError || error instanceof FirebaseError) {
      throw error;
    }

    // Handle Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      throw new UserExistsError(params.email);
    }

    logAuthEvent('user_creation_failed', 'error', {
      email: params.email,
      error: error.message || 'Unknown error',
    });

    throw new FirebaseError(
      error.message || 'Failed to create user',
      500,
      error.code
    );
  }
};

/**
 * Send email verification link to user
 */
export const sendEmailVerification = async (uid: string): Promise<string> => {
  try {
    const user = await auth.getUser(uid);

    if (!user.email) {
      throw new FirebaseError('User does not have an email address', 400);
    }

    if (user.emailVerified) {
      logAuthEvent('email_already_verified', 'info', {
        userId: uid,
        email: user.email,
      });
      // Return a message indicating email is already verified
      return 'Email is already verified';
    }

    // Generate email verification link
    const actionCodeSettings = {
      url: process.env.EMAIL_VERIFICATION_REDIRECT_URL || 'http://localhost:3000/email-verified',
      handleCodeInApp: false,
    };

    const link = await auth.generateEmailVerificationLink(user.email, actionCodeSettings);

    logAuthEvent('email_verification_sent', 'info', {
      userId: uid,
      email: user.email,
    });

    return link;
  } catch (error: any) {
    if (error instanceof FirebaseError) {
      throw error;
    }

    if (error.code === 'auth/user-not-found') {
      throw new UserNotFoundError(uid);
    }

    logAuthEvent('email_verification_failed', 'error', {
      userId: uid,
      error: error.message || 'Unknown error',
    });

    throw new FirebaseError(
      error.message || 'Failed to send email verification',
      500,
      error.code
    );
  }
};

/**
 * Verify email using action code (from verification link)
 */
export const verifyEmailWithActionCode = async (actionCode: string): Promise<UserRecord> => {
  try {
    // Note: Firebase Admin SDK doesn't have a direct method to verify email with action code
    // The action code is typically handled on the client side or via a REST API call
    // For server-side verification, we'll need to use the Firebase REST API or
    // verify the token and then mark the email as verified
    
    // Alternative: If you have the UID, you can directly verify the email
    // This is a workaround - in production, you might want to use Firebase REST API
    throw new FirebaseError(
      'Email verification with action code should be handled client-side or via Firebase REST API',
      400,
      'auth/operation-not-allowed'
    );
  } catch (error: any) {
    if (error instanceof FirebaseError) {
      throw error;
    }
    throw new InvalidTokenError(error.message || 'Invalid verification token');
  }
};

/**
 * Verify email by directly updating user (alternative method)
 * This can be used if you have the UID and want to verify the email server-side
 */
export const verifyEmailByUid = async (uid: string): Promise<UserRecord> => {
  try {
    const user = await auth.getUser(uid);

    if (user.emailVerified) {
      return {
        uid: user.uid,
        email: user.email || '',
        emailVerified: true,
        displayName: user.displayName,
        createdAt: user.metadata.creationTime
          ? new Date(user.metadata.creationTime).getTime()
          : Date.now(),
      };
    }

    // Update user to mark email as verified
    await auth.updateUser(uid, {
      emailVerified: true,
    });

    logAuthEvent('email_verified', 'info', {
      userId: uid,
      email: user.email,
    });

    const updatedUser = await auth.getUser(uid);

    return {
      uid: updatedUser.uid,
      email: updatedUser.email || '',
      emailVerified: true,
      displayName: updatedUser.displayName,
      createdAt: updatedUser.metadata.creationTime
        ? new Date(updatedUser.metadata.creationTime).getTime()
        : Date.now(),
    };
  } catch (error: any) {
    if (error instanceof FirebaseError) {
      throw error;
    }

    if (error.code === 'auth/user-not-found') {
      throw new UserNotFoundError(uid);
    }

    logAuthEvent('email_verification_update_failed', 'error', {
      userId: uid,
      error: error.message || 'Unknown error',
    });

    throw new FirebaseError(
      error.message || 'Failed to verify email',
      500,
      error.code
    );
  }
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<UserRecord | null> => {
  try {
    const user = await auth.getUserByEmail(email);
    return {
      uid: user.uid,
      email: user.email || '',
      emailVerified: user.emailVerified || false,
      displayName: user.displayName,
      createdAt: user.metadata.creationTime
        ? new Date(user.metadata.creationTime).getTime()
        : Date.now(),
    };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return null;
    }
    throw new FirebaseError(
      error.message || 'Failed to get user',
      500,
      error.code
    );
  }
};

/**
 * Get user by UID
 */
export const getUserById = async (uid: string): Promise<UserRecord> => {
  try {
    const user = await auth.getUser(uid);
    return {
      uid: user.uid,
      email: user.email || '',
      emailVerified: user.emailVerified || false,
      displayName: user.displayName,
      createdAt: user.metadata.creationTime
        ? new Date(user.metadata.creationTime).getTime()
        : Date.now(),
    };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      throw new UserNotFoundError(uid);
    }
    throw new FirebaseError(
      error.message || 'Failed to get user',
      500,
      error.code
    );
  }
};

/**
 * Login interface for response
 */
export interface LoginResult {
  user: UserRecord;
  idToken: string;
  refreshToken: string;
}

/**
 * Login user with email and password using Firebase Auth REST API
 */
export const loginUser = async (email: string, password: string): Promise<LoginResult> => {
  try {
    const apiKey = getFirebaseApiKey();
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (!projectId) {
      throw new FirebaseError('FIREBASE_PROJECT_ID is not configured', 500);
    }

    // Use Firebase Auth REST API to sign in
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // Handle Firebase Auth errors
      const errorMessage = data.error?.message || 'Login failed';
      const errorCode = data.error?.code || 'auth/login-failed';

      logAuthEvent('login_failed', 'warn', {
        email,
        error: errorMessage,
        code: errorCode,
      });

      // Map Firebase error codes to our custom errors
      if (errorCode === 400 || errorMessage.includes('INVALID_PASSWORD') || errorMessage.includes('INVALID_EMAIL')) {
        throw new InvalidCredentialsError('Invalid email or password');
      }
      if (errorMessage.includes('USER_NOT_FOUND') || errorMessage.includes('EMAIL_NOT_FOUND')) {
        throw new InvalidCredentialsError('Invalid email or password');
      }
      if (errorMessage.includes('EMAIL_NOT_VERIFIED')) {
        throw new EmailNotVerifiedError('Email address has not been verified');
      }

      throw new FirebaseError(errorMessage, response.status, errorCode.toString());
    }

    // Verify the ID token using Admin SDK
    const decodedToken = await auth.verifyIdToken(data.idToken);
    
    // Get user record
    const userRecord = await getUserById(decodedToken.uid);

    logAuthEvent('login_success', 'info', {
      userId: userRecord.uid,
      email: userRecord.email,
    });

    return {
      user: userRecord,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
    };
  } catch (error: any) {
    // Re-throw custom errors
    if (
      error instanceof InvalidCredentialsError ||
      error instanceof EmailNotVerifiedError ||
      error instanceof FirebaseError
    ) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      logAuthEvent('login_network_error', 'error', {
        email,
        error: error.message,
      });
      throw new FirebaseError('Network error during login', 500);
    }

    // Handle unknown errors
    logAuthEvent('login_error', 'error', {
      email,
      error: error.message || 'Unknown error',
    });

    throw new FirebaseError(
      error.message || 'Login failed',
      500,
      error.code
    );
  }
};

