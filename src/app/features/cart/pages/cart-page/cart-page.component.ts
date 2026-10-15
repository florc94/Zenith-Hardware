import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { UsdPipe } from '../../../../shared/pipes/usd.pipe';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    UsdPipe
  ],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss'
})
export class CartPageComponent {

  readonly UMBRAL_ENVIO = 50;

  readonly COSTO_ENVIO_FIJO = 6.99;


  constructor(
    public cart: CartService,
    private authService: AuthService,
    private router: Router
  ) {}


  // ==========================================
  // SUBTOTAL
  // ==========================================

  get subtotal(): number {
    return this.cart.subtotal();
  }


  // ==========================================
  // COSTO DE ENVÍO
  // ==========================================

  get costoEnvio(): number {

    if (this.subtotal === 0) {
      return 0;
    }

    return this.subtotal >= this.UMBRAL_ENVIO
      ? 0
      : this.COSTO_ENVIO_FIJO;
  }


  // ==========================================
  // TOTAL FINAL
  // ==========================================

  get totalFinal(): number {
    return this.subtotal + this.costoEnvio;
  }


  // ==========================================
  // AUMENTAR CANTIDAD
  // ==========================================

  increment(
    productId: number,
    currentQty: number
  ): void {

    const item = this.cart.items()
      .find(
        item =>
          item.product.id === productId
      );

    if (!item) {
      return;
    }


    /*
     * No permitimos superar el stock
     * real del producto.
     */

    if (
      currentQty >=
      item.product.stock
    ) {
      return;
    }


    this.cart.updateQuantity(
      productId,
      currentQty + 1
    );
  }


  // ==========================================
  // DISMINUIR CANTIDAD
  // ==========================================

  decrement(
    productId: number,
    currentQty: number
  ): void {

    if (currentQty <= 1) {

      this.cart.removeItem(
        productId
      );

      return;
    }


    this.cart.updateQuantity(
      productId,
      currentQty - 1
    );
  }


  // ==========================================
  // STOCK RESTANTE
  // ==========================================

  getStockRestante(
    stock: number,
    quantity: number
  ): number {

    return Math.max(
      stock - quantity,
      0
    );
  }


  // ==========================================
  // FINALIZAR COMPRA
  // ==========================================

  irAlCheckout(): void {

    /*
     * Si el usuario ya inició sesión,
     * puede ir directamente al checkout.
     */

    if (this.authService.isAuthenticated()) {

      this.router.navigate(['/checkout']);

      return;
    }


    /*
     * Si es invitado, primero debe iniciar sesión.
     *
     * Le pasamos returnUrl para que después
     * del login vuelva automáticamente
     * al checkout.
     */

    this.router.navigate(
      ['/login'],
      {
        queryParams: {
          returnUrl: '/checkout'
        }
      }
    );
  }

}