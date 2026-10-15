import { Routes } from '@angular/router';
import { OrderHistoryComponent } from './pages/order-history/order-history.component';
import { OrderDetailComponent } from './pages/order-detail/order-detail.component';

export default [
  { path: '', component: OrderHistoryComponent },
  { path: ':id', component: OrderDetailComponent }
] as Routes;