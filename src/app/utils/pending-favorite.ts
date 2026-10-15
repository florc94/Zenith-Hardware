const KEY = 'shopsphere.pendingFavorite';

export interface PendingFavorite {
  productId: number;
  returnUrl: string;
}

/** Guarda qué producto quería marcar y a qué página volver */
export function savePendingFavorite(productId: number): void {
  try {
    const pending: PendingFavorite = {
      productId,
      returnUrl: window.location.pathname + window.location.search
    };
    sessionStorage.setItem(KEY, JSON.stringify(pending));
  } catch {
    /* sessionStorage no disponible: no pasa nada */
  }
}

/** Lee sin borrar (para el login) */
export function peekPendingFavorite(): PendingFavorite | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PendingFavorite) : null;
  } catch {
    return null;
  }
}

/** Lee y borra (para aplicarlo una sola vez) */
export function takePendingFavorite(): PendingFavorite | null {
  const pending = peekPendingFavorite();
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignorar */
  }
  return pending;
}