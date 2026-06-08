export class AuthError extends Error {
  constructor(message, { code = "AUTH_ERROR", status = null } = {}) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.status = status;
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor(message = "Invalid email or password.") {
    super(message, { code: "INVALID_CREDENTIALS", status: 401 });
    this.name = "InvalidCredentialsError";
  }
}

export class ValidationError extends AuthError {
  constructor(message = "Please check the form and try again.") {
    super(message, { code: "VALIDATION_ERROR", status: 400 });
    this.name = "ValidationError";
  }
}
