import { Request, Response } from 'express';
import { pool } from '../config/db';

/*
 * =====================================================
 * CATEGORÍAS OFICIALES ZENITH HARDWARE
 * =====================================================
 */

const CATEGORIES = {
  es: [
    'Notebooks',
    'PCs Mini',
    'Combos Actualización PC',
    'Motherboards',
    'Procesadores',
    'Memorias Ram',
    'Almacenamiento',
    'Placas de Video',
    'Gabinetes',
    'Fuentes de Poder',
    'Refrigeración',
    'Teclados, Mouses y Pads',
    'Auriculares y Micrófonos',
    'Volantes, Simuladores y Joysticks',
    'Cámaras Web e IP',
    'Monitores',
    'Impresoras y Plotters',
    'Conectividad',
    'Ups y Estabilizadores',
    'Sillas Gamers',
    'Consolas Video Juegos',
    'Parlantes y Audio',
    'Streaming',
    'Proyectores',
    'Software',
    'Tablets y eBooks',
    'Tabletas Gráficas',
    'Tv',
    'Outlet'
  ],

  en: [
    'Laptops',
    'Mini PCs',
    'PC Upgrade Bundles',
    'Motherboards',
    'Processors',
    'RAM',
    'Storage',
    'Graphics Cards',
    'PC Cases',
    'Power Supplies',
    'Cooling',
    'Keyboards, Mice & Mouse Pads',
    'Headsets & Microphones',
    'Racing Wheels, Simulators & Controllers',
    'Webcams & IP Cameras',
    'Monitors',
    'Printers & Plotters',
    'Connectivity',
    'UPS & Voltage Stabilizers',
    'Gaming Chairs',
    'Video Game Consoles',
    'Speakers & Audio',
    'Streaming',
    'Projectors',
    'Software',
    'Tablets & eBooks',
    'Graphics Tablets',
    'TVs',
    'Outlet'
  ]
};

/*
 * =====================================================
 * OBTENER CATEGORÍAS
 * GET /api/products/categories?lang=es
 * GET /api/products/categories?lang=en
 * =====================================================
 */

