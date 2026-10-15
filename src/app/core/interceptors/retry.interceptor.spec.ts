import {
  HttpClient,
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';

import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import {
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';

import { retryInterceptor } from './retry.interceptor';

describe('retryInterceptor', () => {

  let http: HttpClient;
  let httpMock: HttpTestingController;


  beforeEach(() => {

    TestBed.configureTestingModule({
      providers: [

        provideHttpClient(
          withInterceptors([
            retryInterceptor
          ])
        ),

        provideHttpClientTesting()

      ]
    });

    http = TestBed.inject(HttpClient);

    httpMock =
      TestBed.inject(HttpTestingController);

  });


  afterEach(() => {
    httpMock.verify();
  });


  // ==========================================
  // GET EXITOSO
  // ==========================================

  it('should not retry a successful GET', () => {

    let response: any;

    http.get('/api/test').subscribe(data => {
      response = data;
    });

    const req = httpMock.expectOne('/api/test');

    expect(req.request.method).toBe('GET');

    req.flush({
      success: true
    });

    expect(response).toEqual({
      success: true
    });

  });


  // ==========================================
  // ERROR 500
  // ==========================================

  it('should retry on 500 server error', fakeAsync(() => {

    let response: any;

    http.get('/api/test').subscribe(data => {
      response = data;
    });


    // ========================================
    // INTENTO ORIGINAL
    // ========================================

    let req = httpMock.expectOne('/api/test');

    expect(req.request.method).toBe('GET');

    req.flush(
      {},
      {
        status: 500,
        statusText: 'Internal Server Error'
      }
    );


    // ========================================
    // ESPERAMOS EL BACKOFF DE 1 SEGUNDO
    // ========================================

    tick(1000);


    // ========================================
    // RETRY #1
    // ========================================

    req = httpMock.expectOne('/api/test');

    expect(req.request.method).toBe('GET');

    req.flush({
      success: true
    });


    // ========================================
    // VERIFICAMOS LA RESPUESTA FINAL
    // ========================================

    expect(response).toEqual({
      success: true
    });

  }));


  // ==========================================
  // ERROR 503
  // ==========================================

  it('should retry on 503 server error', fakeAsync(() => {

    let response: any;

    http.get('/api/test').subscribe(data => {
      response = data;
    });


    // Intento original
    let req = httpMock.expectOne('/api/test');

    expect(req.request.method).toBe('GET');

    req.flush(
      {},
      {
        status: 503,
        statusText: 'Service Unavailable'
      }
    );


    // Backoff de 1 segundo
    tick(1000);


    // Retry #1
    req = httpMock.expectOne('/api/test');

    expect(req.request.method).toBe('GET');

    req.flush({
      success: true
    });


    expect(response).toEqual({
      success: true
    });

  }));


  // ==========================================
  // ERROR 400
  // ==========================================

  it('should not retry on 400 client error', () => {

    let errorStatus = 0;

    http.get('/api/test').subscribe({
      error: error => {
        errorStatus = error.status;
      }
    });


    const req = httpMock.expectOne('/api/test');

    req.flush(
      {},
      {
        status: 400,
        statusText: 'Bad Request'
      }
    );


    expect(errorStatus).toBe(400);

    expect(
      httpMock.match('/api/test').length
    ).toBe(0);

  });


  // ==========================================
  // ERROR 401
  // ==========================================

  it('should not retry on 401 unauthorized', () => {

    let errorStatus = 0;

    http.get('/api/test').subscribe({
      error: error => {
        errorStatus = error.status;
      }
    });


    const req = httpMock.expectOne('/api/test');

    req.flush(
      {},
      {
        status: 401,
        statusText: 'Unauthorized'
      }
    );


    expect(errorStatus).toBe(401);

    expect(
      httpMock.match('/api/test').length
    ).toBe(0);

  });


  // ==========================================
  // ERROR 404
  // ==========================================

  it('should not retry on 404 not found', () => {

    let errorStatus = 0;

    http.get('/api/test').subscribe({
      error: error => {
        errorStatus = error.status;
      }
    });


    const req = httpMock.expectOne('/api/test');

    req.flush(
      {},
      {
        status: 404,
        statusText: 'Not Found'
      }
    );


    expect(errorStatus).toBe(404);

    expect(
      httpMock.match('/api/test').length
    ).toBe(0);

  });


  // ==========================================
  // POST
  // ==========================================

  it('should not retry POST requests', () => {

    let response: any;

    http.post('/api/test', {
      name: 'Test'
    }).subscribe(data => {
      response = data;
    });


    const req = httpMock.expectOne('/api/test');

    expect(req.request.method).toBe('POST');

    req.flush({
      success: true
    });


    expect(response).toEqual({
      success: true
    });

  });


  // ==========================================
  // MÁXIMO DE REINTENTOS
  // ==========================================

  it(
    'should retry only twice on repeated 500 errors',
    fakeAsync(() => {

      let errorStatus = 0;

      http.get('/api/test').subscribe({
        error: error => {
          errorStatus = error.status;
        }
      });


      // ========================================
      // INTENTO ORIGINAL
      // ========================================

      let req = httpMock.expectOne('/api/test');

      req.flush(
        {},
        {
          status: 500,
          statusText: 'Internal Server Error'
        }
      );


      // ========================================
      // RETRY #1
      // ========================================

      tick(1000);

      req = httpMock.expectOne('/api/test');

      req.flush(
        {},
        {
          status: 500,
          statusText: 'Internal Server Error'
        }
      );


      // ========================================
      // RETRY #2
      // ========================================

      tick(2000);

      req = httpMock.expectOne('/api/test');

      req.flush(
        {},
        {
          status: 500,
          statusText: 'Internal Server Error'
        }
      );


      // ========================================
      // NO DEBE HABER RETRY #3
      // ========================================

      expect(errorStatus).toBe(500);

      expect(
        httpMock.match('/api/test').length
      ).toBe(0);

    })
  );

});