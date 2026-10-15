// order.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { OrderService } from './order.service';
import { environment } from '../../../../environments/environment';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/orders`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrderService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // acá sí conviene verify(): no hay pedidos automáticos que puedan quedar colgados
  });

  it('getById pide la orden correcta', () => {
    const mockOrder = { id: 5, status: 'pending' } as any;

    service.getById(5).subscribe((order) => {
      expect(order).toEqual(mockOrder);
    });

    const req = httpMock.expectOne(`${base}/5`);
    expect(req.request.method).toBe('GET');
    req.flush(mockOrder);
  });

  it('updateOrderStatus envía PATCH con el nuevo estado', () => {
    const mockOrder = { id: 5, status: 'shipped' } as any;

    service.updateOrderStatus(5, 'shipped' as any).subscribe((order) => {
      expect(order.status).toBe('shipped');
    });

    const req = httpMock.expectOne(`${base}/5/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'shipped' });
    req.flush(mockOrder);
  });
});