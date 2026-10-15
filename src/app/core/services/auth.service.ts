import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  User
} from '../models/user.model';

const STORAGE_KEY = 'shopsphere_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly _currentUser = signal<User | null>(
    this.readFromStorage()
  );

  readonly currentUser = this._currentUser.asReadonly();

  readonly isAuthenticated = computed(
    () => this._currentUser() !== null
  );

  readonly isAdmin = computed(
    () => this._currentUser()?.role === 'admin'
  );

  /**
   * true si el usuario tiene cargados código de área,
   * teléfono y DNI/CUIL.
   */
  readonly isProfileComplete = computed(
    () => this._currentUser()?.profileComplete === true
  );

  constructor(
    private http: HttpClient
  ) {}

  /**
   * Inicia sesión.
   * La sesión se guarda solamente si el backend
   * permite el acceso.
   */
  login(payload: LoginRequest): Observable<User> {
    return this.http
      .post<User>(
        `${environment.apiUrl}/auth/login`,
        payload
      )
      .pipe(
        tap((user) => this.setSession(user))
      );
  }

  /**
   * Registra una cuenta nueva.
   * No inicia sesión: el usuario debe verificar
   * primero su dirección de correo electrónico.
   */
  register(payload: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(
      `${environment.apiUrl}/auth/register`,
      payload
    );
  }

  /**
   * Verifica el correo electrónico.
   * Si el backend confirma la validación y devuelve
   * el usuario con su token, guarda la sesión.
   */
  verifyEmail(token: string): Observable<User> {
    return this.http
      .post<User>(
        `${environment.apiUrl}/auth/verify-email`,
        { token }
      )
      .pipe(
        tap((user) => this.setSession(user))
      );
  }

  /**
   * Cierra la sesión.
   */
  logout(): void {
    this._currentUser.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Obtiene el token de la sesión actual.
   */
  getToken(): string | null {
    return this._currentUser()?.token ?? null;
  }

  /**
   * Actualiza los datos del usuario autenticado.
   * Conserva el token y el resto de la sesión.
   */
  updateUser(changes: Partial<User>): void {
    const current = this._currentUser();

    if (!current) {
      return;
    }

    this.setSession({
      ...current,
      ...changes
    });
  }

  /**
   * Guarda la sesión.
   */
  private setSession(user: User): void {
    this._currentUser.set(user);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(user)
    );
  }

  /**
   * Recupera una sesión guardada.
   */
  private readFromStorage(): User | null {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}