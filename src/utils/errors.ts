export class FirebaseError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.name = 'FirebaseError';
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UserExistsError extends FirebaseError {
  constructor(email: string) {
    super(`User with email ${email} already exists`, 409, 'auth/email-already-exists');
    this.name = 'UserExistsError';
  }
}

export class InvalidCredentialsError extends FirebaseError {
  constructor(message: string = 'Invalid email or password') {
    super(message, 401, 'auth/invalid-credential');
    this.name = 'InvalidCredentialsError';
  }
}

export class EmailNotVerifiedError extends FirebaseError {
  constructor(message: string = 'Email address has not been verified') {
    super(message, 403, 'auth/email-not-verified');
    this.name = 'EmailNotVerifiedError';
  }
}

export class UserNotFoundError extends FirebaseError {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`, 404, 'auth/user-not-found');
    this.name = 'UserNotFoundError';
  }
}

export class InvalidTokenError extends FirebaseError {
  constructor(message: string = 'Invalid or expired verification token') {
    super(message, 400, 'auth/invalid-action-code');
    this.name = 'InvalidTokenError';
  }
}

