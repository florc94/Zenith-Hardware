import {
  Injectable,
  inject,
  signal,
  computed
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Product
} from '../../catalog/models/product.model';

import {
  environment
} from '../../../../environments/environment';

import {
  AuthService
} from '../../../core/services/auth.service';


export interface CartItem {
  product: Product;
  quantity: number;
}


const GUEST_CART_KEY =
  'shopsphere_guest_cart';


@Injectable({
  providedIn: 'root'
})
export class CartService {

  private readonly http =
    inject(HttpClient);

  private readonly auth =
    inject(AuthService);

  private readonly apiUrl =
    `${environment.apiUrl}/cart`;


  // ==========================================
  // SIGNAL DEL CARRITO
  // ==========================================

  private readonly cartItemsSignal =
    signal<CartItem[]>([]);


  public readonly items =
    this.cartItemsSignal.asReadonly();


  // ==========================================
  // NOTIFICACIÓN
  // ==========================================

  private readonly notificationSignal =
    signal<string | null>(null);


  public readonly notification =
    this.notificationSignal.asReadonly();


  private notificationTimeout: ReturnType<typeof setTimeout> | null = null;


  // ==========================================
  // CANTIDAD TOTAL
  // ==========================================

  public readonly itemCount =
    computed(() => {

      return this.cartItemsSignal()
        .reduce(
          (total, item) =>
            total + item.quantity,
          0
        );

    });


  // ==========================================
  // SUBTOTAL
  // ==========================================

  public readonly subtotal =
    computed(() => {

      return this.cartItemsSignal()
        .reduce(
          (total, item) =>
            total +
            item.product.price *
            item.quantity,
          0
        );

    });


  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor() {

    if (
      this.auth.isAuthenticated()
    ) {

      this.loadCart();

    } else {

      this.loadGuestCart();

    }

  }


  // ==========================================
  // MOSTRAR NOTIFICACIÓN
  // ==========================================

  private showNotification(
    message: string
  ): void {

    this.notificationSignal.set(
      message
    );


    if (
      this.notificationTimeout
    ) {

      clearTimeout(
        this.notificationTimeout
      );

    }


    this.notificationTimeout =
      setTimeout(() => {

        this.notificationSignal.set(
          null
        );

        this.notificationTimeout = null;

      }, 2500);

  }


  // ==========================================
  // CARGAR CARRITO
  // ==========================================

  public loadCart(): void {

    if (
      !this.auth.isAuthenticated()
    ) {

      this.loadGuestCart();

      return;

    }


    this.http
      .get<CartItem[]>(
        this.apiUrl
      )
      .subscribe({

        next: (items) => {

          const validItems =
            this.sanitizeItems(
              items
            );


          this.cartItemsSignal.set(
            validItems
          );


          console.log(
            '✅ Carrito cargado desde PostgreSQL:',
            validItems
          );

        },

        error: (err) => {

          console.error(
            '❌ Error al cargar carrito:',
            err
          );

        }

      });

  }


  // ==========================================
  // CARGAR CARRITO DE INVITADO
  // ==========================================

  private loadGuestCart(): void {

    const raw =
      localStorage.getItem(
        GUEST_CART_KEY
      );


    if (!raw) {

      this.cartItemsSignal.set([]);

      console.log(
        '🛒 Carrito de invitado cargado:',
        []
      );

      return;

    }


    try {

      const items =
        JSON.parse(
          raw
        ) as CartItem[];


      const validItems =
        this.sanitizeItems(
          items
        );


      this.cartItemsSignal.set(
        validItems
      );


      this.saveGuestCart();


      console.log(
        '🛒 Carrito de invitado cargado:',
        validItems
      );

    } catch (error) {

      console.error(
        '❌ Error al cargar carrito de invitado:',
        error
      );


      localStorage.removeItem(
        GUEST_CART_KEY
      );


      this.cartItemsSignal.set([]);

    }

  }


  // ==========================================
  // GUARDAR CARRITO DE INVITADO
  // ==========================================

  private saveGuestCart(): void {

    localStorage.setItem(
      GUEST_CART_KEY,
      JSON.stringify(
        this.cartItemsSignal()
      )
    );

  }


  // ==========================================
  // VALIDAR ITEMS
  // ==========================================

