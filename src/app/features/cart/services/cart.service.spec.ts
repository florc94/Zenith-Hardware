import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController
} from '@angular/common/http/testing';

import { CartService } from './cart.service';
import { Product } from '../../catalog/models/product.model';

import { environment } from '../../../../environments/environment';

const mockProduct: Product = {
  id: 1,
  name: 'Zapatillas urbanas',
  description: 'Cómodas y livianas',
  price: 50,
  category: 'Calzado',
  imageUrl: 'https://example.com/img.jpg',
  stock: 10,
  rating: 4.5
};

describe('CartService', () => {

  let service: CartService;
  let httpMock: HttpTestingController;

  beforeEach(() => {

    TestBed.configureTestingModule({
      providers: [
        CartService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);

    // El constructor ejecuta GET /cart
    const initialLoad = httpMock.expectOne(
      req =>
        req.url === `${environment.apiUrl}/cart` &&
        req.method === 'GET'
    );

    initialLoad.flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });


  // ==========================================
  // ESTADO INICIAL
  // ==========================================

  it('empieza vacío', () => {

    expect(service.items()).toEqual([]);
    expect(service.itemCount()).toBe(0);
    expect(service.subtotal()).toBe(0);

  });


  // ==========================================
  // AGREGAR PRODUCTO
  // ==========================================

  it('agrega un producto nuevo', () => {

    service.addItem(mockProduct, 2);

    const req = httpMock.expectOne(
      request =>
        request.url === `${environment.apiUrl}/cart/items` &&
        request.method === 'POST'
    );

    expect(req.request.body).toEqual({
      productId: mockProduct.id,
      quantity: 2
    });

    req.flush({
      success: true
    });

    expect(service.items().length).toBe(1);
    expect(service.items()[0].quantity).toBe(2);
    expect(service.itemCount()).toBe(2);
    expect(service.subtotal()).toBe(100);

  });


  // ==========================================
  // SUMAR CANTIDAD
  // ==========================================

  it('suma cantidad si el producto ya está en el carrito', () => {

    // Primera llamada
    service.addItem(mockProduct, 1);

    let req = httpMock.expectOne(
      request =>
        request.url === `${environment.apiUrl}/cart/items` &&
        request.method === 'POST'
    );

    expect(req.request.body).toEqual({
      productId: mockProduct.id,
      quantity: 1
    });

    // Simulamos respuesta del backend
    req.flush({
      success: true
    });


    // Segunda llamada
    service.addItem(mockProduct, 2);

    req = httpMock.expectOne(
      request =>
        request.url === `${environment.apiUrl}/cart/items` &&
        request.method === 'POST'
    );

    // El servicio debe enviar 1 + 2 = 3
    expect(req.request.body).toEqual({
      productId: mockProduct.id,
      quantity: 3
    });

    // Simulamos nuevamente respuesta del backend
    req.flush({
      success: true
    });


    expect(service.items().length).toBe(1);
    expect(service.items()[0].quantity).toBe(3);
    expect(service.itemCount()).toBe(3);
    expect(service.subtotal()).toBe(150);

  });


  // ==========================================
  // ELIMINAR AL LLEGAR A 0
  // ==========================================

  it('elimina el producto si la cantidad llega a 0', () => {

    service.addItem(mockProduct, 1);

    let req = httpMock.expectOne(
      request =>
        request.url === `${environment.apiUrl}/cart/items` &&
        request.method === 'POST'
    );

    req.flush({
      success: true
    });


    service.updateQuantity(mockProduct.id, 0);

    req = httpMock.expectOne(
      request =>
        request.url === `${environment.apiUrl}/cart/items/${mockProduct.id}` &&
        request.method === 'DELETE'
    );

    req.flush({
      success: true
    });


    expect(service.items().length).toBe(0);
    expect(service.itemCount()).toBe(0);
    expect(service.subtotal()).toBe(0);

  });


  // ==========================================
  // VACIAR CARRITO
  // ==========================================

  it('vacía el carrito', () => {

    service.addItem(mockProduct, 3);

    let req = httpMock.expectOne(
      request =>
        request.url === `${environment.apiUrl}/cart/items` &&
        request.method === 'POST'
    );

    req.flush({
      success: true
    });


    service.clear();

    req = httpMock.expectOne(
      request =>
        request.url === `${environment.apiUrl}/cart` &&
        request.method === 'DELETE'
    );

    req.flush({
      success: true
    });


    expect(service.items()).toEqual([]);
    expect(service.itemCount()).toBe(0);
    expect(service.subtotal()).toBe(0);

  });

});