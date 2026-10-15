import {
  CommonModule
} from '@angular/common';

import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import {
  AdminUserDetail,
  AdminUserService
} from '../../services/admin-user.service';


@Component({
  selector: 'app-admin-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss'
})
export class AdminUserDetailComponent
  implements OnInit {

  private readonly route =
    inject(ActivatedRoute);

  private readonly userService =
    inject(AdminUserService);


  readonly user =
    signal<AdminUserDetail | null>(null);

  readonly loading =
    signal(false);

  readonly error =
    signal('');


  ngOnInit(): void {

    const id =
      Number(
        this.route.snapshot.paramMap.get('id')
      );

    if (!Number.isInteger(id) || id <= 0) {

      this.error.set(
        'El ID del usuario no es válido.'
      );

      return;
    }

    this.loadUser(id);
  }


  // ==========================================
  // CARGAR USUARIO
  // ==========================================

  loadUser(id: number): void {

    this.loading.set(true);

    this.error.set('');

    this.userService
      .getUserById(id)
      .subscribe({

        next: (user) => {

          this.user.set(user);

          this.loading.set(false);
        },

        error: (error) => {

          console.error(
            'Error al cargar usuario:',
            error
          );

          this.error.set(
            'No se pudo cargar la información del usuario.'
          );

          this.loading.set(false);
        }

      });
  }


  // ==========================================
  // FORMATEAR ESTADO
  // ==========================================

  getStatusLabel(
    status: string
  ): string {

    switch (status) {

      case 'pending':
      case 'pendiente':
        return 'Pendiente';

      case 'paid':
      case 'pagado':
        return 'Pagado';

      case 'processing':
      case 'procesando':
        return 'Procesando';

      case 'shipped':
      case 'enviado':
        return 'Enviado';

      case 'delivered':
      case 'entregado':
        return 'Entregado';

      case 'cancelled':
      case 'cancelado':
        return 'Cancelado';

      default:
        return status;
    }
  }


  // ==========================================
  // CLASE ESTADO
  // ==========================================

  getStatusClass(
    status: string
  ): string {

    switch (status) {

      case 'pending':
      case 'pendiente':
        return 'pending';

      case 'paid':
      case 'pagado':
        return 'paid';

      case 'processing':
      case 'procesando':
        return 'processing';

      case 'shipped':
      case 'enviado':
        return 'shipped';

      case 'delivered':
      case 'entregado':
        return 'delivered';

      case 'cancelled':
      case 'cancelado':
        return 'cancelled';

      default:
        return '';
    }
  }

}