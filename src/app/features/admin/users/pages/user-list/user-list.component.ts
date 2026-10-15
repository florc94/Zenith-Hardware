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
  FormsModule
} from '@angular/forms';

import {
  RouterLink
} from '@angular/router';

import {
  AdminUser,
  AdminUserService
} from '../../services/admin-user.service';

import {
  AuthService
} from '../../../../../core/services/auth.service';

import {
  ConfirmDialogService
} from '../../../shared/confirm-dialog.service';


@Component({
  selector: 'app-admin-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class AdminUserListComponent
  implements OnInit {

  private readonly userService =
    inject(AdminUserService);

  private readonly authService =
    inject(AuthService);

  private readonly confirmDialog =
    inject(ConfirmDialogService);


  readonly users =
    signal<AdminUser[]>([]);

  readonly loading =
    signal(false);

  readonly error =
    signal('');


  searchTerm = '';

  selectedRole:
    'all' |
    'user' |
    'admin' =
    'all';

  selectedOrders:
    'all' |
    'with-orders' |
    'without-orders' =
    'all';


  ngOnInit(): void {
    this.loadUsers();
  }


  // ==========================================
  // CARGAR USUARIOS
  // ==========================================

  loadUsers(): void {

    this.loading.set(true);

    this.error.set('');

    this.userService
      .getUsers()
      .subscribe({

        next: (users) => {

          this.users.set(users);

          this.loading.set(false);
        },

        error: (error) => {

          console.error(
            'Error al cargar usuarios:',
            error
          );

          this.error.set(
            'No se pudieron cargar los usuarios.'
          );

          this.loading.set(false);
        }

      });
  }


  // ==========================================
  // FILTRAR USUARIOS
  // ==========================================

  get filteredUsers(): AdminUser[] {

    const search =
      this.searchTerm
        .trim()
        .toLowerCase();


    return this.users().filter(
      user => {

        const matchesSearch =
          !search ||
          user.name
            .toLowerCase()
            .includes(search) ||
          user.email
            .toLowerCase()
            .includes(search);


        const matchesRole =
          this.selectedRole === 'all' ||
          user.role === this.selectedRole;


        const matchesOrders =
          this.selectedOrders === 'all' ||
          (
            this.selectedOrders ===
              'with-orders' &&
            user.orderCount > 0
          ) ||
          (
            this.selectedOrders ===
              'without-orders' &&
            user.orderCount === 0
          );


        return (
          matchesSearch &&
          matchesRole &&
          matchesOrders
        );
      }
    );
  }


  // ==========================================
  // LIMPIAR FILTROS
  // ==========================================

  clearFilters(): void {

    this.searchTerm = '';

    this.selectedRole = 'all';

    this.selectedOrders = 'all';
  }


  // ==========================================
  // USUARIO ACTUAL
  // ==========================================

  isCurrentUser(
    user: AdminUser
  ): boolean {

    const currentUser =
      this.authService.currentUser();

    return Number(currentUser?.id) ===
      Number(user.id);
  }


  // ==========================================
  // CAMBIAR ROL
  // ==========================================

  async changeUserRole(
    user: AdminUser
  ): Promise<void> {

    if (this.isCurrentUser(user)) {
      return;
    }


    const newRole:
      'user' |
      'admin' =
      user.role === 'admin'
        ? 'user'
        : 'admin';


    const newRoleLabel =
      newRole === 'admin'
        ? 'Administrador'
        : 'Usuario';


    const confirmed =
      await this.confirmDialog.ask({
        title: 'Cambiar rol',
        message:
          `¿Querés cambiar el rol de ` +
          `"${user.name}" a ${newRoleLabel}?`,
        confirmLabel: 'Cambiar rol'
      });


    if (!confirmed) {
      return;
    }


    this.userService
      .updateUserRole(
        user.id,
        newRole
      )
      .subscribe({

        next: (response) => {

          this.users.update(
            users =>
              users.map(
                currentUser =>
                  currentUser.id === user.id
                    ? {
                        ...currentUser,
                        role: response.user.role
                      }
                    : currentUser
              )
          );
        },

        error: (error) => {

          console.error(
            'Error al cambiar rol:',
            error
          );
        }

      });
  }


  // ==========================================
  // ELIMINAR USUARIO
  // ==========================================

  async deleteUser(
    user: AdminUser
  ): Promise<void> {

    if (
      this.isCurrentUser(user) ||
      user.role === 'admin'
    ) {
      return;
    }


    const confirmed =
      await this.confirmDialog.ask({
        title: 'Eliminar usuario',
        message:
          `¿Seguro que querés eliminar ` +
          `la cuenta de "${user.name}"? ` +
          `Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        danger: true
      });


    if (!confirmed) {
      return;
    }


    this.userService
      .deleteUser(user.id)
      .subscribe({

        next: () => {

          this.users.update(
            users =>
              users.filter(
                currentUser =>
                  currentUser.id !== user.id
              )
          );
        },

        error: (error) => {

          console.error(
            'Error al eliminar usuario:',
            error
          );
        }

      });
  }

}