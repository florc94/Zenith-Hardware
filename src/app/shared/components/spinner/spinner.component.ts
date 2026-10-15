import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';

/**
 * Barra de progreso fina en el borde superior. Se eligió sobre un overlay
 * con spinner centrado porque no bloquea la lectura de la página mientras
 * llegan datos que sólo actualizan una parte de la pantalla.
 */
@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loading.isLoading()) {
      <div class="progress" role="progressbar" aria-label="Cargando"></div>
    }
  `,
  styles: [`
    .progress {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      z-index: 3000;
      background: linear-gradient(90deg, transparent, var(--ticket), transparent);
      background-size: 40% 100%;
      background-repeat: no-repeat;
      animation: sweep 1s infinite linear;
    }
    @keyframes sweep {
      from { background-position: -40% 0; }
      to { background-position: 140% 0; }
    }
  `]
})
export class SpinnerComponent {
  loading = inject(LoadingService);
}
