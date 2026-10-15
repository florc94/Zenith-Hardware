export type UserRole = 'user' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  token: string;
  emailVerified?: boolean;

  // true si el usuario ya cargó DNI, código de área y teléfono.
  // Opcional por compatibilidad con sesiones guardadas antes.
  profileComplete?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  email: string;
}