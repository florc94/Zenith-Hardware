import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { SpinnerComponent } from './shared/components/spinner/spinner.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { CompareBarComponent } from './shared/components/compare-bar/compare-bar.component';

import { CartService } from './features/cart/services/cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    SpinnerComponent,
    ToastComponent,
    CompareBarComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  isAdminRoute: boolean = false;

  /** En la página del comparador la barra flotante no hace falta */
  isCompareRoute: boolean = false;

  constructor(
    private router: Router,
    public readonly cartService: CartService
  ) {
    // Detecta automáticamente si la URL actual contiene 'admin'
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isAdminRoute = event.url.includes('admin');
      this.isCompareRoute = /^\/(comparar|compare)(\/|\?|$)/.test(event.url);
    });
  }
}