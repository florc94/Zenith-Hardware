import { CommonModule } from '@angular/common';
import { UsdPipe } from '../../../../shared/pipes/usd.pipe';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../../cart/services/cart.service';
import { OrderService } from '../../../orders/services/order.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, UsdPipe],
  templateUrl: './checkout-page.component.html',
  styleUrl: './checkout-page.component.scss'
})
export class CheckoutPageComponent {
  private fb = inject(FormBuilder);
  private orderService = inject(OrderService);
  private auth = inject(AuthService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  // público: el template lo usa para mostrar el resumen del carrito
  readonly cart = inject(CartService);

  // Constantes de envío
  readonly UMBRAL_ENVIO = 50;
  readonly COSTO_ENVIO_FIJO = 6.99;

  submitting = false;

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    address: ['', Validators.required],
    city: ['', Validators.required],
    cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]]
  });

  get f() {
    return this.form.controls;
  }

  // Cálculos para el resumen y la base de datos
  get subtotal(): number {
    const items = this.cart.items() || [];
    return items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  }

  get costoEnvio(): number {
    if (this.subtotal === 0) return 0;
    return this.subtotal >= this.UMBRAL_ENVIO ? 0 : this.COSTO_ENVIO_FIJO;
  }

  get totalFinal(): number {
    return this.subtotal + this.costoEnvio;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const user = this.auth.currentUser();
    if (!user) {
      this.notify.error('Necesitás iniciar sesión para completar la compra.');
      this.router.navigate(['/login']);
      return;
    }

    this.submitting = true;
    const address = `${this.form.value.address}, ${this.form.value.city}`;

    // Pasamos los 8 argumentos exactos que espera el OrderService
    this.orderService.create(
      user.name,
      user.email,
      this.cart.items(),
      address,
      this.subtotal,
      this.costoEnvio,
      this.totalFinal
    ).subscribe({
      next: (order) => {
        this.cart.clear();
        this.notify.success('¡Compra confirmada!');
        this.router.navigate(['/pedidos'], { state: { lastOrderId: order.id } });
      },
      error: () => {
        this.submitting = false;
        this.notify.error('Hubo un error al procesar el pedido. Intentá nuevamente.');
      }
    });
  }
}