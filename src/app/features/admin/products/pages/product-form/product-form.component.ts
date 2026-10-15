import { CommonModule } from '@angular/common';

import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  ProductService
} from '../../../../catalog/services/product.service';


@Component({
  selector: 'app-admin-product-form',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl:
    './product-form.component.html',

  styleUrl:
    './product-form.component.scss'
})
export class AdminProductFormComponent
  implements OnInit {


  form: FormGroup;


  productId:
    number | null = null;


  loading =
    signal<boolean>(false);


  submitting =
    signal<boolean>(false);


  categories =
    signal<string[]>([]);


  constructor(

    private fb: FormBuilder,

    private route: ActivatedRoute,

    private router: Router,

    private productService:
      ProductService

  ) {

    this.form =
      this.fb.group({

        name: [
          '',
          [
            Validators.required
          ]
        ],

        category: [
          '',
          [
            Validators.required
          ]
        ],

        description: [
          ''
        ],

        price: [
          0,
          [
            Validators.required,
            Validators.min(0)
          ]
        ],

        stock: [
          0,
          [
            Validators.required,
            Validators.min(0)
          ]
        ],

        imageUrl: [
          '',
          [
            Validators.required
          ]
        ],

        /*
         * Las URLs de la galería se escriben
         * separadas por comas.
         */
        images: [
          ''
        ],

        shippingInfo: [
          ''
        ]

      });

  }


  ngOnInit(): void {

    this.loadCategories();


    const idParam =
      this.route.snapshot.paramMap.get(
        'id'
      );


    console.log(
      '🟣 ID recibido por la ruta:',
      idParam
    );


    /*
     * EDITAR
     */
    if (idParam) {

      const id =
        Number(idParam);


      if (
        Number.isInteger(id) &&
        id > 0
      ) {

        this.productId =
          id;


        this.loadProduct(
          id
        );

      } else {

        console.error(
          '🔴 ID de producto inválido:',
          idParam
        );

      }

    }


    /*
     * CREAR
     */
    else {

      console.log(
        '🟡 Formulario de nuevo producto'
      );

    }

  }


  loadCategories(): void {

    console.log(
      '🟣 Cargando categorías...'
    );


    this.productService
      .getCategories()
      .subscribe({

        next: (
          categories
        ) => {

          console.log(
            '🟢 Categorías recibidas:',
            categories
          );


          this.categories.set(
            categories
          );

        },


        error: (
          error
        ) => {

          console.error(
            '🔴 Error al cargar categorías:',
            error
          );

          console.error(
            '🔴 Status:',
            error?.status
          );

          console.error(
            '🔴 Error body:',
            error?.error
          );

        }

      });

  }


  loadProduct(
    id: number
  ): void {

    this.loading.set(
      true
    );


    console.log(
      '🟣 Cargando producto:',
      id
    );


    this.productService
      .getById(id)
      .subscribe({

        next: (
          product
        ) => {

          console.log(
            '🟢 Producto recibido:',
            product
          );


          this.form.patchValue({

            name:
              product.name ??
              '',

            category:
              product.category ??
              '',

            description:
              product.description ??
              '',

            price:
              product.price ??
              0,

            stock:
              product.stock ??
              0,

            imageUrl:
              product.imageUrl ??
              '',

            /*
             * Convertimos el array recibido
             * por el backend en texto separado
             * por comas para mostrarlo en el textarea.
             */
            images:
              Array.isArray(
                (product as any).images
              )
                ? (
                    (product as any).images
                  ).join(', ')
                : '',

            shippingInfo:
              (
                product as any
              ).shippingInfo ??
              ''

          });


          console.log(
            '🟢 Formulario cargado:',
            this.form.getRawValue()
          );


          this.loading.set(
            false
          );

        },


        error: (
          error
        ) => {

          console.error(
            '🔴 Error al cargar el producto:',
            error
          );

          console.error(
            '🔴 Status:',
            error?.status
          );

          console.error(
            '🔴 Error body:',
            error?.error
          );


          this.loading.set(
            false
          );

        }

      });

  }


  get f() {

    return this.form.controls;

  }


  submit(): void {

    console.log(
      '🟣 SUBMIT EJECUTADO'
    );


    /*
     * Validar formulario
     */
    if (
      this.form.invalid
    ) {

      console.log(
        '🔴 FORMULARIO INVÁLIDO'
      );


      console.log(
        '🔴 Valores:',
        this.form.getRawValue()
      );


      this.form.markAllAsTouched();


      return;

    }


    this.submitting.set(
      true
    );


    const formValues =
      this.form.getRawValue();


    /*
     * =====================================
     * NORMALIZAR IMÁGENES DE GALERÍA
     * =====================================
     *
     * El usuario escribe:
     *
     * https://imagen1.jpg,
     * https://imagen2.jpg,
     * https://imagen3.jpg
     *
     * Y enviamos:
     *
     * [
     *   "https://imagen1.jpg",
     *   "https://imagen2.jpg",
     *   "https://imagen3.jpg"
     * ]
     */

    const images =
      String(
        formValues.images ??
        ''
      )
        .split(',')
        .map(
          image =>
            image.trim()
        )
        .filter(
          image =>
            image.length > 0
        );


    const productData = {

      name:
        String(
          formValues.name ??
          ''
        ).trim(),

      category:
        String(
          formValues.category ??
          ''
        ).trim(),

      description:
        String(
          formValues.description ??
          ''
        ).trim(),

      price:
        Number(
          formValues.price
        ),

      stock:
        Number(
          formValues.stock
        ),

      imageUrl:
        String(
          formValues.imageUrl ??
          ''
        ).trim(),

      /*
       * Galería de imágenes.
       */
      images

    };


    console.log(
      '🟣 PRODUCT DATA:',
      productData
    );


    /*
     * =====================================
     * CREAR PRODUCTO
     * =====================================
     */

    if (
      !this.productId
    ) {

      console.log(
        '🟢 MODO CREACIÓN'
      );


      this.productService
        .create(
          productData
        )
        .subscribe({

          next: (
            createdProduct
          ) => {

            console.log(
              '🟢 PRODUCTO CREADO:',
              createdProduct
            );


            this.submitting.set(
              false
            );


            this.router.navigate([
              '/admin/products'
            ]);

          },


          error: (
            error
          ) => {

            console.error(
              '🔴 ERROR AL CREAR PRODUCTO:',
              error
            );


            console.error(
              '🔴 STATUS:',
              error?.status
            );


            console.error(
              '🔴 ERROR BODY:',
              error?.error
            );


            console.error(
              '🔴 MESSAGE:',
              error?.message
            );


            this.submitting.set(
              false
            );

          }

        });


      return;

    }


    /*
     * =====================================
     * EDITAR PRODUCTO
     * =====================================
     */

    console.log(
      '🟡 MODO EDICIÓN'
    );


    console.log(
      '🟣 PRODUCT ID:',
      this.productId
    );


    this.productService
      .update(
        this.productId,
        productData
      )
      .subscribe({

        next: (
          updatedProduct
        ) => {

          console.log(
            '🟢 PRODUCTO ACTUALIZADO:',
            updatedProduct
          );


          this.submitting.set(
            false
          );


          this.router.navigate([
            '/admin/products'
          ]);

        },


        error: (
          error
        ) => {

          console.error(
            '🔴 ERROR AL ACTUALIZAR PRODUCTO:',
            error
          );


          console.error(
            '🔴 STATUS:',
            error?.status
          );


          console.error(
            '🔴 ERROR BODY:',
            error?.error
          );


          console.error(
            '🔴 MESSAGE:',
            error?.message
          );


          this.submitting.set(
            false
          );

        }

      });

  }


  zodError(
    control: any
  ): string | null {

    if (
      control?.errors &&
      control?.touched
    ) {

      if (
        control.errors['required']
      ) {

        return 'Este campo es obligatorio.';

      }


      if (
        control.errors['min']
      ) {

        return 'El valor no puede ser negativo.';

      }

    }


    return null;

  }

}