import { CommonModule } from '@angular/common';
import { UsdPipe } from '../../../../shared/pipes/usd.pipe';

import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  signal
} from '@angular/core';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../../cart/services/cart.service';
import { FavoriteService } from '../../../favorites/services/favorite.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

import { ReviewsService } from '../../../reviews/services/reviews.service';
import {
  Review,
  CreateReviewRequest
} from '../../../reviews/models/review.model';

import { getCurrentLanguage } from '../../../../utils/routes';

import {
  peekPendingFavorite,
  savePendingFavorite,
  takePendingFavorite
} from '../../../../utils/pending-favorite';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    UsdPipe
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit, OnDestroy {

  // =====================================================
  // PRODUCTO
  // =====================================================

  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly quantity = signal(1);

  // =====================================================
  // GALERÍA
  // =====================================================

  readonly selectedImage = signal('');
  readonly thumbnailStartIndex = signal(0);
  readonly thumbnailsPerPage = 3;

  // =====================================================
  // FAVORITOS
  // =====================================================

  readonly isFavorite = signal(false);
  readonly favoriteBusy = signal(false);

  // =====================================================
  // PRODUCTOS RELACIONADOS
  // =====================================================

  readonly related = signal<Product[]>([]);

  @ViewChild('relatedTrack')
  relatedTrack?: ElementRef<HTMLElement>;

  // =====================================================
  // AUTOPLAY
  // =====================================================

  private autoplayId?: ReturnType<typeof setInterval>;
  private resumeId?: ReturnType<typeof setTimeout>;

  private autoplayPaused = false;

  // =====================================================
  // REVIEWS
  // =====================================================

  readonly reviews = signal<Review[]>([]);
  readonly reviewsLoading = signal(false);
  readonly reviewsError = signal(false);

  readonly selectedRating = signal(0);
  readonly reviewComment = signal('');
  readonly reviewSubmitting = signal(false);

  readonly deletingReviewId =
    signal<number | null>(null);

  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private favoriteService: FavoriteService,
    readonly auth: AuthService,
    private notify: NotificationService,
    private reviewsService: ReviewsService
  ) {}

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!id || Number.isNaN(id)) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }

    this.productService.getById(id).subscribe({

      next: (product) => {

        if (!product) {
          this.notFound.set(true);
          this.loading.set(false);
          return;
        }

        this.product.set(product);
        this.loading.set(false);

        // =================================================
        // GALERÍA
        // =================================================

        if (product.imageUrl?.trim()) {

          this.selectedImage.set(
            product.imageUrl.trim()
          );

        } else if (
          Array.isArray(product.images) &&
          product.images.length > 0
        ) {

          this.selectedImage.set(
            product.images[0]
          );
        }

        this.thumbnailStartIndex.set(0);

        // =================================================
        // REVIEWS
        // =================================================

        this.loadReviews(id);

        // =================================================
        // PRODUCTOS RELACIONADOS
        // =================================================

        this.loadRelated(product);
      },

      error: (error) => {

        console.error(
          '❌ Error cargando producto:',
          error
        );

        this.notFound.set(true);
        this.loading.set(false);
      }
    });

    this.loadFavorite(id);
  }

  // =====================================================
  // DESTROY
  // =====================================================

  ngOnDestroy(): void {
    this.stopRelatedAutoplay();
  }

  // =====================================================
  // RUTAS
  // =====================================================

  get homeUrl(): string {

    return getCurrentLanguage() === 'en'
      ? '/en/'
      : '/';
  }

  get catalogUrl(): string {

    return getCurrentLanguage() === 'en'
      ? '/en/catalog'
      : '/catalogo';
  }

  get cartUrl(): string {

    return getCurrentLanguage() === 'en'
      ? '/en/cart'
      : '/carrito';
  }

  categoryUrl(category: string): string {

    return `${this.catalogUrl}?categoria=${encodeURIComponent(category)}`;
  }

  productUrl(id: number): string {

    return `${this.catalogUrl}/${id}`;
  }

  // =====================================================
  // ESPECIFICACIONES
  // =====================================================

  specs(): { label: string; value: string }[] {

    const p = this.product();

    if (!p) {
      return [];
    }

    const raw = (
      p as unknown as {
        specs?: Record<string, unknown>;
      }
    ).specs;

    if (raw && typeof raw === 'object') {

      const list = Object.entries(raw)
        .filter(
          ([, value]) =>
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ''
        )
        .map(([label, value]) => ({
          label,
          value: String(value)
        }));

      if (list.length > 0) {
        return list;
      }
    }

    return [
      {
        label: 'Categoría',
        value: p.category
      },
      {
        label: 'Disponibilidad',
        value:
          p.stock > 0
            ? `${p.stock} unidades`
            : 'Sin stock'
      },
      {
        label: 'Código',
        value: String(p.id)
      }
    ];
  }

  // =====================================================
  // PRODUCTOS RELACIONADOS
  // =====================================================

  /**
   * Carga recomendaciones de TODO el catálogo.
   *
   * No se filtra por categoría.
   *
   * Ejemplo:
   *
   * Auriculares →
   * Notebook
   * Mouse
   * Teclado
   * Monitor
   * Webcam
   * PC
   * etc.
   *
   * Se excluyen:
   * - producto actual
   * - productos sin stock
   */

  private loadRelated(product: Product): void {

    this.productService
      .getAll({
        page: 1,
        pageSize: 20,
        search: ''
      })
      .subscribe({

        next: (result) => {

          const availableProducts =
            result.items.filter(
              (item) =>
                item.id !== product.id &&
                item.stock > 0
            );

          /*
           * Mezclamos los productos para evitar
           * que siempre aparezcan los mismos.
           */
          const shuffled =
            [...availableProducts].sort(
              () => Math.random() - 0.5
            );

          /*
           * Máximo 12 recomendaciones.
           */
          this.related.set(
            shuffled.slice(0, 12)
          );

          this.startRelatedAutoplay();
        },

        error: (error) => {

          console.error(
            '❌ Error cargando productos relacionados:',
            error
          );

          this.related.set([]);

          this.stopRelatedAutoplay();
        }
      });
  }

  // =====================================================
  // NAVEGACIÓN DEL CARRUSEL
  // =====================================================

  scrollRelated(
    direction: -1 | 1
  ): void {

    const track =
      this.relatedTrack?.nativeElement;

    if (!track) {
      return;
    }

    const cards =
      Array.from(
        track.querySelectorAll<HTMLElement>(
          '.related-card'
        )
      );

    if (cards.length === 0) {
      return;
    }

    const currentScroll =
      track.scrollLeft;

    /*
     * Encontramos la card que está más cerca
     * de la posición actual.
     */
    const currentIndex =
      cards.reduce(
        (
          closestIndex,
          card,
          index
        ) => {

          const currentDistance =
            Math.abs(
              card.offsetLeft -
              currentScroll
            );

          const closestDistance =
            Math.abs(
              cards[closestIndex].offsetLeft -
              currentScroll
            );

          return currentDistance <
            closestDistance
            ? index
            : closestIndex;

        },
        0
      );

    let nextIndex =
      currentIndex + direction;

    /*
     * Loop circular.
     */
    if (nextIndex >= cards.length) {
      nextIndex = 0;
    }

    if (nextIndex < 0) {
      nextIndex = cards.length - 1;
    }

    track.scrollTo({
      left: cards[nextIndex].offsetLeft,
      behavior: 'smooth'
    });
  }

  // =====================================================
  // AUTOPLAY
  // =====================================================

  private startRelatedAutoplay(): void {

    this.stopRelatedAutoplay();

    if (
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches
    ) {
      return;
    }

    if (this.related().length <= 1) {
      return;
    }

    this.autoplayId =
      setInterval(
        () => this.advanceRelated(),
        3500
      );
  }

  private stopRelatedAutoplay(): void {

    if (this.autoplayId) {
      clearInterval(
        this.autoplayId
      );

      this.autoplayId =
        undefined;
    }

    if (this.resumeId) {
      clearTimeout(
        this.resumeId
      );

      this.resumeId =
        undefined;
    }
  }

  private advanceRelated(): void {

    const track =
      this.relatedTrack?.nativeElement;

    if (
      !track ||
      this.autoplayPaused ||
      !window.matchMedia(
        '(max-width: 430px)'
      ).matches
    ) {
      return;
    }

    const card =
      track.firstElementChild as HTMLElement | null;

    if (!card) {
      return;
    }

    const gap =
      parseFloat(
        getComputedStyle(track).columnGap
      ) || 0;

    const atEnd =
      track.scrollLeft +
        track.clientWidth >=
      track.scrollWidth - 4;

    track.scrollTo({

      left: atEnd
        ? 0
        : track.scrollLeft +
          card.offsetWidth +
          gap,

      behavior: 'smooth'
    });
  }

  pauseRelatedAutoplay(): void {

    this.autoplayPaused = true;

    if (this.resumeId) {
      clearTimeout(
        this.resumeId
      );
    }
  }

  resumeRelatedAutoplay(): void {

    if (this.resumeId) {
      clearTimeout(
        this.resumeId
      );
    }

    this.resumeId =
      setTimeout(() => {

        this.autoplayPaused = false;

        this.resumeId =
          undefined;

      }, 3000);
  }

  // =====================================================
  // GALERÍA
  // =====================================================

  galleryImages(): string[] {

    const p = this.product();

    if (!p) {
      return [];
    }

    const images: string[] = [];

    if (p.imageUrl?.trim()) {

      images.push(
        p.imageUrl.trim()
      );
    }

    if (Array.isArray(p.images)) {

      for (const image of p.images) {

        const normalized =
          typeof image === 'string'
            ? image.trim()
            : '';

        if (
          normalized &&
          !images.includes(normalized)
        ) {
          images.push(normalized);
        }
      }
    }

    return images;
  }

  visibleThumbnailImages(): string[] {

    const images =
      this.galleryImages();

    if (
      images.length <=
      this.thumbnailsPerPage
    ) {
      return images;
    }

    const start =
      this.thumbnailStartIndex();

    return Array.from(
      {
        length:
          this.thumbnailsPerPage
      },
      (_, offset) =>
        images[
          (start + offset) %
          images.length
        ]
    );
  }

  previousThumbnails(): void {

    const total =
      this.galleryImages().length;

    if (
      total <=
      this.thumbnailsPerPage
    ) {
      return;
    }

    this.thumbnailStartIndex.update(
      (index) =>
        (index - 1 + total) %
        total
    );
  }

  nextThumbnails(): void {

    const total =
      this.galleryImages().length;

    if (
      total <=
      this.thumbnailsPerPage
    ) {
      return;
    }

    this.thumbnailStartIndex.update(
      (index) =>
        (index + 1) %
        total
    );
  }

  selectImage(
    image: string
  ): void {

    if (!image?.trim()) {
      return;
    }

    const normalized =
      image.trim();

    this.selectedImage.set(
      normalized
    );

    const selectedIndex =
      this.galleryImages()
        .indexOf(normalized);

    if (selectedIndex === -1) {
      return;
    }

    if (
      !this.visibleThumbnailImages()
        .includes(normalized)
    ) {

      this.thumbnailStartIndex.set(
        selectedIndex
      );
    }
  }

  // =====================================================
  // FAVORITOS
  // =====================================================

  private loadFavorite(
    productId: number
  ): void {

    if (
      !this.auth.isAuthenticated()
    ) {
      return;
    }

    this.favoriteService
      .getAll()
      .subscribe({

        next: (favorites) => {

          const found =
            favorites.some(
              (favorite) =>
                (
                  favorite.productId ??
                  favorite.id
                ) === productId
            );

          this.isFavorite.set(
            found
          );

          this.applyPendingFavorite(
            productId,
            found
          );
        },

        error: () => {

          this.isFavorite.set(
            false
          );
        }
      });
  }

  private applyPendingFavorite(
    productId: number,
    alreadyFavorite: boolean
  ): void {

    const pending =
      peekPendingFavorite();

    if (
      !pending ||
      pending.productId !== productId
    ) {
      return;
    }

    takePendingFavorite();

    if (alreadyFavorite) {
      return;
    }

    this.favoriteBusy.set(
      true
    );

    this.favoriteService
      .toggle(
        productId,
        false
      )
      .subscribe({

        next: () => {

          this.isFavorite.set(
            true
          );

          this.favoriteBusy.set(
            false
          );

          const name =
            this.product()?.name ?? '';

          this.notify.success(
            name
              ? `${name} agregado a favoritos`
              : 'Agregado a favoritos'
          );
        },

        error: (error) => {

          console.error(
            '❌ Error agregando favorito pendiente:',
            error
          );

          this.favoriteBusy.set(
            false
          );
        }
      });
  }

  toggleFavorite(): void {

    const p =
      this.product();

    if (
      !p ||
      this.favoriteBusy()
    ) {
      return;
    }

    if (
      !this.auth.isAuthenticated()
    ) {

      savePendingFavorite(
        p.id
      );

      window.location.href =
        getCurrentLanguage() === 'en'
          ? '/en/login'
          : '/login';

      return;
    }

    const currentlyFavorite =
      this.isFavorite();

    this.favoriteBusy.set(
      true
    );

    this.favoriteService
      .toggle(
        p.id,
        currentlyFavorite
      )
      .subscribe({

        next: () => {

          this.isFavorite.set(
            !currentlyFavorite
          );

          this.favoriteBusy.set(
            false
          );

          this.notify.success(
            currentlyFavorite
              ? `${p.name} quitado de favoritos`
              : `${p.name} agregado a favoritos`
          );
        },

        error: (error) => {

          console.error(
            '❌ Error actualizando favorito:',
            error
          );

          this.favoriteBusy.set(
            false
          );
        }
      });
  }

  // =====================================================
  // CANTIDAD / CARRITO
  // =====================================================

  incrementQty(): void {

    const p =
      this.product();

    if (
      p &&
      this.quantity() < p.stock
    ) {

      this.quantity.update(
        (q) => q + 1
      );
    }
  }

  decrementQty(): void {

    if (
      this.quantity() > 1
    ) {

      this.quantity.update(
        (q) => q - 1
      );
    }
  }

  addToCart(): void {

    const p =
      this.product();

    if (!p) {
      return;
    }

    this.cartService.addItem(
      p,
      this.quantity()
    );

    this.notify.success(
      `${this.quantity()} × ${p.name} agregado al carrito`
    );
  }

  buyNow(): void {

    const p =
      this.product();

    if (!p) {
      return;
    }

    this.cartService.addItem(
      p,
      this.quantity()
    );

    this.router.navigateByUrl(
      this.cartUrl
    );
  }

  scrollToReviews(): void {

    document
      .getElementById('reviews')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
  }

  // =====================================================
  // REVIEWS
  // =====================================================

  loadReviews(
    productId: number
  ): void {

    this.reviewsLoading.set(
      true
    );

    this.reviewsError.set(
      false
    );

    this.reviewsService
      .getReviews(productId)
      .subscribe({

        next: (reviews) => {

          this.reviews.set(
            reviews
          );

          this.reviewsLoading.set(
            false
          );
        },

        error: (error) => {

          console.error(
            '❌ Error cargando reviews:',
            error
          );

          this.reviews.set([]);

          this.reviewsLoading.set(
            false
          );

          this.reviewsError.set(
            true
          );
        }
      });
  }

  selectRating(
    rating: number
  ): void {

    if (
      rating < 1 ||
      rating > 5 ||
      this.reviewSubmitting()
    ) {
      return;
    }

    this.selectedRating.set(
      rating
    );
  }

  setReviewComment(
    event: Event
  ): void {

    const textarea =
      event.target as HTMLTextAreaElement;

    this.reviewComment.set(
      textarea.value
    );
  }

  // =====================================================
  // ESTADÍSTICAS
  // =====================================================

  get averageRating(): number {

    const currentReviews =
      this.reviews();

    if (
      currentReviews.length === 0
    ) {
      return 0;
    }

    const total =
      currentReviews.reduce(
        (sum, review) =>
          sum + review.rating,
        0
      );

    return (
      total /
      currentReviews.length
    );
  }

  get reviewCount(): number {

    return this.reviews().length;
  }

  // =====================================================
  // REVIEW DEL USUARIO
  // =====================================================

  /**
   * Determina si el usuario actual ya tiene
   * una review para este producto.
   *
   * Se convierten ambos IDs a Number porque
   * el backend puede devolver user_id como string
   * mientras AuthService puede tenerlo como number.
   */
  hasUserReview(): boolean {

    if (
      !this.auth.isAuthenticated()
    ) {
      return false;
    }

    const currentUser =
      this.auth.currentUser();

    if (!currentUser) {
      return false;
    }

    return this.reviews().some(
      (review) =>
        Number(review.user_id) ===
        Number(currentUser.id)
    );
  }

  /**
   * Comprueba que la review pertenezca
   * al usuario actualmente autenticado.
   */
  isOwnReview(
    review: Review
  ): boolean {

    const currentUser =
      this.auth.currentUser();

    if (!currentUser) {
      return false;
    }

    return (
      Number(review.user_id) ===
      Number(currentUser.id)
    );
  }

  // =====================================================
  // CREAR REVIEW
  // =====================================================

  submitReview(): void {

    const p =
      this.product();

    if (
      !p ||
      this.reviewSubmitting()
    ) {
      return;
    }

    // ---------------------------------------------------
    // USUARIO NO AUTENTICADO
    // ---------------------------------------------------

    if (
      !this.auth.isAuthenticated()
    ) {

      window.location.href =
        getCurrentLanguage() === 'en'
          ? '/en/login'
          : '/login';

      return;
    }

    // ---------------------------------------------------
    // UNA REVIEW POR USUARIO / PRODUCTO
    // ---------------------------------------------------

    if (
      this.hasUserReview()
    ) {

      this.notify.error(
        'Ya dejaste una review para este producto.'
      );

      return;
    }

    // ---------------------------------------------------
    // VALIDAR RATING
    // ---------------------------------------------------

    const rating =
      this.selectedRating();

    if (
      rating < 1 ||
      rating > 5
    ) {

      this.notify.error(
        'Seleccioná una calificación de 1 a 5 estrellas.'
      );

      return;
    }

    // ---------------------------------------------------
    // COMENTARIO
    // ---------------------------------------------------

    const comment =
      this.reviewComment().trim();

    const payload:
      CreateReviewRequest = {
        rating,
        ...(comment
          ? { comment }
          : {})
      };

    // ---------------------------------------------------
    // ENVIAR
    // ---------------------------------------------------

    this.reviewSubmitting.set(
      true
    );

    this.reviewsService
      .createReview(
        p.id,
        payload
      )
      .subscribe({

        next: () => {

          this.notify.success(
            'Review publicada correctamente.'
          );

          this.selectedRating.set(
            0
          );

          this.reviewComment.set(
            ''
          );

          this.reviewSubmitting.set(
            false
          );

          /*
           * Recargar las reviews.
           *
           * Como ahora existe una review
           * del usuario, hasUserReview()
           * devuelve true y el formulario
           * deja de mostrarse.
           */
          this.loadReviews(
            p.id
          );
        },

        error: (error) => {

          console.error(
            '❌ Error creando review:',
            error
          );

          this.reviewSubmitting.set(
            false
          );

          const message =
            error?.error?.error ??
            'No se pudo publicar la review.';

          this.notify.error(
            message
          );
        }
      });
  }

  // =====================================================
  // ELIMINAR REVIEW
  // =====================================================

  deleteReview(
    review: Review
  ): void {

    /*
     * Solo el propietario de la review
     * puede eliminarla.
     */
    if (
      !this.isOwnReview(review) ||
      this.deletingReviewId() !== null
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        '¿Querés eliminar esta review?'
      );

    if (!confirmed) {
      return;
    }

    this.deletingReviewId.set(
      review.id
    );

    this.reviewsService
      .deleteReview(
        review.id
      )
      .subscribe({

        next: () => {

          this.notify.success(
            'Review eliminada correctamente.'
          );

          this.deletingReviewId.set(
            null
          );

          const p =
            this.product();

          if (p) {

            /*
             * Recargar desde el backend.
             *
             * Si la eliminación fue correcta,
             * la review ya no estará en la lista.
             *
             * Entonces:
             *
             * hasUserReview() === false
             *
             * y vuelve a aparecer el formulario.
             */
            this.loadReviews(
              p.id
            );
          }
        },

        error: (error) => {

          console.error(
            '❌ Error eliminando review:',
            error
          );

          this.deletingReviewId.set(
            null
          );

          const message =
            error?.error?.error ??
            'No se pudo eliminar la review.';

          this.notify.error(
            message
          );
        }
      });
  }

  // =====================================================
  // ESTRELLAS
  // =====================================================

  getStars(
    rating: number
  ): string[] {

    return Array.from(
      { length: 5 },
      (_, index) =>
        index < rating
          ? '★'
          : '☆'
    );
  }

  getAverageStars(): string[] {

    return this.getStars(
      Math.round(
        this.averageRating
      )
    );
  }
}