import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { UsdPipe } from '../../../../../shared/pipes/usd.pipe';

import { Product } from '../../../../catalog/models/product.model';
import { ProductService } from '../../../../catalog/services/product.service';

import { AdminProductService } from '../../services/admin-product.service';

import { NotificationService } from '../../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog.service';

@Component({
  selector: 'app-admin-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    UsdPipe
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class AdminProductListComponent
  implements OnInit {

  private productService =
    inject(ProductService);

  private adminProductService =
    inject(AdminProductService);

  private notify =
    inject(NotificationService);

  private confirm =
    inject(ConfirmDialogService);


  readonly products =
    signal<Product[]>([]);

  readonly total =
    signal(0);

  readonly page =
    signal(1);

  readonly loading =
    signal(true);

  readonly pageSize =
    10;


  ngOnInit(): void {
    this.load();
  }


  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(
        this.total() /
        this.pageSize
      )
    );
  }


  goToPage(page: number): void {

    this.page.set(page);

    this.load();

  }


  async remove(
    product: Product
  ): Promise<void> {

    /*
     * --------------------------------------------------
     * 1. El botón fue presionado
     * --------------------------------------------------
     */

    console.log(
      '1. CLICK BORRAR',
      product
    );


    /*
     * --------------------------------------------------
     * 2. Abrir confirmación
     * --------------------------------------------------
     */

    const confirmed =
      await this.confirm.ask({

        title:
          'Borrar producto',

        message:
          `"${product.name}" se va a borrar del catálogo. Esta acción no se puede deshacer.`,

        confirmLabel:
          'Borrar',

        danger:
          true

      });


    /*
     * --------------------------------------------------
     * 3. Resultado de la confirmación
     * --------------------------------------------------
     */

    console.log(
      '2. CONFIRMACIÓN',
      confirmed
    );


    /*
     * El usuario canceló.
     */

    if (!confirmed) {

      console.log(
        'Eliminación cancelada por el usuario.'
      );

      return;

    }


    /*
     * --------------------------------------------------
     * 4. Enviar DELETE al backend
     * --------------------------------------------------
     */

    console.log(
      '3. ENVIANDO DELETE',
      product.id
    );


    this.adminProductService
      .delete(product.id)
      .subscribe({

        /*
         * ------------------------------------------------
         * DELETE exitoso
         * ------------------------------------------------
         */

        next: () => {

          console.log(
            '4. DELETE EXITOSO',
            product.id
          );


          this.notify.success(
            `${product.name} eliminado correctamente`
          );


          this.load();

        },


        /*
         * ------------------------------------------------
         * Error del DELETE
         * ------------------------------------------------
         */

        error: (error) => {

          console.error(
            '4. ERROR DELETE:',
            error
          );


          /*
           * El producto pertenece a uno o más pedidos.
           */

          if (
            error?.status === 409 &&
            error?.error?.code ===
              'PRODUCT_HAS_ORDERS'
          ) {

            this.notify.error(
              'No se puede eliminar este producto porque ya forma parte de uno o más pedidos.'
            );

            return;

          }


          /*
           * Producto inexistente.
           */

          if (
            error?.status === 404
          ) {

            this.notify.error(
              'El producto ya no existe en el catálogo.'
            );


            this.load();

            return;

          }


          /*
           * Error genérico.
           */

          this.notify.error(
            'No se pudo eliminar el producto. Intentá nuevamente.'
          );

        }

      });

  }


  private load(): void {

    this.loading.set(true);


    this.productService
      .getAll({

        page:
          this.page(),

        pageSize:
          this.pageSize

      })
      .subscribe({

        next: (result) => {

          this.products.set(
            result.items
          );


          this.total.set(
            result.total
          );


          this.loading.set(false);

        },


        error: (error) => {

          console.error(
            'Error al cargar productos:',
            error
          );


          this.loading.set(false);

        }

      });

  }

}