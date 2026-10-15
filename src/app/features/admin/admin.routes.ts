import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-shell.component').then(
        (m) => m.AdminShellComponent
      ),

    children: [
      {
        path: '',
        redirectTo: 'products',
        pathMatch: 'full'
      },

      {
        path: 'products',
        loadComponent: () =>
          import('./products/pages/product-list/product-list.component').then(
            (m) => m.AdminProductListComponent
          )
      },

      {
        path: 'products/new',
        loadComponent: () =>
          import('./products/pages/product-form/product-form.component').then(
            (m) => m.AdminProductFormComponent
          )
      },

      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('./products/pages/product-form/product-form.component').then(
            (m) => m.AdminProductFormComponent
          )
      },

      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./orders/pages/order-detail/order-detail.component').then(
            (m) => m.AdminOrderDetailComponent
          )
      },

      {
        path: 'orders',
        loadComponent: () =>
          import('./orders/pages/order-board/order-board.component').then(
            (m) => m.AdminOrderBoardComponent
          )
      },

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/pages/dashboard/dashboard.component').then(
            (m) => m.AdminDashboardComponent
          )
      },

      {
        path: 'users/:id',
        loadComponent: () =>
          import('./users/pages/user-detail/user-detail.component').then(
            (m) => m.AdminUserDetailComponent
          )
      },

      {
        path: 'users',
        loadComponent: () =>
          import('./users/pages/user-list/user-list.component').then(
            (m) => m.AdminUserListComponent
          )
      }
    ]
  }
];