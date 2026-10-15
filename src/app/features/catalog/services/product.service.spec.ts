import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController
} from '@angular/common/http/testing';

import { ProductService } from './product.service';
import { environment } from '../../../../environments/environment';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  const base = `${environment.apiUrl}/products`;

  const mockRawProducts = [
    {
      id: 1,
      name: 'Zapatillas',
      price: 50,
      category: 'Calzado'
    },
    {
      id: 2,
      name: 'Remera',
      price: 20,
      category: 'Ropa'
    }
  ] as any[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProductService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getAll transforma el array crudo en PagedResult', () => {
    service.getAll().subscribe((result) => {
      expect(result.items.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
    });

    const req = httpMock.expectOne(
      request =>
        request.url === base &&
        request.params.get('lang') === 'en'
    );

    expect(req.request.method).toBe('GET');

    req.flush(mockRawProducts);
  });

  it('getCategories devuelve categorías únicas', () => {
    service.getCategories().subscribe((categories) => {
      expect(categories).toEqual(['Calzado', 'Ropa']);
    });

    const req = httpMock.expectOne(
      request =>
        request.url === base &&
        request.params.get('lang') === 'en'
    );

    expect(req.request.method).toBe('GET');

    req.flush(mockRawProducts);
  });
});