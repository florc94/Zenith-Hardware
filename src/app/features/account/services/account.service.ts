import { HttpClient } from '@angular/common/http';

import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';


// =====================================================
// CONDICIÓN FISCAL
// =====================================================

export type TaxCondition =
  | 'final_consumer'
  | 'registered'
  | 'unregistered'
  | 'monotributo'
  | 'exempt';


// =====================================================
// PERFIL DEL CLIENTE
//
// Este es el contrato con el backend:
//   GET   /users/me          -> devuelve un AccountProfile
//   PUT   /users/me          -> recibe un AccountProfileUpdate
//                               y devuelve el AccountProfile guardado
//   PATCH /users/me/contact  -> recibe un ContactUpdate
//                               y devuelve el AccountProfile guardado
// =====================================================

export interface AccountProfile {

  // Solo lectura
  id: number;

  email: string;


  // Datos personales
  name: string;

  dni: string;

  phoneArea: string;

  phone: string;


  // Domicilio de facturación
  street: string;

  floorApt: string;

  postalCode: string;

  city: string;

  province: string;


  // Condición fiscal
  taxCondition: TaxCondition;

  taxId: string;

  taxName: string;

}


/*
 * Lo que se envía al guardar: todo menos
 * los campos de solo lectura (id y email).
 */

export type AccountProfileUpdate =
  Omit<AccountProfile, 'id' | 'email'>;


/*
 * Datos de contacto que se piden al verificar la cuenta.
 * "document" es un DNI (7-8 dígitos) o un CUIL (11 dígitos).
 */

export interface ContactUpdate {

  phoneArea: string;

  phone: string;

  document: string;

}


@Injectable({
  providedIn: 'root'
})
export class AccountService {

  private readonly http = inject(HttpClient);

  private readonly base =
    `${environment.apiUrl}/users/me`;


  // =====================================================
  // OBTENER MI PERFIL
  // =====================================================

  getProfile(): Observable<AccountProfile> {

    return this.http.get<AccountProfile>(
      this.base
    );

  }


  // =====================================================
  // GUARDAR MI PERFIL
  // =====================================================

  updateProfile(
    profile: AccountProfileUpdate
  ): Observable<AccountProfile> {

    return this.http.put<AccountProfile>(
      this.base,
      profile
    );

  }


  // =====================================================
  // GUARDAR SOLO DATOS DE CONTACTO
  // (código de área, teléfono y DNI/CUIL)
  // =====================================================

  updateContact(
    contact: ContactUpdate
  ): Observable<AccountProfile> {

    return this.http.patch<AccountProfile>(
      `${this.base}/contact`,
      contact
    );

  }

}