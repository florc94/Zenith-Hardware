import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController
} from '@angular/common/http/testing';

import {
  AdminOrderService,
  OrderResponse
} from './admin-order.service';

import { environment } from '../../../../../environments/environment';
import { OrderStatus } from '../../../orders/models/order.model';

describe('AdminOrderService', () => {

  let service: AdminOrderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminOrderService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AdminOrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ==========================================
  // CREACIÓN DEL SERVICIO
  // ==========================================

  it('should be created', () => {
    expect(service).toBeTruthy();
  });


  // ==========================================
  // GET ALL - PAGINACIÓN
  // ==========================================

  it('should fetch orders with pagination parameters', () => {

    const mockResponse: OrderResponse = {
      data: [],
      meta: {
        totalItems: 25,
        totalPages: 3,
        currentPage: 2,
        itemsPerPage: 10
      }
    };

    service.getAll(2, 10).subscribe(response => {

      expect(response).toEqual(mockResponse);
      expect(response.meta.currentPage).toBe(2);
      expect(response.meta.itemsPerPage).toBe(10);
      expect(response.meta.totalItems).toBe(25);

    });

    const req = httpMock.expectOne(
      request =>
        request.url === `${environment.apiUrl}/orders` &&
        request.method === 'GET'
    );

    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('10');

    req.flush(mockResponse);
  });


  // ==========================================
  // GET ALL - VALORES POR DEFECTO
  // ==========================================

  it('should use default pagination values', () => {

    const mockResponse: OrderResponse = {
      data: [],
      meta: {
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        itemsPerPage: 10
      }
    };

    service.getAll().subscribe(response => {

      expect(response).toEqual(mockResponse);

    });

    const req = httpMock.expectOne(
      request =>
        request.url === `${environment.apiUrl}/orders` &&
        request.method === 'GET'
    );

    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('10');

    req.flush(mockResponse);
  });


  // ==========================================
  // GET ALL - ERROR 500
  // ==========================================

  it('should handle server error when fetching orders', () => {

    service.getAll(1, 10).subscribe({
      next: () => fail('Expected an error'),
      error: error => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne(
      request =>
        request.url === `${environment.apiUrl}/orders` &&
        request.method === 'GET'
    );

    req.flush(
      {
        message: 'Internal Server Error'
      },
      {
        status: 500,
        statusText: 'Internal Server Error'
      }
    );
  });


  // ==========================================
  // UPDATE STATUS - PATCH
  // ==========================================

  it('should update order status', () => {

    const orderId = 15;
    const status = 'shipped' as OrderStatus;

    const mockResponse = {
      success: true
    };

    service.updateStatus(orderId, status).subscribe(response => {

      expect(response).toEqual(mockResponse);

    });

    const req = httpMock.expectOne(
      request =>
        request.url === `${environment.apiUrl}/orders/${orderId}/status` &&
        request.method === 'PATCH'
    );

    expect(req.request.body).toEqual({
      status
    });

    req.flush(mockResponse);
  });


  // ==========================================
  // UPDATE STATUS - ERROR 404
  // ==========================================

  it('should handle 404 error when updating order status', () => {

    const orderId = 999;
    const status = 'shipped' as OrderStatus;

    service.updateStatus(orderId, status).subscribe({
      next: () => fail('Expected an error'),
      error: error => {
        expect(error.status).toBe(404);
      }
    });

    const req = httpMock.expectOne(
      request =>
        request.url === `${environment.apiUrl}/orders/${orderId}/status` &&
        request.method === 'PATCH'
    );

    req.flush(
      {
        message: 'Order not found'
      },
      {
        status: 404,
        statusText: 'Not Found'
      }
    );
  });

});