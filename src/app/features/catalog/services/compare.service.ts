import { Injectable, computed, signal } from '@angular/core';

import { Product } from '../models/product.model';

/**
 * Datos mínimos que guardamos de cada producto elegido.
 * El precio, stock y specs se piden de nuevo en la página
 * de comparación, así siempre están actualizados.
 */
export interface CompareItem {
  id: number;
  name: string;
  imageUrl: string;
  category: string;
}

const STORAGE_KEY = 'compare-items';

export const MAX_COMPARE_ITEMS = 4;

@Injectable({ providedIn: 'root' })
export class CompareService {

  readonly max = MAX_COMPARE_ITEMS;

  private readonly _items =
    signal<CompareItem[]>(this.read());

  readonly items = this._items.asReadonly();

  readonly count = computed(() => this._items().length);

  /** Categoría de los productos elegidos (null si no hay ninguno) */
  readonly category = computed(
    () => this._items()[0]?.category ?? null
  );

  /** Mensaje temporal (por ejemplo, "no se puede agregar") */
  readonly notice = signal<string | null>(null);

  private noticeTimer?: ReturnType<typeof setTimeout>;


  // =====================================================
  // CONSULTAS
  // =====================================================

  isSelected(id: number): boolean {
    return this._items().some(item => item.id === id);
  }


  // =====================================================
  // ACCIONES
  // =====================================================

  /** Agrega el producto si no está, o lo quita si ya estaba */
  toggle(
    product: Pick<Product, 'id' | 'name' | 'imageUrl' | 'category'>
  ): void {

    if (this.isSelected(product.id)) {
      this.remove(product.id);
      return;
    }

    const current = this._items();

    if (current.length >= MAX_COMPARE_ITEMS) {
      this.showNotice(
        `Podés comparar hasta ${MAX_COMPARE_ITEMS} productos a la vez.`
      );
      return;
    }

    if (
      current.length > 0 &&
      current[0].category !== product.category
    ) {
      this.showNotice(
        `Solo podés comparar productos de la misma categoría (${current[0].category}).`
      );
      return;
    }

    this.save([
      ...current,
      {
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        category: product.category
      }
    ]);

  }

  remove(id: number): void {
    this.save(this._items().filter(item => item.id !== id));
  }

  clear(): void {
    this.save([]);
  }


  // =====================================================
  // AVISOS
  // =====================================================

  private showNotice(message: string): void {

    this.notice.set(message);

    if (this.noticeTimer) {
      clearTimeout(this.noticeTimer);
    }

    this.noticeTimer = setTimeout(
      () => this.notice.set(null),
      3500
    );

  }


  // =====================================================
  // PERSISTENCIA
  // =====================================================

  private save(items: CompareItem[]): void {

    this._items.set(items);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch {
      /* si el navegador bloquea localStorage, sigue funcionando en memoria */
    }

  }

  private read(): CompareItem[] {

    try {

      const raw = localStorage.getItem(STORAGE_KEY);

      const parsed = raw ? JSON.parse(raw) : [];

      return Array.isArray(parsed)
        ? parsed.slice(0, MAX_COMPARE_ITEMS)
        : [];

    } catch {

      return [];

    }

  }

}