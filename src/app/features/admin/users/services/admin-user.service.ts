import {
  Injectable,
  inject
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';


export interface AdminUserOrder {
  id: number;
  status: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: string | null;
  createdAt: string;
  statusUpdatedAt: string;
}


export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  orderCount: number;
}


export interface AdminUserDetail
  extends AdminUser {

  totalSpent: number;

  lastOrder:
    AdminUserOrder | null;

  orders:
    AdminUserOrder[];
}


@Injectable({
  providedIn: 'root'
})
export class AdminUserService {

  private readonly http =
    inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:3000/api/users';


  // ==========================================
  // LISTADO
  // ==========================================

  getUsers(): Observable<AdminUser[]> {

    return this.http.get<AdminUser[]>(
      this.apiUrl
    );
  }


  // ==========================================
  // DETALLE
  // ==========================================

  getUserById(
    id: number
  ): Observable<AdminUserDetail> {

    return this.http.get<AdminUserDetail>(
      `${this.apiUrl}/${id}`
    );
  }


  // ==========================================
  // CAMBIAR ROL
  // ==========================================

  updateUserRole(
    id: number,
    role: 'user' | 'admin'
  ): Observable<{
    message: string;
    user: AdminUser;
  }> {

    return this.http.patch<{
      message: string;
      user: AdminUser;
    }>(
      `${this.apiUrl}/${id}/role`,
      { role }
    );
  }


  // ==========================================
  // ELIMINAR USUARIO
  // ==========================================

  deleteUser(
    id: number
  ): Observable<{
    message: string;
    userId: number;
  }> {

    return this.http.delete<{
      message: string;
      userId: number;
    }>(
      `${this.apiUrl}/${id}`
    );
  }

}