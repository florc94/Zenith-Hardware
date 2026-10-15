import { CommonModule } from '@angular/common';

import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import {
  FavoriteService
} from '../../services/favorite.service';

import {
  Favorite
} from '../../models/favorite.model';

import {
  UsdPipe
} from '../../../../shared/pipes/usd.pipe';


@Component({
  selector: 'app-favorites',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink,
    UsdPipe
  ],

  templateUrl: './favorites.component.html',

  styleUrl: './favorites.component.scss'
})
export class FavoritesComponent implements OnInit {


  // =====================================================
  // FAVORITOS
  // =====================================================

  readonly favorites =
    signal<Favorite[]>([]);


  // =====================================================
  // ESTADO
  // =====================================================

  loading = false;

  error = '';


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private readonly favoriteService: FavoriteService
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.loadFavorites();

  }


  // =====================================================
  // CARGAR FAVORITOS
  // =====================================================

  loadFavorites(): void {

    this.loading = true;

    this.error = '';

    this.favoriteService
      .getAll()
      .subscribe({

        next: (favorites) => {

          this.favorites.set(
            favorites
          );

          this.loading = false;

        },

        error: (error) => {

          console.error(
            '❌ Error al cargar favoritos:',
            error
          );

          this.favorites.set([]);

          this.error =
            'No se pudieron cargar tus favoritos.';

          this.loading = false;

        }

      });

  }


  // =====================================================
  // ELIMINAR FAVORITO
  // =====================================================

  removeFavorite(
    productId: number,
    event?: Event
  ): void {

    event?.preventDefault();

    event?.stopPropagation();

    this.favoriteService
      .remove(productId)
      .subscribe({

        next: () => {

          this.favorites.update(
            favorites =>
              favorites.filter(
                product =>
                  product.id !== productId
              )
          );

        },

        error: (error) => {

          console.error(
            '❌ Error eliminando favorito:',
            error
          );

        }

      });

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
  // RUTA DEL LOGIN
  // =====================================================

  getLoginRoute(): string {

    return window.location.pathname.startsWith('/en')
      ? '/en/login'
      : '/login';

  }

}