import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { ProductListComponent } from './product-list.component';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../../cart/services/cart.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Product } from '../../models/product.model';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;
  let cartServiceSpy: jasmine.SpyObj<CartService>;
  let notifySpy: jasmine.SpyObj<NotificationService>;
  let queryParamsSubject: Subject<any>;

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

  const mockPagedResult = {
    items: [mockProduct],
    total: 1,
    page: 1,
    pageSize: 9
  };

  beforeEach(async () => {
    productServiceSpy = jasmine.createSpyObj('ProductService', ['getAll', 'getCategories']);
    cartServiceSpy = jasmine.createSpyObj('CartService', ['addItem']);
    notifySpy = jasmine.createSpyObj('NotificationService', ['success']);
    queryParamsSubject = new Subject();

    productServiceSpy.getAll.and.returnValue(of(mockPagedResult));
    productServiceSpy.getCategories.and.returnValue(of(['Calzado', 'Ropa']));

    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        { provide: ProductService, useValue: productServiceSpy },
        { provide: CartService, useValue: cartServiceSpy },
        { provide: NotificationService, useValue: notifySpy },
        { provide: ActivatedRoute, useValue: { queryParams: queryParamsSubject.asObservable() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
  });

  it('se crea', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit carga categorías y productos al recibir queryParams', () => {
    fixture.detectChanges(); // dispara ngOnInit
    queryParamsSubject.next({});

    expect(productServiceSpy.getCategories).toHaveBeenCalled();
    expect(component.categories()).toEqual(['Calzado', 'Ropa']);
    expect(productServiceSpy.getAll).toHaveBeenCalled();
    expect(component.products()).toEqual([mockProduct]);
    expect(component.total()).toBe(1);
  });

  it('toma la categoría desde queryParams', () => {
    fixture.detectChanges();
    queryParamsSubject.next({ categoria: 'Ropa' });

    expect(component.selectedCategory).toBe('Ropa');
    expect(component.page()).toBe(1);
    expect(productServiceSpy.getAll).toHaveBeenCalledWith(
      jasmine.objectContaining({ category: 'Ropa' })
    );
  });

  it('addToCart agrega el producto, notifica y detiene el evento', () => {
    fixture.detectChanges();
    queryParamsSubject.next({});

    const eventSpy = jasmine.createSpyObj('Event', ['stopPropagation', 'preventDefault']);
    component.addToCart(mockProduct, eventSpy);

    expect(cartServiceSpy.addItem).toHaveBeenCalledWith(mockProduct, 1);
    expect(notifySpy.success).toHaveBeenCalledWith('Zapatillas urbanas agregado al carrito');
    expect(eventSpy.stopPropagation).toHaveBeenCalled();
    expect(eventSpy.preventDefault).toHaveBeenCalled();
  });

  it('goToPage actualiza la página y vuelve a pedir productos', () => {
    fixture.detectChanges();
    queryParamsSubject.next({});
    productServiceSpy.getAll.calls.reset();

    component.goToPage(2);

    expect(component.page()).toBe(2);
    expect(productServiceSpy.getAll).toHaveBeenCalledWith(
      jasmine.objectContaining({ page: 2 })
    );
  });

  it('onSearchInput espera el debounce antes de recargar productos', fakeAsync(() => {
    fixture.detectChanges();
    queryParamsSubject.next({});
    productServiceSpy.getAll.calls.reset();

    component.onSearchInput('zapa');
    expect(productServiceSpy.getAll).not.toHaveBeenCalled(); // todavía no pasaron los 350ms

    tick(350);

    expect(productServiceSpy.getAll).toHaveBeenCalledWith(
      jasmine.objectContaining({ search: 'zapa' })
    );
  }));
});