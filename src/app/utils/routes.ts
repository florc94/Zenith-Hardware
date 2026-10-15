export const appRoutes = {

  es: {

    home: '/',
    catalog: '/catalogo',
    cart: '/carrito',
    checkout: '/checkout',
    login: '/login',
    orders: '/pedidos',

    favorites: '/favoritos',
    compare: '/comparar',

    branches: '/sucursales',
    returns: '/devoluciones',
    faq: '/faq',
    terms: '/terminos',
    shipping: '/envios',

  },

  en: {

    home: '/en/',
    catalog: '/en/catalog',
    cart: '/en/cart',
    checkout: '/en/checkout',
    login: '/en/login',
    orders: '/en/orders',

    favorites: '/en/favorites',
    compare: '/en/compare',

    branches: '/en/branches',
    returns: '/en/returns',
    faq: '/en/faq',
    terms: '/en/terms',
    shipping: '/en/shipping',

  },

} as const;


export type AppLanguage =
  keyof typeof appRoutes;


export function getCurrentLanguage(): AppLanguage {

  return window.location.pathname === '/en' ||
    window.location.pathname.startsWith('/en/')
    ? 'en'
    : 'es';

}


export function localizedRoute(
  route: keyof typeof appRoutes.es
): string {

  return appRoutes[
    getCurrentLanguage()
  ][route];

}