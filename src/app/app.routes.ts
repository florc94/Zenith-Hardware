
import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { customerGuard } from './core/guards/customer.guard';

const isEnglish =
  window.location.pathname === '/en' ||
  window.location.pathname.startsWith('/en/');

export const routes: Routes = isEnglish
  ? [
      // =========================================================
      // ENGLISH
      // =========================================================

      // HOME
      {
        path: '',
        loadComponent: () =>
          import(
            './features/home/pages/home-page/home-page.component'
          ).then(m => m.HomePageComponent)
      },

      // CATALOG
      {
        path: 'catalog',
        loadComponent: () =>
          import(
            './features/catalog/pages/product-list/product-list.component'
          ).then(m => m.ProductListComponent)
      },
      {
        path: 'catalog/:id',
        loadComponent: () =>
          import(
            './features/catalog/pages/product-detail/product-detail.component'
          ).then(m => m.ProductDetailComponent)
      },

      // COMPARE
      {
        path: 'compare',
        loadComponent: () =>
          import(
            './features/catalog/pages/compare/compare-page.component'
          ).then(m => m.ComparePageComponent)
      },

      // CART
      {
        path: 'cart',
        canActivate: [customerGuard],
        loadComponent: () =>
          import(
            './features/cart/pages/cart-page/cart-page.component'
          ).then(m => m.CartPageComponent)
      },

      // CHECKOUT
      {
        path: 'checkout',
        canActivate: [customerGuard],
        loadComponent: () =>
          import(
            './features/checkout/pages/checkout-page/checkout-page.component'
          ).then(m => m.CheckoutPageComponent)
      },

      // LOGIN
      {
        path: 'login',
        loadComponent: () =>
          import(
            './features/auth/pages/login/login.component'
          ).then(m => m.LoginComponent)
      },

      // REGISTER
      {
        path: 'register',
        loadComponent: () =>
          import(
            './features/auth/pages/register/register.component'
          ).then(m => m.RegisterComponent)
      },

      // EMAIL VERIFICATION
      {
        path: 'verify-email',
        loadComponent: () =>
          import(
            './features/auth/pages/verify-email/verify-email.component'
          ).then(m => m.VerifyEmailComponent)
      },

      // ACCOUNT
      {
        path: 'account',
        canActivate: [authGuard, customerGuard],
        loadComponent: () =>
          import(
            './features/account/pages/account/account.component'
          ).then(m => m.AccountComponent)
      },

      // ORDERS
      {
        path: 'orders',
        canActivate: [authGuard, customerGuard],
        loadChildren: () =>
          import(
            './features/orders/orders.routes'
          )
      },

      // FAVORITES
      {
        path: 'favorites',
        canActivate: [authGuard, customerGuard],
        loadComponent: () =>
          import(
            './features/favorites/pages/favorites/favorites.component'
          ).then(m => m.FavoritesComponent)
      },

      // ADMIN
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadChildren: () =>
          import(
            './features/admin/admin.routes'
          ).then(m => m.adminRoutes)
      },

      // HELP
      {
        path: 'branches',
        loadComponent: () =>
          import(
            './features/home/pages/sucursales-page/sucursales-page.component'
          ).then(m => m.SucursalesPageComponent)
      },
      {
        path: 'returns',
        loadComponent: () =>
          import(
            './features/home/pages/devoluciones-page/devoluciones-page.component'
          ).then(m => m.DevolucionesPageComponent)
      },
      {
        path: 'faq',
        loadComponent: () =>
          import(
            './features/home/pages/faq-page/faq-page.component'
          ).then(m => m.FaqPageComponent)
      },
      {
        path: 'terms',
        loadComponent: () =>
          import(
            './features/home/pages/terminos-page/terminos-page.component'
          ).then(m => m.TerminosPageComponent)
      },
      {
        path: 'shipping',
        loadComponent: () =>
          import(
            './features/home/pages/envios-page/envios-page.component'
          ).then(m => m.EnviosPageComponent)
      },

      // CATCH-ALL
      {
        path: '**',
        redirectTo: ''
      }
    ]
  : [
      // =========================================================
      // ESPAÑOL
      // =========================================================

      // HOME
      {
        path: '',
        loadComponent: () =>
          import(
            './features/home/pages/home-page/home-page.component'
          ).then(m => m.HomePageComponent)
      },

      // CATÁLOGO
      {
        path: 'catalogo',
        loadComponent: () =>
          import(
            './features/catalog/pages/product-list/product-list.component'
          ).then(m => m.ProductListComponent)
      },
      {
        path: 'catalogo/:id',
        loadComponent: () =>
          import(
            './features/catalog/pages/product-detail/product-detail.component'
          ).then(m => m.ProductDetailComponent)
      },

      // COMPARADOR
      {
        path: 'comparar',
        loadComponent: () =>
          import(
            './features/catalog/pages/compare/compare-page.component'
          ).then(m => m.ComparePageComponent)
      },

      // CARRITO
      {
        path: 'carrito',
        canActivate: [customerGuard],
        loadComponent: () =>
          import(
            './features/cart/pages/cart-page/cart-page.component'
          ).then(m => m.CartPageComponent)
      },

      // CHECKOUT
      {
        path: 'checkout',
        canActivate: [customerGuard],
        loadComponent: () =>
          import(
            './features/checkout/pages/checkout-page/checkout-page.component'
          ).then(m => m.CheckoutPageComponent)
      },

      // LOGIN
      {
        path: 'login',
        loadComponent: () =>
          import(
            './features/auth/pages/login/login.component'
          ).then(m => m.LoginComponent)
      },

      // REGISTRO
      {
        path: 'registro',
        loadComponent: () =>
          import(
            './features/auth/pages/register/register.component'
          ).then(m => m.RegisterComponent)
      },

      // EMAIL VERIFICATION
      // Debe coincidir con el enlace generado por el backend.
      {
        path: 'verify-email',
        loadComponent: () =>
          import(
            './features/auth/pages/verify-email/verify-email.component'
          ).then(m => m.VerifyEmailComponent)
      },

      // MI CUENTA
      {
        path: 'cuenta',
        canActivate: [authGuard, customerGuard],
        loadComponent: () =>
          import(
            './features/account/pages/account/account.component'
          ).then(m => m.AccountComponent)
      },

      // PEDIDOS
      {
        path: 'pedidos',
        canActivate: [authGuard, customerGuard],
        loadChildren: () =>
          import(
            './features/orders/orders.routes'
          )
      },

      // FAVORITOS
      {
        path: 'favoritos',
        canActivate: [authGuard, customerGuard],
        loadComponent: () =>
          import(
            './features/favorites/pages/favorites/favorites.component'
          ).then(m => m.FavoritesComponent)
      },

      // ADMIN
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadChildren: () =>
          import(
            './features/admin/admin.routes'
          ).then(m => m.adminRoutes)
      },

      // AYUDA
      {
        path: 'sucursales',
        loadComponent: () =>
          import(
            './features/home/pages/sucursales-page/sucursales-page.component'
          ).then(m => m.SucursalesPageComponent)
      },
      {
        path: 'devoluciones',
        loadComponent: () =>
          import(
            './features/home/pages/devoluciones-page/devoluciones-page.component'
          ).then(m => m.DevolucionesPageComponent)
      },
      {
        path: 'faq',
        loadComponent: () =>
          import(
            './features/home/pages/faq-page/faq-page.component'
          ).then(m => m.FaqPageComponent)
      },
      {
        path: 'terminos',
        loadComponent: () =>
          import(
            './features/home/pages/terminos-page/terminos-page.component'
          ).then(m => m.TerminosPageComponent)
      },
      {
        path: 'envios',
        loadComponent: () =>
          import(
            './features/home/pages/envios-page/envios-page.component'
          ).then(m => m.EnviosPageComponent)
      },

      // CATCH-ALL
      {
        path: '**',
        redirectTo: ''
      }
    ];
