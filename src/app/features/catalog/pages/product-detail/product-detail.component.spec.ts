import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { ProductDetailComponent } from './product-detail.component';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../../cart/services/cart.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Product } from '../../models/product.model';

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent;
  let fixture: ComponentFixture<ProductDetailComponent>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;
  let cartServiceSpy: jasmine.SpyObj<CartService>;
  let notifySpy: jasmine.SpyObj<NotificationService>;

  const mockProduct: Product = {
    id: 1,
    name: 'Zapatillas urbanas',
    description: 'Cómodas y livianas',
    price: 50,
    category: 'Calzado',
    imageUrl: 'https://example.com/img.jpg',
    stock: 3,
    rating: 4.5
  };

  // Helper para armar el TestBed con un ActivatedRoute y una respuesta de getById distintos por test
  function setup(paramId: string, getByIdResponse: Observable<Product>) {
    productServiceSpy = jasmine.createSpyObj('ProductService', ['getById']);
    cartServiceSpy = jasmine.createSpyObj('CartService', ['addItem']);
    notifySpy = jasmine.createSpyObj('NotificationService', ['success']);

    productServiceSpy.getById.and.returnValue(getByIdResponse);

    TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        { provide: ProductService, useValue: productServiceSpy },
        { provide: CartService, useValue: cartServiceSpy },
        { provide: NotificationService, useValue: notifySpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => paramId } }
          }
        }
      ]
    });

    fixture = TestBed.createComponent(ProductDetailComponent);
    component = fixture.componentInstance;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('se crea', () => {
    setup('1', of(mockProduct));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('carga el producto por el id de la ruta y saca el loading', () => {
    setup('1', of(mockProduct));
    fixture.detectChanges(); // dispara ngOnInit

    expect(productServiceSpy.getById).toHaveBeenCalledWith(1);
    expect(component.product()).toEqual(mockProduct);
    expect(component.loading()).toBe(false);
    expect(component.notFound()).toBe(false);
  });

  it('si el servicio falla, marca notFound y apaga el loading', () => {
    setup('999', throwError(() => new Error('404')));
    fixture.detectChanges();

    expect(component.notFound()).toBe(true);
    expect(component.loading()).toBe(false);
    expect(component.product()).toBeNull();
  });

  it('incrementQty no supera el stock disponible', () => {
    setup('1', of(mockProduct)); // stock: 3
    fixture.detectChanges();

    component.incrementQty(); // 2
    component.incrementQty(); // 3
    component.incrementQty(); // intenta 4, debería quedarse en 3

    expect(component.quantity()).toBe(3);
  });

  it('decrementQty no baja de 1', () => {
    setup('1', of(mockProduct));
    fixture.detectChanges();

    component.decrementQty(); // ya está en 1, no debería bajar de eso
    expect(component.quantity()).toBe(1);
  });

  it('addToCart agrega la cantidad seleccionada y notifica', () => {
    setup('1', of(mockProduct));
    fixture.detectChanges();

    component.incrementQty(); // quantity = 2
    component.addToCart();

    expect(cartServiceSpy.addItem).toHaveBeenCalledWith(mockProduct, 2);
    expect(notifySpy.success).toHaveBeenCalledWith('2 × Zapatillas urbanas agregado al carrito');
  });

});