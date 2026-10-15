import { CommonModule } from '@angular/common';

import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  signal
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import {
  Subject,
  Subscription,
  interval,
  of
} from 'rxjs';

import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  tap
} from 'rxjs/operators';

import {
  AuthService
} from '../../../core/services/auth.service';

import {
  NotificationItem,
  NotificationService
} from '../../../core/services/notification.service';

import {
  CartService
} from '../../../features/cart/services/cart.service';

import {
  ProductService,
  SearchSuggestion
} from '../../../features/catalog/services/product.service';

import {
  appRoutes,
  getCurrentLanguage,
  AppLanguage
} from '../../../utils/routes';


@Component({
  selector: 'app-navbar',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
  ],

  templateUrl: './navbar.component.html',

  styleUrl: './navbar.component.scss'
})
export class NavbarComponent
  implements OnInit, OnDestroy {

  readonly routes = appRoutes;

  readonly language: AppLanguage =
    getCurrentLanguage();


  // =====================================================
  // SUBMENÚ DE PRODUCTOS
  // =====================================================

  readonly categories =
    signal<string[]>([]);

  readonly productsMenuOpen =
    signal(false);


  readonly menuRows = computed(() =>
    Math.max(
      1,
      Math.ceil(
        this.categories().length / 4
      )
    )
  );


  // =====================================================
  // MENÚ MOBILE (HAMBURGUESA)
  // =====================================================

  readonly mobileMenuOpen =
    signal(false);


  // =====================================================
  // DESPLEGABLE "MI CUENTA" (desktop)
  // =====================================================

  readonly accountMenuOpen =
    signal(false);


  // =====================================================
  // BUSCADOR
  // =====================================================

  // Nombre del parámetro que lee el catálogo
  // (ej: /catalogo?search=teclado).

  private readonly searchParam =
    'search';

  readonly mobileSearchOpen =
    signal(false);


  // Autocompletado (sugerencias en vivo)

  private readonly minSearchLength = 2;

  private readonly searchTerms$ =
    new Subject<string>();

  private searchSubscription?: Subscription;

  readonly searchTerm =
    signal('');

  readonly suggestions =
    signal<SearchSuggestion[]>([]);

  readonly suggestionsOpen =
    signal(false);

  readonly searchLoading =
    signal(false);

  readonly activeIndex =
    signal(-1);

  // Último término que ya se buscó en el servidor

  private readonly lastSearched =
    signal('');

  readonly noResults = computed(() =>
    this.lastSearched() !== '' &&
    this.lastSearched() ===
      this.searchTerm().trim() &&
    this.suggestions().length === 0 &&
    !this.searchLoading()
  );


  // =====================================================
  // NOTIFICACIONES
  // =====================================================

  readonly notificationsOpen =
    signal(false);


  private notificationPolling?: Subscription;


  constructor(
    public auth: AuthService,

    public cart: CartService,

    public notifications:
      NotificationService,

    private router: Router,

    private productService:
      ProductService
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    // ===================================================
    // BUSCADOR EN VIVO
    // ===================================================

    this.searchSubscription =
      this.searchTerms$
        .pipe(
          map(term => term.trim()),

          debounceTime(250),

          distinctUntilChanged(),

          tap(term => {

            if (
              term.length <
              this.minSearchLength
            ) {

              this.suggestions.set([]);

              this.lastSearched.set('');

              this.searchLoading.set(false);

            }

          }),

          switchMap(term =>

            term.length <
            this.minSearchLength

              ? of(null)

              : this.productService
                  .searchProducts(term, 8)
                  .pipe(
                    map(items => ({
                      term,
                      items
                    })),

                    catchError(() =>
                      of({
                        term,
                        items:
                          [] as SearchSuggestion[]
                      })
                    )
                  )

          )
        )
        .subscribe(result => {

          if (!result) {

            return;

          }


          this.suggestions.set(
            result.items
          );

          this.lastSearched.set(
            result.term
          );

          this.searchLoading.set(
            false
          );

          this.activeIndex.set(
            -1
          );

        });


    // ===================================================
    // CATEGORÍAS
    // ===================================================

    this.productService
      .getCategories()
      .subscribe({

        next: (
          categories
        ) => {

          this.categories.set(
            categories
          );

        },

        error: (
          error
        ) => {

          console.error(
            'Error al cargar categorías del navbar:',
            error
          );

          this.categories.set([]);

        }

      });


    // ===================================================
    // NOTIFICACIONES
    // ===================================================

    if (
      this.auth.isAuthenticated() &&
      !this.auth.isAdmin()
    ) {

      this.notifications
        .loadUnreadCount();

      this.notificationPolling =
        interval(30000)
          .subscribe(() => {

            if (
              this.auth.isAuthenticated() &&
              !this.auth.isAdmin()
            ) {

              this.notifications
                .loadUnreadCount();

            }

          });

    }

  }


  ngOnDestroy(): void {

    this.notificationPolling
      ?.unsubscribe();

    this.searchSubscription
      ?.unsubscribe();

  }


  // =====================================================
  // RUTAS
  // =====================================================

  get catalogUrl(): string {

    return this.language === 'en'
      ? '/en/catalog'
      : '/catalogo';

  }


  categoryUrl(
    category: string
  ): string {

    return `${this.catalogUrl}?categoria=${encodeURIComponent(category)}`;

  }


  // =====================================================
  // MENÚ PRODUCTOS
  // =====================================================

  private canHover(): boolean {

    return (
      typeof window !== 'undefined' &&
      !!window.matchMedia &&
      window.matchMedia(
        '(hover: hover)'
      ).matches
    );

  }


  onProductsMouseEnter(): void {

    if (this.canHover()) {

      this.productsMenuOpen.set(
        true
      );

    }

  }


  onProductsMouseLeave(): void {

    if (this.canHover()) {

      this.productsMenuOpen.set(
        false
      );

    }

  }


  toggleProductsMenu(): void {

    this.productsMenuOpen.update(
      open => !open
    );

  }


  closeProductsMenu(): void {

    this.productsMenuOpen.set(
      false
    );

  }


  // =====================================================
  // MENÚ MOBILE
  // =====================================================

  toggleMobileMenu(): void {

    this.mobileMenuOpen.update(
      open => !open
    );


    // Si abrimos el menú, cerramos el buscador

    if (
      this.mobileMenuOpen()
    ) {

      this.mobileSearchOpen.set(
        false
      );

    }

  }


  closeMobileMenu(): void {

    this.mobileMenuOpen.set(
      false
    );

  }


  // =====================================================
  // MI CUENTA
  // =====================================================

  get accountUrl(): string {

    return this.language === 'en'
      ? '/en/account'
      : '/cuenta';

  }


  get ordersUrl(): string {

    return this.language === 'en'
      ? '/en/orders'
      : '/pedidos';

  }


  // Primer nombre para el saludo ("Hola, Valentina")

  get firstName(): string {

    return (
      this.auth
        .currentUser()
        ?.name
        ?.trim()
        .split(/\s+/)[0] ?? ''
    );

  }


  onAccountMouseEnter(): void {

    if (this.canHover()) {

      this.accountMenuOpen.set(
        true
      );

    }

  }


  onAccountMouseLeave(): void {

    if (this.canHover()) {

      this.accountMenuOpen.set(
        false
      );

    }

  }


  toggleAccountMenu(): void {

    this.accountMenuOpen.update(
      open => !open
    );

  }


  closeAccountMenu(): void {

    this.accountMenuOpen.set(
      false
    );

  }


  // =====================================================
  // BUSCADOR
  // =====================================================

  toggleMobileSearch(
    input: HTMLInputElement
  ): void {

    const willOpen =
      !this.mobileSearchOpen();


    this.mobileSearchOpen.set(
      willOpen
    );


    if (willOpen) {

      // Si abrimos el buscador, cerramos el menú

      this.mobileMenuOpen.set(
        false
      );

      setTimeout(
        () => input.focus(),
        0
      );

    }

  }


  closeMobileSearch(): void {

    this.mobileSearchOpen.set(
      false
    );

  }


  // Se ejecuta en cada tecla del input

  onSearchInput(
    term: string
  ): void {

    this.searchTerm.set(
      term
    );

    this.activeIndex.set(
      -1
    );


    const hasEnough =
      term.trim().length >=
      this.minSearchLength;


    this.suggestionsOpen.set(
      hasEnough
    );

    this.searchLoading.set(
      hasEnough
    );


    this.searchTerms$.next(
      term
    );

  }


  // Al volver a enfocar el input,
  // se reabren las sugerencias previas

  onSearchFocus(): void {

    if (
      this.searchTerm().trim().length >=
      this.minSearchLength
    ) {

      this.suggestionsOpen.set(
        true
      );

    }

  }


  // Flechas + Enter + Escape

  onSearchKeydown(
    event: KeyboardEvent
  ): void {

    const items =
      this.suggestions();


    switch (event.key) {

      case 'ArrowDown':

        if (!items.length) {

          return;

        }

        event.preventDefault();

        this.suggestionsOpen.set(
          true
        );

        this.activeIndex.update(
          index =>
            (index + 1) % items.length
        );

        break;


      case 'ArrowUp':

        if (!items.length) {

          return;

        }

        event.preventDefault();

        this.suggestionsOpen.set(
          true
        );

        this.activeIndex.update(
          index =>
            index <= 0
              ? items.length - 1
              : index - 1
        );

        break;


      case 'Enter': {

        const active =
          items[this.activeIndex()];

        if (
          this.suggestionsOpen() &&
          active
        ) {

          event.preventDefault();

          window.location.href =
            this.productUrl(active);

        }

        break;

      }


      case 'Escape':

        this.closeSuggestions();

        break;

    }

  }


  closeSuggestions(): void {

    this.suggestionsOpen.set(
      false
    );

    this.activeIndex.set(
      -1
    );

  }


  onSearch(
    event: Event,
    term: string
  ): void {

    event.preventDefault();


    const query =
      term.trim();


    if (!query) {

      return;

    }


    this.closeSuggestions();

    this.closeMobileSearch();


    window.location.href =
      this.searchResultsUrl(
        query
      );

  }


  // Página de resultados completa

  searchResultsUrl(
    term: string
  ): string {

    return `${this.catalogUrl}?${this.searchParam}=${encodeURIComponent(term.trim())}`;

  }


  // Detalle de un producto
  // (misma ruta que usan las tarjetas del catálogo).

  productUrl(
    item: SearchSuggestion
  ): string {

    return `${this.catalogUrl}/${item.id}`;

  }


  formatPrice(
    price: number
  ): string {

    return new Intl.NumberFormat(
      'es-AR',
      {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0
      }
    ).format(price);

  }


  // =====================================================
  // NOTIFICACIONES
  // =====================================================

  toggleNotifications(): void {

    this.notificationsOpen.update(
      open => !open
    );


    if (
      this.notificationsOpen()
    ) {

      this.notifications
        .loadNotifications();

    }

  }


  closeNotifications(): void {

    this.notificationsOpen.set(
      false
    );

  }


  // =====================================================
  // MARCAR NOTIFICACIÓN COMO LEÍDA
  // =====================================================

  markNotificationAsRead(
    notification: NotificationItem
  ): void {

    if (
      notification.isRead
    ) {

      return;

    }


    this.notifications
      .markAsRead(
        notification.id
      )
      .subscribe({

        next: () => {

          this.notifications
            .notifications
            .update(
              notifications =>
                notifications.map(
                  item =>
                    item.id ===
                    notification.id
                      ? {
                          ...item,
                          isRead: true
                        }
                      : item
                )
            );


          this.notifications
            .unreadCount
            .update(
              count =>
                Math.max(
                  0,
                  count - 1
                )
            );

        },

        error: (
          error
        ) => {

          console.error(
            'Error al marcar notificación como leída:',
            error
          );

        }

      });

  }


  // =====================================================
  // MARCAR TODAS COMO LEÍDAS
  // =====================================================

  markAllNotificationsAsRead(): void {

    this.notifications
      .markAllAsRead();

  }


  // =====================================================
  // ABRIR NOTIFICACIÓN
  // =====================================================

  openNotification(
    notification: NotificationItem
  ): void {

    // Si ya estaba leída,
    // simplemente navegamos.

    if (
      notification.isRead
    ) {

      this.closeNotifications();


      if (
        notification.orderId
      ) {

        window.location.href =
          this.language === 'en'
            ? '/en/orders'
            : '/pedidos';

      }

      return;

    }


    // Primero marcamos como leída.
    // Esperamos a que termine el PATCH
    // antes de navegar.

    this.notifications
      .markAsRead(
        notification.id
      )
      .subscribe({

        next: () => {

          this.notifications
            .notifications
            .update(
              notifications =>
                notifications.map(
                  item =>
                    item.id ===
                    notification.id
                      ? {
                          ...item,
                          isRead: true
                        }
                      : item
                )
            );


          this.notifications
            .unreadCount
            .update(
              count =>
                Math.max(
                  0,
                  count - 1
                )
            );


          this.closeNotifications();


          if (
            notification.orderId
          ) {

            window.location.href =
              this.language === 'en'
                ? '/en/orders'
                : '/pedidos';

          }

        },

        error: (
          error
        ) => {

          console.error(
            'Error al marcar notificación como leída:',
            error
          );

        }

      });

  }


  // =====================================================
  // FECHA DE NOTIFICACIÓN
  // =====================================================

  notificationDate(
    date: string
  ): string {

    const parsedDate =
      new Date(date);


    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {

      return '';

    }


    return parsedDate
      .toLocaleDateString(
        this.language === 'en'
          ? 'en-US'
          : 'es-AR',
        {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }
      );

  }


  // =====================================================
  // CLICK FUERA
  // =====================================================

  @HostListener(
    'document:click',
    ['$event']
  )

  onDocumentClick(
    event: Event
  ): void {

    const target =
      event.target as
      HTMLElement | null;


    if (
      this.productsMenuOpen() &&
      !target?.closest?.(
        '.navbar__dropdown'
      )
    ) {

      this.closeProductsMenu();

    }


    if (
      this.notificationsOpen() &&
      !target?.closest?.(
        '.navbar__notifications'
      )
    ) {

      this.closeNotifications();

    }


    if (
      this.mobileMenuOpen() &&
      !target?.closest?.(
        '.navbar__bar'
      ) &&
      !target?.closest?.(
        '.navbar__burger'
      )
    ) {

      this.closeMobileMenu();

    }


    if (
      this.accountMenuOpen() &&
      !target?.closest?.(
        '.navbar__account-menu'
      )
    ) {

      this.closeAccountMenu();

    }


    if (
      this.suggestionsOpen() &&
      !target?.closest?.(
        '.navbar__search'
      )
    ) {

      this.closeSuggestions();

    }


    if (
      this.mobileSearchOpen() &&
      !target?.closest?.(
        '.navbar__search'
      ) &&
      !target?.closest?.(
        '.navbar__search-toggle'
      )
    ) {

      this.closeMobileSearch();

    }

  }


  // =====================================================
  // ESCAPE
  // =====================================================

  @HostListener(
    'document:keydown.escape'
  )

  onEscape(): void {

    this.closeProductsMenu();

    this.closeNotifications();

    this.closeMobileMenu();

    this.closeMobileSearch();

    this.closeSuggestions();

    this.closeAccountMenu();

  }


  // =====================================================
  // NAVEGACIÓN
  // =====================================================

  goHome(): void {

    window.location.href =
      this.language === 'en'
        ? '/en/'
        : '/';

  }


  isActiveHome(): boolean {

    return this.router.url ===
      (
        this.language === 'en'
          ? '/en/'
          : '/'
      );

  }


  // =====================================================
  // LOGOUT
  // =====================================================

  logout(): void {

    this.notificationsOpen.set(
      false
    );


    this.notifications
      .notifications
      .set([]);


    this.notifications
      .unreadCount
      .set(0);


    this.auth.logout();


    window.location.href =
      this.language === 'en'
        ? '/en/catalog'
        : '/catalogo';

  }

}