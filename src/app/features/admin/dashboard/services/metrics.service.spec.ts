import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController
} from '@angular/common/http/testing';

import {
  MetricsService,
  DashboardMetrics
} from './metrics.service';

import { environment } from '../../../../../environments/environment';

describe('MetricsService', () => {

  let service: MetricsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {

    TestBed.configureTestingModule({
      providers: [
        MetricsService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(MetricsService);
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
  // GET METRICS
  // ==========================================

  it('should fetch dashboard metrics successfully', () => {

    const mockMetrics: DashboardMetrics = {

      totalOrders: 15,

      totalRevenue: 2500.50,

      thisMonthRevenue: 800,

      avgOrderValue: 166.7,

      avgDeliveryTimeHours: 72,

      ordersByStatus: {
        paid: 5,
        processing: 3,
        shipped: 2,
        delivered: 5,
        cancelled: 0
      },

      topProducts: []
    };


    service.get().subscribe(metrics => {

      expect(metrics).toEqual(mockMetrics);

      expect(metrics.totalOrders).toBe(15);

      expect(metrics.totalRevenue).toBe(2500.50);

      expect(metrics.thisMonthRevenue).toBe(800);

    });


    const req = httpMock.expectOne(
      request =>
        request.url === `${environment.apiUrl}/orders/metrics` &&
        request.method === 'GET'
    );


    expect(req.request.method).toBe('GET');


    req.flush(mockMetrics);
  });


  // ==========================================
  // ERROR 500
  // ==========================================

  it('should handle server error when fetching metrics', () => {

    service.get().subscribe({

      next: () => fail('Expected an error'),

      error: error => {
        expect(error.status).toBe(500);
      }

    });


    const req = httpMock.expectOne(
      request =>
        request.url === `${environment.apiUrl}/orders/metrics` &&
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

});