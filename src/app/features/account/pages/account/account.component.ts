import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import {
  AccountProfile,
  AccountService,
  TaxCondition
} from '../../services/account.service';

/**
 * Un perfil está "completo" cuando tiene cargados
 * DNI/CUIL, código de área y teléfono.
 */
function hasContactData(
  profile: Pick<AccountProfile, 'dni' | 'phoneArea' | 'phone'> | null
): boolean {
  return !!(
    profile?.dni?.trim() &&
    profile?.phoneArea?.trim() &&
    profile?.phone?.trim()
  );
}

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss'
})
export class AccountComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly saveError = signal(false);
  readonly profile = signal<AccountProfile | null>(null);

  /**
   * true mientras falten DNI/CUIL, código de área o teléfono.
   * Se usa en la plantilla para mostrar el aviso
   * "Por favor completa tus datos".
   */
  readonly missingContactData = computed(() => {
    const p = this.profile();
    return p !== null && !hasContactData(p);
  });

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
    phoneArea: ['', [Validators.required, Validators.pattern(/^\d{2,5}$/)]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{5,10}$/)]],
    street: ['', [Validators.required, Validators.maxLength(160)]],
    floorApt: ['', [Validators.maxLength(40)]],
    postalCode: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{4,8}$/)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    province: ['', [Validators.required, Validators.maxLength(100)]],
    taxCondition: ['final_consumer' as TaxCondition, [Validators.required]],
    taxId: ['', [Validators.required]],
    taxName: ['', [Validators.required, Validators.maxLength(120)]]
  });

  constructor() {
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.saved.set(false);
        this.saveError.set(false);
        this.clearToastTimeout();
      });

    this.form.controls.taxCondition.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateTaxIdValidators());
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.clearToastTimeout();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.accountService.getProfile().subscribe({
      next: (profile) => {
        this.applyProfile(profile);

        // Mantiene sincronizada la sesión: si el usuario ya
        // tenía los datos, el guard del checkout lo deja pasar.
        this.auth.updateUser({
          profileComplete: hasContactData(profile)
        });

        // Si faltan datos de contacto, resaltamos esos campos
        // para que el usuario vea qué tiene que completar.
        if (!hasContactData(profile)) {
          this.form.controls.dni.markAsTouched();
          this.form.controls.phoneArea.markAsTouched();
          this.form.controls.phone.markAsTouched();
        }

        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar la cuenta:', error);
        this.loadError.set(true);
        this.loading.set(false);
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.saved.set(false);
    this.saveError.set(false);
    this.clearToastTimeout();

    this.accountService.updateProfile(this.trimmedValue()).subscribe({
      next: (profile) => {
        const complete = hasContactData(profile);

        this.applyProfile(profile);
        this.auth.updateUser({
          name: profile.name,
          profileComplete: complete
        });

        this.saving.set(false);
        this.showSuccessToast();

        // Si el usuario venía de "Ir a pagar" (o similar),
        // lo devolvemos ahí una vez completados sus datos.
        const returnUrl =
          this.route.snapshot.queryParamMap.get('returnUrl');

        if (complete && returnUrl) {
          this.router.navigateByUrl(returnUrl);
        }
      },
      error: (error) => {
        console.error('Error al guardar la cuenta:', error);
        this.saving.set(false);
        this.saveError.set(true);
      }
    });
  }

  closeToast(): void {
    this.saved.set(false);
    this.clearToastTimeout();
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);

    return !!control &&
      control.invalid &&
      (control.touched || control.dirty);
  }

  taxIdErrorMessage(): string {
    const condition = this.form.controls.taxCondition.value;

    if (condition === 'final_consumer') {
      return 'Ingresá un DNI de 7 u 8 dígitos o un CUIT/CUIL de 11 dígitos.';
    }

    return 'Para esta condición fiscal, ingresá un CUIT de 11 dígitos.';
  }

  private showSuccessToast(): void {
    this.clearToastTimeout();
    this.saved.set(true);

    this.toastTimeout = setTimeout(() => {
      this.saved.set(false);
      this.toastTimeout = null;
    }, 4000);
  }

  private clearToastTimeout(): void {
    if (this.toastTimeout !== null) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
  }

  private updateTaxIdValidators(): void {
    const control = this.form.controls.taxId;
    const condition = this.form.controls.taxCondition.value;

    const pattern = condition === 'final_consumer'
      ? /^\d{7,8}$|^\d{11}$/
      : /^\d{11}$/;

    control.setValidators([
      Validators.required,
      Validators.pattern(pattern)
    ]);

    control.updateValueAndValidity({ emitEvent: false });
  }

  private applyProfile(profile: AccountProfile): void {
    this.profile.set(profile);

    this.form.reset({
      name: profile.name ?? '',
      dni: profile.dni ?? '',
      phoneArea: profile.phoneArea ?? '',
      phone: profile.phone ?? '',
      street: profile.street ?? '',
      floorApt: profile.floorApt ?? '',
      postalCode: profile.postalCode ?? '',
      city: profile.city ?? '',
      province: profile.province ?? '',
      taxCondition: profile.taxCondition ?? 'final_consumer',
      taxId: profile.taxId || profile.dni || '',
      taxName: profile.taxName || profile.name || ''
    });

    this.updateTaxIdValidators();
  }

  private trimmedValue() {
    const value = this.form.getRawValue();

    return {
      ...value,
      name: value.name.trim(),
      dni: value.dni.trim(),
      phoneArea: value.phoneArea.trim(),
      phone: value.phone.trim(),
      street: value.street.trim(),
      floorApt: value.floorApt.trim(),
      postalCode: value.postalCode.trim(),
      city: value.city.trim(),
      province: value.province.trim(),
      taxId: value.taxId.trim(),
      taxName: value.taxName.trim()
    };
  }
}