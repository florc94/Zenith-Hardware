import {
  Component,
  OnInit,
  inject,
  signal,
  LOCALE_ID
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import {
  Product
} from '../../../catalog/models/product.model';

import {
  ProductService
} from '../../../catalog/services/product.service';

import {
  UsdPipe
} from '../../../../shared/pipes/usd.pipe';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    RouterLink,
    UsdPipe
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent implements OnInit {

  private readonly productService =
    inject(ProductService);

  private readonly locale =
    inject(LOCALE_ID);

  readonly products =
    signal<Product[]>([]);

  readonly categories =
    signal<string[]>([]);

  readonly totalProducts =
    signal(0);

  /**
   * Determina si la aplicación
   * está mostrando la versión en inglés.
   */
  get isEnglish(): boolean {
    return this.locale.startsWith('en');
  }

  /**
   * Ruta base para el detalle
   * de los productos.
   *
   * Español:
   * /catalogo/:id
   *
   * Inglés:
   * /catalog/:id
   */
  get productRoute(): string {
    return this.isEnglish
      ? '/catalog'
      : '/catalogo';
  }

  /**
   * Ruta del catálogo según el idioma.
   */
  get catalogRoute(): string {
    return this.isEnglish
      ? '/catalog'
      : '/catalogo';
  }

  ngOnInit(): void {

    // =========================================================
    // CATEGORÍAS
    // =========================================================

    this.productService
      .getCategories()
      .subscribe({
        next: (categories) => {
          this.categories.set(categories);
        },

        error: (error) => {
          console.error(
            'Error al cargar categorías del Home:',
            error
          );
        }
      });

    // =========================================================
    // PRODUCTOS DESTACADOS
    // =========================================================

    this.productService
      .getAll({
        page: 1,
        pageSize: 4
      })
      .subscribe({
        next: (result) => {

          this.products.set(
            result.items
          );

          this.totalProducts.set(
            result.total
          );
        },

        error: (error) => {
          console.error(
            'Error al cargar productos del Home:',
            error
          );
        }
      });
  }
}