  private sanitizeItems(
    items: CartItem[]
  ): CartItem[] {

    if (
      !Array.isArray(items)
    ) {

      return [];

    }


    return items

      .filter(
        item =>
          item?.product &&
          Number(item.product.stock) > 0
      )

      .map(
        item => {

          const stock =
            Number(
              item.product.stock
            );


          const quantity =
            Number(
              item.quantity
            );


          return {

            ...item,

            quantity:
              Math.min(
                Math.max(
                  Number.isFinite(quantity)
                    ? quantity
                    : 1,
                  1
                ),
                stock
              )

          };

        }
      );

  }


  // ==========================================
  // AGREGAR PRODUCTO
  // ==========================================

  public addItem(
    product: Product,
    quantity: number = 1
  ): void {

    const stock =
      Number(
        product.stock
      );


    if (
      stock <= 0
    ) {

      this.showNotification(
        'Este producto no tiene stock disponible'
      );

      console.warn(
        '⚠️ El producto no tiene stock.'
      );

      return;

    }


    const currentItems =
      this.cartItemsSignal();


    const existingItem =
      currentItems.find(
        item =>
          item.product.id ===
          product.id
      );


    let newQuantity =
      quantity;


    if (
      existingItem
    ) {

      newQuantity =
        existingItem.quantity +
        quantity;

    }


    // ==========================================
    // VALIDAR CANTIDAD
    // ==========================================

    if (
      newQuantity <= 0
    ) {

      return;

    }


    if (
      newQuantity > stock
    ) {

      this.showNotification(
        `Stock máximo alcanzado. Disponible: ${stock}`
      );

      console.warn(
        `⚠️ Stock máximo alcanzado. Disponible: ${stock}`
      );

      return;

    }


    // ==========================================
    // USUARIO AUTENTICADO
    // ==========================================

    if (
      this.auth.isAuthenticated()
    ) {

      this.http
        .post(
          `${this.apiUrl}/items`,
          {
            productId:
              product.id,

            quantity:
              newQuantity
          }
        )
        .subscribe({

          next: () => {

            this.updateLocalItem(
              product,
              newQuantity
            );


            this.showNotification(
              `${product.name} agregado al carrito`
            );


            console.log(
              `✅ Producto ${product.id} agregado al carrito`
            );

          },

          error: (err) => {

            console.error(
              '❌ Error al agregar producto:',
              err
            );


            this.showNotification(
              'No se pudo agregar el producto al carrito'
            );

          }

        });


      return;

    }


    // ==========================================
    // VISITANTE
    // ==========================================

    this.updateLocalItem(
      product,
      newQuantity
    );


    this.showNotification(
      `${product.name} agregado al carrito`
    );


    console.log(
      `🛒 Producto ${product.id} agregado al carrito como visitante`
    );

  }


  // ==========================================
  // ACTUALIZAR ITEM LOCALMENTE
  // ==========================================

  private updateLocalItem(
    product: Product,
    quantity: number
  ): void {

    this.cartItemsSignal.update(
      items => {

        const existingIndex =
          items.findIndex(
            item =>
              item.product.id ===
              product.id
          );


        if (
          existingIndex !== -1
        ) {

          const updated =
            [...items];


          updated[existingIndex] = {

            ...updated[existingIndex],

            product,

            quantity

          };


          return updated;

        }


        return [

          ...items,

          {
            product,
            quantity
          }

        ];

      }
    );


    if (
      !this.auth.isAuthenticated()
    ) {

      this.saveGuestCart();

    }

  }


  // ==========================================
  // ACTUALIZAR CANTIDAD
  // ==========================================

