import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toasts" role="status" aria-live="polite">
      @for (toast of notify.toasts(); track toast.id) {
        <button class="toast" [attr.data-type]="toast.type" (click)="notify.dismiss(toast.id)">
          {{ toast.message }}
        </button>
      }
    </div>
  `,
  styles: [`
    .toasts {
      position: fixed;
      bottom: 1.25rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      z-index: 2000;
      width: min(420px, calc(100vw - 2rem));
    }
    .toast {
      text-align: left;
      padding: 0.8rem 1rem;
      border: 1px solid var(--ink);
      border-left-width: 4px;
      border-radius: var(--radius);
      background: var(--ink);
      color: #fff;
      font-size: var(--size-sm);
      font-weight: 500;
      box-shadow: 0 6px 20px rgba(20, 24, 27, .25);
      animation: toast-in .16s ease-out;
    }
    .toast[data-type="success"] { border-left-color: var(--ticket); }
    .toast[data-type="error"] { border-left-color: var(--alert); }
    .toast[data-type="info"] { border-left-color: var(--signal); }

    @keyframes toast-in {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: none; }
    }
  `]
})
export class ToastComponent {
  notify = inject(NotificationService);
}