export async function getCategories(
  req: Request,
  res: Response
) {
  try {
    const locale = req.query.lang === 'en' ? 'en' : 'es';

    return res.json(CATEGORIES[locale]);
  } catch (error) {
    console.error('Error al obtener las categorías:', error);

    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}

/*
 * =====================================================
 * OBTENER PRODUCTOS ACTIVOS
 * GET /api/products?lang=es&page=1&pageSize=9
 *
 * El catálogo público solamente muestra productos
 * cuyo campo is_active sea TRUE.
 * =====================================================
 */

export async function getProducts(
  req: Request,
  res: Response
) {
  try {
    const locale = req.query.lang === 'en' ? 'en' : 'es';

    const search =
      typeof req.query.search === 'string'
        ? req.query.search.trim()
        : '';

    const category =
      typeof req.query.category === 'string'
        ? req.query.category.trim()
        : '';

    const sortBy =
      typeof req.query.sortBy === 'string'
        ? req.query.sortBy
        : '';

    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const pageSize = Math.min(
      Math.max(Number(req.query.pageSize) || 9, 1),
      50
    );

    const offset = (page - 1) * pageSize;

    const values: unknown[] = [locale];

    // El catálogo público siempre excluye productos inactivos.
    const conditions: string[] = [
      'p.is_active = TRUE'
    ];

    if (search) {
      values.push(`%${search}%`);

      const searchParam = `$${values.length}`;

      conditions.push(`
        (
          COALESCE(pt.name, p.name)
            ILIKE ${searchParam}

          OR COALESCE(
            pt.description,
            p.description
          ) ILIKE ${searchParam}

          OR COALESCE(
            pt.category,
            'General'
          ) ILIKE ${searchParam}
        )
      `);
    }

    if (category) {
      values.push(`%${category}%`);

      const categoryParam = `$${values.length}`;

      conditions.push(`
        COALESCE(
          pt.category,
          'General'
        ) ILIKE ${categoryParam}
      `);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    let orderBy = 'p.id ASC';

    switch (sortBy) {
      case 'price-asc':
        orderBy = 'p.price ASC, p.id ASC';
        break;

      case 'price-desc':
        orderBy = 'p.price DESC, p.id ASC';
        break;

      case 'name':
        orderBy = `
          COALESCE(pt.name, p.name) ASC,
          p.id ASC
        `;
        break;
    }

    // El total también cuenta solamente productos activos.
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM products p
      LEFT JOIN product_translations pt
        ON pt.product_id = p.id
        AND pt.locale = $1
      ${whereClause}
    `;

    const countResult = await pool.query(
      countQuery,
      values
    );

    const total: number = countResult.rows[0].total;

    const dataValues = [
      ...values,
      pageSize,
      offset
    ];

    const limitParam = `$${dataValues.length - 1}`;
    const offsetParam = `$${dataValues.length}`;

    const query = `
      SELECT
        p.id,

        COALESCE(
          pt.name,
          p.name
        ) AS name,

        COALESCE(
          pt.description,
          p.description
        ) AS description,

        CAST(p.price AS FLOAT) AS price,

        p.image_url AS "imageUrl",

        COALESCE(
          p.image_urls,
          ARRAY[]::TEXT[]
        ) AS images,

        p.stock,

        COALESCE(
          pt.category,
          'General'
        ) AS category,

        5 AS rating

      FROM products p

      LEFT JOIN product_translations pt
        ON pt.product_id = p.id
        AND pt.locale = $1

      ${whereClause}

      ORDER BY ${orderBy}

      LIMIT ${limitParam}
      OFFSET ${offsetParam}
    `;

    const result = await pool.query(
      query,
      dataValues
    );

    return res.json({
      items: result.rows,
      total,
      page,
      pageSize
    });
  } catch (error) {
    console.error('Error al obtener los productos:', error);

    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}

/*
 * =====================================================
 * OBTENER PRODUCTO POR ID
 * GET /api/products/:id?lang=es
 *
 * No devuelve productos inactivos al catálogo público.
 * =====================================================
 */

export async function getProductById(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID de producto inválido'
      });
    }

    const locale = req.query.lang === 'en' ? 'en' : 'es';

    const query = `
      SELECT
        p.id,

        COALESCE(
          pt.name,
          p.name
        ) AS name,

        COALESCE(
          pt.description,
          p.description
        ) AS description,

        CAST(p.price AS FLOAT) AS price,

        p.image_url AS "imageUrl",

        COALESCE(
          p.image_urls,
          ARRAY[]::TEXT[]
        ) AS images,

        p.stock,

        COALESCE(
          pt.category,
          'General'
        ) AS category,

        5 AS rating

      FROM products p

      LEFT JOIN product_translations pt
        ON pt.product_id = p.id
        AND pt.locale = $2

      WHERE p.id = $1
        AND p.is_active = TRUE
    `;

    const result = await pool.query(
      query,
      [id, locale]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Producto no encontrado'
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener el producto:', error);

    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}

/*
 * =====================================================
 * CREAR PRODUCTO
 * Los productos nuevos se crean activos.
 * =====================================================
 */

export async function createProduct(
  req: Request,
  res: Response
) {
  try {
    const {
      name,
      category,
      description,
      price,
      stock,
      imageUrl,
      images
    } = req.body;

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: 'El nombre del producto es obligatorio'
      });
    }

    if (typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({
        error: 'La categoría del producto es obligatoria'
      });
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        error: 'El precio no es válido'
      });
    }

    const numericStock = Number(stock);

    if (!Number.isInteger(numericStock) || numericStock < 0) {
      return res.status(400).json({
        error: 'El stock no es válido'
      });
    }

    if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
      return res.status(400).json({
        error: 'La URL de imagen es obligatoria'
      });
    }

    const normalizedImages: string[] = Array.isArray(images)
      ? images
          .filter(
            (image): image is string =>
              typeof image === 'string' &&
              image.trim().length > 0
          )
          .map(image => image.trim())
      : [];

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const productResult = await client.query(
        `
          INSERT INTO products (
            name,
            description,
            price,
            image_url,
            image_urls,
            stock,
            is_active
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            TRUE
          )
          RETURNING
            id,
            name,
            description,
            CAST(price AS FLOAT) AS price,
            image_url AS "imageUrl",
            image_urls AS images,
            stock,
            is_active AS "isActive"
        `,
        [
          name.trim(),
          typeof description === 'string'
            ? description.trim()
            : '',
          numericPrice,
          imageUrl.trim(),
          normalizedImages,
          numericStock
        ]
      );

      const product = productResult.rows[0];

      await client.query(
        `
          INSERT INTO product_translations (
            product_id,
            locale,
            name,
            description,
            category
          )
          VALUES (
            $1,
            'es',
            $2,
            $3,
            $4
          )
        `,
        [
          product.id,
          name.trim(),
          typeof description === 'string'
            ? description.trim()
            : '',
          category.trim()
        ]
      );

      await client.query('COMMIT');

      return res.status(201).json({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl,
        images: product.images || [],
        stock: product.stock,
        category: category.trim(),
        rating: 5,
        isActive: product.isActive
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al crear el producto:', error);

    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}

/*
 * =====================================================
 * ACTUALIZAR PRODUCTO
 * Conserva el estado activo/inactivo existente.
 * =====================================================
 */

export async function updateProduct(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID de producto inválido'
      });
    }

    const {
      name,
      category,
      description,
      price,
      stock,
      imageUrl,
      images
    } = req.body;

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: 'El nombre del producto es obligatorio'
      });
    }

    if (typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({
        error: 'La categoría del producto es obligatoria'
      });
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        error: 'El precio no es válido'
      });
    }

    const numericStock = Number(stock);

    if (!Number.isInteger(numericStock) || numericStock < 0) {
      return res.status(400).json({
        error: 'El stock no es válido'
      });
    }

    if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
      return res.status(400).json({
        error: 'La URL de imagen es obligatoria'
      });
    }

    const normalizedImages: string[] = Array.isArray(images)
      ? images
          .filter(
            (image): image is string =>
              typeof image === 'string' &&
              image.trim().length > 0
          )
          .map(image => image.trim())
      : [];

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const productResult = await client.query(
        `
          UPDATE products
          SET
            name = $1,
            description = $2,
            price = $3,
            image_url = $4,
            image_urls = $5,
            stock = $6
          WHERE id = $7
          RETURNING id
        `,
        [
          name.trim(),
          typeof description === 'string'
            ? description.trim()
            : '',
          numericPrice,
          imageUrl.trim(),
          normalizedImages,
          numericStock,
          id
        ]
      );

      if (productResult.rows.length === 0) {
        await client.query('ROLLBACK');

        return res.status(404).json({
          error: 'Producto no encontrado'
        });
      }

      const translationResult = await client.query(
        `
          UPDATE product_translations
          SET
            name = $1,
            description = $2,
            category = $3
          WHERE product_id = $4
            AND locale = 'es'
          RETURNING id
        `,
        [
          name.trim(),
          typeof description === 'string'
            ? description.trim()
            : '',
          category.trim(),
          id
        ]
      );

      if (translationResult.rows.length === 0) {
        await client.query(
          `
            INSERT INTO product_translations (
              product_id,
              locale,
              name,
              description,
              category
            )
            VALUES (
              $1,
              'es',
              $2,
              $3,
              $4
            )
          `,
          [
            id,
            name.trim(),
            typeof description === 'string'
              ? description.trim()
              : '',
            category.trim()
          ]
        );
      }

      await client.query('COMMIT');

      const result = await client.query(
        `
          SELECT
            p.id,

            COALESCE(
              pt.name,
              p.name
            ) AS name,

            COALESCE(
              pt.description,
              p.description
            ) AS description,

            CAST(p.price AS FLOAT) AS price,

            p.image_url AS "imageUrl",

            COALESCE(
              p.image_urls,
              ARRAY[]::TEXT[]
            ) AS images,

            p.stock,

            COALESCE(
              pt.category,
              'General'
            ) AS category,

            p.is_active AS "isActive",

            5 AS rating

          FROM products p

          LEFT JOIN product_translations pt
            ON pt.product_id = p.id
            AND pt.locale = 'es'

          WHERE p.id = $1
        `,
        [id]
      );

      return res.json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al actualizar el producto:', error);

    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}

/*
 * =====================================================
 * ELIMINAR PRODUCTO
 *
 * No elimina productos que forman parte de pedidos.
 * =====================================================
 */

export async function deleteProduct(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID de producto inválido'
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const productResult = await client.query(
        `
          SELECT id, name
          FROM products
          WHERE id = $1
          FOR UPDATE
        `,
        [id]
      );

      if (productResult.rows.length === 0) {
        await client.query('ROLLBACK');

        return res.status(404).json({
          error: 'Producto no encontrado'
        });
      }

      const product = productResult.rows[0];

      const orderItemsResult = await client.query(
        `
          SELECT EXISTS (
            SELECT 1
            FROM order_items
            WHERE product_id = $1
          ) AS "hasOrders"
        `,
        [id]
      );

      const hasOrders = orderItemsResult.rows[0].hasOrders;

      if (hasOrders) {
        await client.query('ROLLBACK');

        return res.status(409).json({
          error:
            'No se puede eliminar este producto porque ya forma parte de uno o más pedidos.',
          code: 'PRODUCT_HAS_ORDERS',
          message:
            'El producto no se eliminó para conservar correctamente el historial de pedidos.'
        });
      }

      await client.query(
        `
          DELETE FROM product_translations
          WHERE product_id = $1
        `,
        [id]
      );

      await client.query(
        `
          UPDATE products
          SET is_active = FALSE
          WHERE id = $1
        `,
        [id]
      );

      // Se conserva el registro en products para mantener
      // las referencias de carritos, favoritos y reseñas.
      // Como ya está inactivo, no aparecerá en el catálogo.

      await client.query('COMMIT');

      return res.status(200).json({
        message: 'Producto desactivado correctamente',
        id: product.id,
        name: product.name
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al eliminar el producto:', error);

    return res.status(500).json({
      error: 'No se pudo eliminar el producto'
    });
  }
}