  public updateQuantity(
    productId: number,
    quantity: number
  ): void {

    const item =
      this.cartItemsSignal()
        .find(
          item =>
            item.product.id ===
            productId
        );


    if (!item) {

      return;

    }


    if (
      quantity <= 0
    ) {

      this.removeItem(
        productId
      );

      return;

    }


    if (
      quantity >
      item.product.stock
    ) {

      this.showNotification(
        `Stock máximo alcanzado. Disponible: ${item.product.stock}`
      );

      console.warn(
        `⚠️ Stock máximo alcanzado. Disponible: ${item.product.stock}`
      );

      return;

    }


    // ==========================================
    // USUARIO AUTENTICADO
    // ==========================================

    if (
      this.auth.isAuthenticated()
    ) {

      this.http
        .post(
          `${this.apiUrl}/items`,
          {
            productId,
            quantity
          }
        )
        .subscribe({

          next: () => {

            this.cartItemsSignal.update(
              items =>
                items.map(
                  currentItem =>
                    currentItem.product.id ===
                    productId
                      ? {
                          ...currentItem,
                          quantity
                        }
                      : currentItem
                )
            );


            console.log(
              `✅ Cantidad actualizada para producto ${productId}: ${quantity}`
            );

          },

          error: (err) => {

            console.error(
              '❌ Error al actualizar cantidad:',
              err
            );

          }

        });


      return;

    }


    // ==========================================
    // VISITANTE
    // ==========================================

    this.cartItemsSignal.update(
      items =>
        items.map(
          currentItem =>
            currentItem.product.id ===
            productId
              ? {
                  ...currentItem,
                  quantity
                }
              : currentItem
        )
    );


    this.saveGuestCart();

  }


  // ==========================================
  // ELIMINAR PRODUCTO
  // ==========================================

  public removeItem(
    productId: number
  ): void {

    if (
      this.auth.isAuthenticated()
    ) {

      this.http
        .delete(
          `${this.apiUrl}/items/${productId}`
        )
        .subscribe({

          next: () => {

            this.cartItemsSignal.update(
              items =>
                items.filter(
                  item =>
                    item.product.id !==
                    productId
                )
            );


            console.log(
              `✅ Producto ${productId} eliminado`
            );

          },

          error: (err) => {

            console.error(
              '❌ Error al eliminar producto:',
              err
            );

          }

        });


      return;

    }


    this.cartItemsSignal.update(
      items =>
        items.filter(
          item =>
            item.product.id !==
            productId
        )
    );


    this.saveGuestCart();

  }


  // ==========================================
  // VACIAR CARRITO
  // ==========================================

  public clear(): void {

    if (
      this.auth.isAuthenticated()
    ) {

      this.http
        .delete(
          this.apiUrl
        )
        .subscribe({

          next: () => {

            this.cartItemsSignal.set([]);

            console.log(
              '✅ Carrito vaciado'
            );

          },

          error: (err) => {

            console.error(
              '❌ Error al vaciar carrito:',
              err
            );

          }

        });


      return;

    }


    this.cartItemsSignal.set([]);

    localStorage.removeItem(
      GUEST_CART_KEY
    );

  }


  // ==========================================
  // SINCRONIZAR CARRITO DE INVITADO
  // ==========================================

  public syncGuestCart(): void {

    if (
      !this.auth.isAuthenticated()
    ) {

      return;

    }


    const guestCart =
      this.getGuestCart();


    if (
      guestCart.length === 0
    ) {

      this.loadCart();

      return;

    }


    let pending =
      guestCart.length;

    let hasError =
      false;


    for (
      const item of guestCart
    ) {

      const quantity =
        Math.min(
          item.quantity,
          item.product.stock
        );


      this.http
        .post(
          `${this.apiUrl}/items`,
          {
            productId:
              item.product.id,

            quantity
          }
        )
        .subscribe({

          next: () => {

            pending--;


            if (
              pending === 0
            ) {

              if (
                hasError
              ) {

                this.loadCart();

                return;

              }


              localStorage.removeItem(
                GUEST_CART_KEY
              );


              this.loadCart();


              console.log(
                '✅ Carrito de invitado sincronizado con PostgreSQL'
              );

            }

          },

          error: (err) => {

            hasError = true;

            pending--;


            console.error(
              `❌ Error sincronizando producto ${item.product.id}:`,
              err
            );


            if (
              pending === 0
            ) {

              this.loadCart();

            }

          }

        });

    }

  }


  // ==========================================
  // OBTENER CARRITO DE INVITADO
  // ==========================================

  private getGuestCart(): CartItem[] {

    const raw =
      localStorage.getItem(
        GUEST_CART_KEY
      );


    if (!raw) {

      return [];

    }


    try {

      return this.sanitizeItems(
        JSON.parse(raw)
      );

    } catch (error) {

      console.error(
        '❌ Error leyendo carrito de invitado:',
        error
      );


      localStorage.removeItem(
        GUEST_CART_KEY
      );


      return [];

    }

  }

}