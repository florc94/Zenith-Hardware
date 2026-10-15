import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AccountService } from '../../../account/services/account.service';
import { CartService } from '../../../cart/services/cart.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css'
})
export class VerifyEmailComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private cart = inject(CartService);
  private fb = inject(FormBuilder);
  private accountService = inject(AccountService);
  private notify = inject(NotificationService);

  verifying = true;
  verified = false;
  errorMessage = '';

  /** Muestra la ventana flotante que pide los datos de contacto. */
  showContactModal = false;
  savingContact = false;
  contactSaved = false;
  contactError = '';

  readonly isEnglish = window.location.pathname === '/en' ||
    window.location.pathname.startsWith('/en/');

  readonly loginRoute = this.isEnglish ? '/login' : '/login';
  readonly catalogRoute = this.isEnglish ? '/catalog' : '/catalogo';
  readonly accountRoute = this.isEnglish ? '/account' : '/cuenta';

  readonly contactForm = this.fb.nonNullable.group({
    phoneArea: ['', [Validators.required, Validators.pattern(/^\d{2,5}$/)]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{5,10}$/)]],
    document: ['', [Validators.required, Validators.pattern(/^(\d{7,8}|\d{11})$/)]]
  });

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.verifying = false;
      this.errorMessage =
        'El enlace no contiene un token de verificación. Revisá el enlace del correo.';
      return;
    }

    this.auth.verifyEmail(token).subscribe({
      next: (user) => {
        this.verifying = false;
        this.verified = true;

        // Una cuenta recién verificada todavía no tiene
        // código de área, teléfono ni DNI/CUIL: los pedimos.
        this.showContactModal = !user.profileComplete;

        // Si había productos en el carrito como invitado,
        // intentamos sincronizarlos después de verificar la cuenta.
        this.cart.syncGuestCart();
      },
      error: (error) => {
        this.verifying = false;

        this.errorMessage =
          error?.error?.error ||
          'El enlace puede haber vencido o ya haber sido utilizado.';

        console.error(
          'Error al verificar el correo:',
          error
        );
      }
    });
  }

  isInvalid(controlName: 'phoneArea' | 'phone' | 'document'): boolean {
    const control = this.contactForm.controls[controlName];

    return control.invalid && (control.touched || control.dirty);
  }

  saveContact(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.savingContact = true;
    this.contactError = '';

    const { phoneArea, phone, document } =
      this.contactForm.getRawValue();

    this.accountService.updateContact({
      phoneArea: phoneArea.trim(),
      phone: phone.trim(),
      document: document.trim()
    }).subscribe({
      next: () => {
        this.savingContact = false;
        this.contactSaved = true;
        this.showContactModal = false;

        // La sesión ya queda como "perfil completo":
        // el checkout deja de redirigir a Mi Cuenta.
        this.auth.updateUser({ profileComplete: true });

        this.notify.success(
          'Tus datos fueron guardados correctamente.'
        );

        // Una vez guardados los datos, lo llevamos al inicio.
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.savingContact = false;
        this.contactError =
          error?.error?.error ||
          'No pudimos guardar tus datos. Probá de nuevo.';
      }
    });
  }

  /** "Completar más tarde": cierra la ventana sin guardar. */
  skipContact(): void {
    this.showContactModal = false;
  }

  continueShopping(): void {
    this.router.navigate([this.catalogRoute]);
  }

  goToAccount(): void {
    this.router.navigate([this.accountRoute]);
  }
}