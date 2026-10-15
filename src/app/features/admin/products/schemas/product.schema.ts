import { z } from 'zod';

/**
 * Única fuente de verdad para las reglas del formulario de producto.
 * El form (product-form.component.ts) sólo se ocupa de conectar estos
 * mensajes a los controles de Reactive Forms vía zodValidator().
 */
export const productSchema = z.object({
  name: z.string().trim().min(3, 'El nombre necesita al menos 3 caracteres'),
  category: z.string().trim().min(1, 'Elegí una categoría'),
  description: z.string().trim().min(10, 'Contá un poco más del producto (mínimo 10 caracteres)'),
  price: z.coerce.number().positive('El precio tiene que ser mayor a 0'),
  stock: z.coerce.number().int('El stock tiene que ser un número entero').min(0, 'El stock no puede ser negativo'),
  imageUrl: z.string().trim().url('Tiene que ser una URL válida (https://…)'),
  rating: z.coerce.number().min(0).max(5).default(0)
});

export type ProductFormValue = z.infer<typeof productSchema>;
