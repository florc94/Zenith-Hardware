import { Injectable, signal } from '@angular/core';

/**
 * Contador de requests en vuelo. El LoadingInterceptor lo incrementa/decrementa
 * automáticamente; el spinner global sólo lee `isLoading()`.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private requestCount = signal(0);
  readonly isLoading = signal(false);

  show(): void {
    this.requestCount.update((n) => n + 1);
    this.isLoading.set(true);
  }

  hide(): void {
    this.requestCount.update((n) => Math.max(0, n - 1));
    this.isLoading.set(this.requestCount() > 0);
  }
}
