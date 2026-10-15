import { CommonModule } from '@angular/common';

import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  RouterLink,
  ActivatedRoute,
  Router
} from '@angular/router';

import { ProductService } from '../../services/product.service';

import { CompareService } from '../../services/compare.service';

import { CartService } from '../../../cart/services/cart.service';

import { FavoriteService } from '../../../favorites/services/favorite.service';

import { Product } from '../../models/product.model';

import { UsdPipe } from '../../../../shared/pipes/usd.pipe';


@Component({
  selector: 'app-product-list',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    UsdPipe
  ],

  templateUrl: './product-list.component.html',

  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {

  // =====================================================
  // PRODUCTOS
  // =====================================================

  readonly products = signal<Product[]>([]);

  readonly total = signal(0);

  readonly categories = signal<string[]>([]);


  // =====================================================
  // FAVORITOS
  // =====================================================

  readonly favoriteIds = signal<Set<number>>(new Set());


  // =====================================================
  // FILTROS
  // =====================================================

  /*
   * Texto buscado. Viene de la URL (?search=...)
   * y se escribe desde el buscador del navbar.
   */

  search = '';

  selectedCategory = '';

  sortBy:
    '' |
    'price-asc' |
    'price-desc' |
    'name' = '';


  // =====================================================
  // PAGINACIÓN
  // =====================================================

  page = 1;

  pageSize = 9;

  totalPages = 1;


  // =====================================================
  // ESTADO
  // =====================================================

  loading = false;

  error = '';


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private readonly productService: ProductService,

    private readonly cartService: CartService,

    private readonly favoriteService: FavoriteService,

    private readonly route: ActivatedRoute,

    private readonly router: Router,

    /** Público: el template consulta compare.isSelected(...) */
    public readonly compare: CompareService
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    // -----------------------------------------------------
    // Cargar favoritos
    // -----------------------------------------------------

    this.loadFavorites();


    // -----------------------------------------------------
    // Cargar categorías
    // -----------------------------------------------------

    this.productService
      .getCategories()
      .subscribe({

        next: (categories) => {
          this.categories.set(categories);
        },

        error: (error) => {
          console.error('❌ Error al cargar categorías:', error);
          this.categories.set([]);
        }

      });


    // -----------------------------------------------------
    // Query params
    // -----------------------------------------------------

    this.route.queryParams.subscribe(params => {

      const category =
        params['category'] ??
        params['categoria'] ??
        '';

      const search = params['search'] ?? '';

      this.selectedCategory = category;

      this.search = search;

      this.page = 1;

      this.loadProducts();

    });

  }


  // =====================================================
  // FAVORITOS
  // =====================================================

  loadFavorites(): void {

    this.favoriteService
      .getAll()
      .subscribe({

        next: (favorites) => {

          const ids = new Set<number>();

          for (const favorite of favorites) {

            /*
             * El backend puede devolver productId o id
             * como identificador del producto.
             */

            const productId =
              favorite.productId ??
              favorite.id;

            if (productId) {
              ids.add(productId);
            }

          }

          this.favoriteIds.set(ids);

        },

        error: (error) => {

          /*
           * Si el usuario no está logueado el backend
           * devuelve 401. El catálogo sigue funcionando.
           */

          console.warn(
            'ℹ️ No se pudieron cargar los favoritos:',
            error
          );

          this.favoriteIds.set(new Set());

        }

      });

  }

  isFavorite(productId: number): boolean {

    return this.favoriteIds().has(productId);

  }

  toggleFavorite(
    productId: number,
    event: Event
  ): void {

    /*
     * Evita que el click del corazón
     * abra el detalle del producto.
     */

    event.preventDefault();

    event.stopPropagation();


    const currentlyFavorite = this.isFavorite(productId);


    this.favoriteService
      .toggle(productId, currentlyFavorite)
      .subscribe({

        next: () => {

          this.favoriteIds.update(ids => {

            const updated = new Set(ids);

            if (currentlyFavorite) {
              updated.delete(productId);
            } else {
              updated.add(productId);
            }

            return updated;

          });

        },

        error: (error) => {

          console.error(
            '❌ Error actualizando favorito:',
            error
          );

        }

      });

  }


  // =====================================================
  // COMPARADOR
  // =====================================================

  toggleCompare(
    product: Product,
    event: Event
  ): void {

    event.preventDefault();

    event.stopPropagation();

    this.compare.toggle(product);

  }


  // =====================================================
  // CATEGORÍAS
  // =====================================================

  selectCategory(category: string): void {

    this.selectedCategory =
      this.selectedCategory === category
        ? ''
        : category;

    this.page = 1;

    this.loadProducts();

  }


  // =====================================================
  // PRODUCTOS
  // =====================================================

  loadProducts(): void {

    this.loading = true;

    this.error = '';


    this.productService
      .getAll({

        page: this.page,

        pageSize: this.pageSize,

        search: this.search,

        category: this.selectedCategory,

        sortBy: this.sortBy || undefined

      })
      .subscribe({

        next: (result) => {

          this.products.set(result.items);

          this.total.set(result.total);

          this.totalPages =
            Math.max(1, Math.ceil(result.total / this.pageSize));

          this.loading = false;

        },

        error: (error) => {

          console.error(
            '❌ Error al cargar productos:',
            error
          );

          this.products.set([]);

          this.total.set(0);

          this.totalPages = 1;

          this.error = 'No se pudieron cargar los productos.';

          this.loading = false;

        }

      });

  }


  // =====================================================
  // FILTROS
  // =====================================================

  onFilterChange(): void {

    this.page = 1;

    this.loadProducts();

  }


  // =====================================================
  // BÚSQUEDA
  // =====================================================

  /*
   * Quita la búsqueda activa. Se saca "search" de la URL;
   * al cambiar los query params, ngOnInit vuelve a
   * cargar los productos sin ese filtro.
   * (la categoría seleccionada se mantiene)
   */

  clearSearch(): void {

    this.router.navigate(
      [],
      {
        relativeTo: this.route,

        queryParams: {
          search: null
        },

        queryParamsHandling: 'merge'
      }
    );

  }


  // =====================================================
  // PAGINACIÓN
  // =====================================================

  goToPage(page: number): void {

    if (
      page < 1 ||
      page > this.totalPages ||
      page === this.page
    ) {
      return;
    }

    this.page = page;

    this.loadProducts();

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  }

  /*
   * Páginas visibles en el paginador.
   * null = puntos suspensivos (…)
   */
  get visiblePages(): (number | null)[] {

    const total = this.totalPages;
    const current = this.page;

    // Pocas páginas: se muestran todas
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    // Cerca del inicio: 1 2 3 4 5 … 62
    if (current <= 4) {
      return [1, 2, 3, 4, 5, null, total];
    }

    // Cerca del final: 1 … 58 59 60 61 62
    if (current >= total - 3) {
      return [1, null, total - 4, total - 3, total - 2, total - 1, total];
    }

    // En el medio: 1 … 9 10 11 … 62
    return [1, null, current - 1, current, current + 1, null, total];

  }


  // =====================================================
  // RUTA DEL CATÁLOGO
  // =====================================================

  getCatalogRoute(): string {

    return window.location.pathname.startsWith('/en')
      ? '/en/catalog'
      : '/catalogo';

  }


  // =====================================================
  // AGREGAR AL CARRITO
  // =====================================================

  addToCart(
    product: Product,
    event?: Event
  ): void {

    event?.stopPropagation();

    event?.preventDefault();

    if (product.stock <= 0) {
      return;
    }

    this.cartService.addItem(product);

  }

}