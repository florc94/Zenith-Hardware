import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CartService } from '../../../cart/services/cart.service';
import { peekPendingFavorite } from '../../../../utils/pending-favorite';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cart = inject(CartService);

  submitting = false;

  private readonly isEnglish =
    window.location.pathname === '/en' ||
    window.location.pathname.startsWith('/en/');

  private readonly accountRoute =
    this.isEnglish ? '/account' : '/cuenta';

  form = this.fb.group({
    email: [
      'admin@shopsphere.com',
      [
        Validators.required,
        Validators.email
      ]
    ],
    password: [
      'admin123',
      [
        Validators.required,
        Validators.minLength(4)
      ]
    ]
  });

  get f() {
    return this.form.controls;
  }

  submit(): void {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const {
      email,
      password
    } = this.form.getRawValue();


    this.auth.login({
      email: email!,
      password: password!
    }).subscribe({

      next: (user) => {

        /*
         * Sincronizamos el carrito que el usuario
         * tenía como invitado con su cuenta.
         */
        this.cart.syncGuestCart();


        this.notify.success(
          '¡Bienvenido de nuevo!'
        );


        const returnUrl =
          this.route.snapshot.queryParamMap.get(
            'returnUrl'
          );


        /*
         * 0) Si es un cliente y le faltan código de área,
         *    teléfono o DNI/CUIL, lo llevamos a Mi Cuenta
         *    para que los complete. Conservamos el returnUrl
         *    para poder volver después (por ejemplo, al checkout).
         */
        if (
          user.role !== 'admin' &&
          !user.profileComplete
        ) {

          this.router.navigate(
            [this.accountRoute],
            returnUrl
              ? { queryParams: { returnUrl } }
              : {}
          );

          return;
        }


        /*
         * 1) Si venimos desde "Ir a pagar",
         *    volvemos al checkout.
         */
        if (returnUrl) {

          this.router.navigateByUrl(
            returnUrl
          );

          return;
        }


        /*
         * 2) Si venimos de tocar un corazón sin sesión,
         *    volvemos a esa página. El producto se agrega
         *    a favoritos al cargar (catálogo o detalle).
         */
        const pendingFavorite =
          peekPendingFavorite();


        if (pendingFavorite) {

          this.router.navigateByUrl(
            pendingFavorite.returnUrl
          );

          return;
        }


        /*
         * 3) Si no hay nada pendiente, mantenemos
         *    el comportamiento original.
         */

        if (
          email?.trim().toLowerCase() ===
          'admin@shopsphere.com'
        ) {

          this.router.navigate([
            '/admin/orders'
          ]);

        } else {

          this.router.navigate([
            '/catalogo'
          ]);

        }

      },

      error: () => {

        this.submitting = false;

      }

    });

  }

}