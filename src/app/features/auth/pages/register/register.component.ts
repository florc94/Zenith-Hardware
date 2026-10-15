
import { CommonModule } from '@angular/common';

import {
  Component,
  inject
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  submitting = false;
  registrationCompleted = false;
  registeredEmail = '';

  form = this.fb.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(2)
      ]
    ],

    email: [
      '',
      [
        Validators.required,
        Validators.email
      ]
    ],

    password: [
      '',
      [
        Validators.required,
        Validators.minLength(6)
      ]
    ],

    confirmPassword: [
      '',
      [
        Validators.required
      ]
    ]
  });

  get f() {
    return this.form.controls;
  }

  /**
   * Indica si la aplicación está en inglés.
   * Es público porque también se utiliza desde el HTML.
   */
  isEnglishRoute(): boolean {
    return window.location.pathname === '/en' ||
      window.location.pathname.startsWith('/en/');
  }

  /**
   * Envía el formulario de registro.
   * El usuario todavía no inicia sesión:
   * primero debe verificar su correo.
   */
  submit(): void {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const {
      name,
      email,
      password,
      confirmPassword
    } = this.form.getRawValue();

    if (password !== confirmPassword) {
      this.notify.error(
        'Las contraseñas no coinciden.'
      );

      return;
    }

    this.submitting = true;

    this.auth.register({
      name: name!.trim(),
      email: email!.trim().toLowerCase(),
      password: password!
    }).subscribe({

      next: (response) => {
        this.submitting = false;
        this.registrationCompleted = true;
        this.registeredEmail = response.email;

        this.notify.success(
          'Cuenta creada. Revisá tu correo para verificarla.'
        );

        // No iniciamos sesión ni sincronizamos el carrito
        // hasta que el usuario verifique su correo.
      },

      error: (error) => {
        this.submitting = false;

        console.error(
          'Error en el registro:',
          error
        );

        const message =
          error?.error?.error ||
          'No se pudo crear la cuenta. Intentá nuevamente.';

        this.notify.error(message);
      }
    });
  }

  /**
   * Navega al inicio de sesión.
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Navega al catálogo según el idioma actual.
   */
  goToCatalog(): void {
    this.router.navigate([
      this.isEnglishRoute() ? '/catalog' : '/catalogo'
    ]);
  }
}
