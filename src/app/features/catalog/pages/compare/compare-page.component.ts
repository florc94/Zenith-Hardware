import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { UsdPipe } from '../../../../shared/pipes/usd.pipe';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CompareService } from '../../services/compare.service';
import { CartService } from '../../../cart/services/cart.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { appRoutes, getCurrentLanguage } from '../../../../utils/routes';

@Component({
  selector: 'app-compare-page',
  standalone: true,
  imports: [CommonModule, UsdPipe],
  templateUrl: './compare-page.component.html',
  styleUrl: './compare-page.component.scss'
})
export class ComparePageComponent implements OnInit {

  readonly products = signal<Product[]>([]);

  readonly loading = signal(true);

  private readonly language = getCurrentLanguage();

  readonly catalogUrl = appRoutes[this.language].catalog;


  // =====================================================
  // DATOS DERIVADOS
  // =====================================================

  /** Precio más bajo (solo si hay 2 o más productos para comparar) */
  readonly lowestPrice = computed(() => {

    const list = this.products();

    return list.length > 1
      ? Math.min(...list.map(product => product.price))
      : null;

  });

  /** Todas las claves de specs que aparecen en algún producto */
  readonly specKeys = computed(() => {

    const keys: string[] = [];

    for (const product of this.products()) {
      for (const key of Object.keys(product.specs ?? {})) {
        if (!keys.includes(key)) {
          keys.push(key);
        }
      }
    }

    return keys;

  });


  constructor(
    private readonly productService: ProductService,
    public readonly compare: CompareService,
    private readonly cartService: CartService,
    private readonly notify: NotificationService
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.load();
  }

  private load(): void {

    const ids = this.compare.items().map(item => item.id);

    if (ids.length === 0) {
      this.products.set([]);
      this.loading.set(false);
      return;
    }

    // Pedimos cada producto completo (precio y stock actualizados).
    // Si alguno ya no existe, lo ignoramos y lo sacamos de la lista.
    forkJoin(
      ids.map(id =>
        this.productService.getById(id).pipe(
          catchError(() => of(null))
        )
      )
    ).subscribe(results => {

      const found = results.filter(
        (product): product is Product => product !== null
      );

      const foundIds = new Set(found.map(product => product.id));

      for (const id of ids) {
        if (!foundIds.has(id)) {
          this.compare.remove(id);
        }
      }

      this.products.set(found);
      this.loading.set(false);

    });

  }


  // =====================================================
  // HELPERS DE LA TABLA
  // =====================================================

  productUrl(id: number): string {
    return `${this.catalogUrl}/${id}`;
  }

  spec(product: Product, key: string): string {
    return product.specs?.[key] ?? '—';
  }


  // =====================================================
  // ACCIONES
  // =====================================================

  remove(id: number): void {

    this.compare.remove(id);

    this.products.update(list =>
      list.filter(product => product.id !== id)
    );

  }

  clear(): void {

    this.compare.clear();

    this.products.set([]);

  }

  addToCart(product: Product): void {

    if (product.stock <= 0) {
      return;
    }

    this.cartService.addItem(product, 1);

    this.notify.success(`${product.name} agregado al carrito`);

  }

}