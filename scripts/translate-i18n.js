const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');
const { translate } = require('@vitalets/google-translate-api');

const projectRoot = path.join(__dirname, '..');

const localeDir = path.join(
  projectRoot,
  'src',
  'locale'
);

const englishFile = path.join(
  localeDir,
  'messages.en.xlf'
);

const extractedFile = path.join(
  localeDir,
  'messages.extracted.xlf'
);

/*
 * ============================================================
 * CONFIGURACIÓN
 * ============================================================
 */

const MAX_RETRIES = 3;

const RETRY_DELAYS = [
  2000,
  5000,
  10000
];

/*
 * ============================================================
 * TRADUCCIONES LOCALES
 * ============================================================
 */

const EN_TRANSLATIONS = {

  /*
   * ADMIN
   */

  adminNavFulfillment: 'Fulfillment',
  adminNavDashboard: 'Dashboard',
  dashboardTitle: 'Dashboard',
  fulfillmentTitle: 'Fulfillment',
  fulfillmentKanbanView: 'Kanban',
  fulfillmentTracking: 'Tracking',
  fulfillmentTableTracking: 'Tracking',
  fulfillmentTableTotal: 'Total',
  fulfillmentPreviousPage: 'Previous page',
  fulfillmentTotalOrders: 'orders',
  fulfillmentNextPage: 'Next page',
  fulfillmentGrandTotal: 'Total',

  /*
   * PRODUCTOS
   */

  productFormStock: 'Stock',
  productFormImageUrlPlaceholder: 'https://…',
  productListStock: 'Stock',

  /*
   * LOGIN
   */

  loginEmailLabel: 'Email',

  /*
   * CART
   */

  cartCheckout: 'Go to checkout',
  cartShippingFree: 'Free',
  cartTotal: 'Total',
  cartOutOfStock: 'Out of stock',

  cartEyebrow: 'SHOPSPHERE',
  cartSubtitle:
    'Review your products before completing your purchase.',
  cartItemCount: 'products',
  cartEmptyEyebrow: 'YOUR CART',
  cartProductsTitle: 'Products',
  cartProductsReview: 'Review your selection',
  cartQuantityLabel: 'Quantity',
  cartLineSubtotal: 'Subtotal',
  cartSummaryEyebrow: 'YOUR PURCHASE',

  cartFreeShippingHint:
    'You are missing {{amount}} to get free shipping.',

  cartFreeShippingSuccess:
    'You have free shipping.',

  cartSecureMessage:
    'Secure and protected purchase',

  /*
   * CATALOG
   */

  catalogTitle:
    'Everything you need, all in one place.',

  catalogDescription:
    'Explore our selection of products and find exactly what you need.',

  catalogSearchPlaceholder:
    'Search products...',

  catalogAdd:
    'Add to cart',

  catalogPrevious:
    '← Previous',

  catalogNext:
    'Next →',

  catalogEyebrow:
    'SHOPSPHERE · CATALOG',

  catalogCategoriesEyebrow:
    'EXPLORE',

  catalogCategoriesTitle:
    'Categories',

  catalogCategoryAudioDescription:
    'Headphones and audio',

  catalogCategoryComputingDescription:
    'Computers and accessories',

  catalogCategoryComputingDescription2:
    'Computers and accessories',

  catalogCategoryGamingDescription:
    'Everything for gaming',

  catalogCategoryAccessoriesDescription:
    'Essential accessories',

  catalogCategoryDefaultDescription:
    'Discover our products',

  catalogProductsLabel:
    'Products',

  catalogAvailable:
    'Available',

  /*
   * CHECKOUT
   */

  checkoutPayment:
    'Payment method',

  checkoutOrderSummary:
    'Order summary',

  checkoutSubtotal:
    'Subtotal',

  checkoutTotal:
    'Total',

  checkoutEyebrow:
    'SHOPSPHERE',

  checkoutSubtitle:
    'Complete your details to confirm your order.',

  checkoutSecureTitle:
    'Secure checkout',

  checkoutSecureDescription:
    'Your information is protected',

  checkoutEmptyEyebrow:
    'CHECKOUT',

  checkoutShippingEyebrow:
    'DELIVERY',

  checkoutShippingDescription:
    'Where would you like to receive your order?',

  checkoutFullNamePlaceholder:
    'Full name',

  checkoutAddressPlaceholder:
    'Street and number',

  checkoutCityPlaceholder:
    'City',

  checkoutPaymentEyebrow:
    'PAYMENT',

  checkoutPaymentDescription:
    'Enter your card details.',

  checkoutCardLabel:
    'Card',

  checkoutPaymentSecure:
    'Your payment information is processed securely.',

  checkoutSummaryEyebrow:
    'YOUR ORDER',

  checkoutPerUnit:
    'per unit',

  checkoutFreeShippingHint:
    'You are missing {{amount}} to get free shipping.',

  checkoutFreeShippingSuccess:
    'You have free shipping.',

  checkoutSummarySecure:
    'Secure and protected purchase',

  /*
   * ORDER DETAIL
   */

  orderDetailTotal:
    'Total',

  /*
   * NEWSLETTER / SOCIAL
   */

  newsletterTitle:
    'Newsletter',

  newsletterEmailLabel:
    'Email',

  socialInstagram:
    'Instagram',

  socialFacebook:
    'Facebook',

  socialTikTok:
    'TikTok',

  socialWhatsapp:
    'WhatsApp',

  /*
   * BRAND / NAVIGATION
   */

  brandName:
    'ShopSphere',

  navAdmin:
    'Admin',

  /*
   * HOME
   */

  homeHeroEyebrow:
    'SHOPSPHERE',

  homeCategoriesEyebrow:
    'CATEGORIES',

  homeCategoryAudio:
    'Audio',

  homeCategoryAudioDescription:
    'Headphones and speakers',

  homeCategoryComputingDescription:
    'Keyboards and storage',

  homeCategoryGaming:
    'Gaming',

  homeCategoryGamingDescription:
    'Gaming equipment',

  homeCategoryAccessoriesDescription:
    'Accessories for your everyday life',

  homeFeaturedEyebrow:
    'FEATURED',

  homeProductCategoryAudio:
    'AUDIO',

  homeProductCategoryGaming:
    'GAMING',

  homeMonitor:
    '27" Monitor',

  homeShippingEyebrow:
    'SHIPPING',

  homeShippingTitle:
    'Free shipping on orders over $50',

  homeShippingDescription:
    'Receive your products quickly and safely.',

  homeShippingButton:
    'View shipping',

  homeBenefitsEyebrow:
    'SHOPSPHERE',

  homeBenefitsTitle:
    'Shop with confidence',

  homeBenefitReturnsDescription:
    'Manage your returns easily.',

  homeBenefitSupportDescription:
    'We are available to help you.',

  homeFinalCtaEyebrow:
    'EVERYTHING YOU NEED',

  homeFinalCtaDescription:
    'Explore our catalog and discover products selected for you.',

  homeHeroTitle:
    'Everything you need. All in one place.',

  homeHeroDescription:
    'Technology, accessories and selected products to accompany you every day.',

  homeHeroPrimaryButton:
    'View catalog',

  homeHeroSecondaryLink:
    'Explore products',

  homeHeroProductsLabel:
    'products available',

  homeHeroSupportLabel:
    'online support',

  homeHeroProductCategory:
    'FEATURED PRODUCT',

  homeFloatingSecureTitle:
    'Secure purchase',

  homeFloatingSecureDescription:
    'Protected payments',

  homeFloatingShippingTitle:
    'Fast shipping',

  homeFloatingShippingDescription:
    'Receive your products quickly',

  homeFeaturedEmpty:
    'No featured products available.',

  homeFeaturedEmptyButton:
    'View catalog',

  homeBenefitSecureTitle:
    'Secure purchase',

  homeBenefitSecureDescription:
    'Your information and payments are protected.',

  homeBenefitShippingTitle:
    'Fast shipping',

  homeBenefitReturnsTitle:
    'Easy returns',

  homeBenefitSupportTitle:
    'Online support',

  /*
   * FULFILLMENT PAGINATION
   */

  fulfillmentPreviousPageButton:
    'Previous',

  fulfillmentNextPageButton:
    'Next'
};

/*
 * ============================================================
 * TEXTOS QUE NO NECESITAN TRADUCCIÓN
 * ============================================================
 */

const SAME_IN_ENGLISH = new Set([
  'Total',
  'Subtotal',
  'Email',
  'Facebook',
  'Instagram',
  'TikTok',
  'WhatsApp',
  'Admin',
  'Audio',
  'Gaming',
  'Stock',
  'Newsletter',
  'Kanban',
  'Tracking',
  'Fulfillment',
  'Dashboard',
  'ShopSphere',
  'SHOPSPHERE',
  'ZenithHardware'
]);

/*
 * ============================================================
 * UTILIDADES
 * ============================================================
 */

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isUrlOrAssetList(text) {

  if (!text) {
    return false;
  }

  const value = text.trim();

  if (
    /^https?:\/\//i.test(value)
  ) {
    return true;
  }

  if (
    value.includes('https://') ||
    value.includes('http://')
  ) {
    return true;
  }

  return false;
}

function isOnlyNumbersOrSymbols(text) {

  if (!text) {
    return true;
  }

  return /^[\d\s.,:/+\-_%$€£¥()[\]{}#@&*'"<>|]+$/.test(
    text.trim()
  );
}

function shouldKeepOriginal(text) {

  const value =
    text
      ? text.trim()
      : '';

  if (!value) {
    return true;
  }

  if (isUrlOrAssetList(value)) {
    return true;
  }

  if (isOnlyNumbersOrSymbols(value)) {
    return true;
  }

  if (SAME_IN_ENGLISH.has(value)) {
    return true;
  }

  return false;
}

/*
 * ============================================================
 * EXTRACCIÓN
 * ============================================================
 */

async function extractTranslations() {

  console.log('');
  console.log('🔎 Buscando textos i18n...');
  console.log('');

  try {

    execSync(
      'npx ng extract-i18n --format=xlf --output-path=src/locale',
      {
        cwd: projectRoot,
        stdio: 'inherit'
      }
    );

  } catch (error) {

    console.error('');
    console.error(
      '❌ Angular no pudo extraer las traducciones.'
    );

    process.exit(1);
  }

  const generatedFile =
    path.join(
      localeDir,
      'messages.xlf'
    );

  if (!fs.existsSync(generatedFile)) {

    console.error('');
    console.error(
      '❌ Angular no generó messages.xlf'
    );

    process.exit(1);
  }

  fs.copyFileSync(
    generatedFile,
    extractedFile
  );

  fs.unlinkSync(
    generatedFile
  );

  return extractedFile;
}

/*
 * ============================================================
 * XML
 * ============================================================
 */

function createParser() {

  return new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_'
  });
}

function createBuilder() {

  return new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    format: true,
    indentBy: '  '
  });
}

function normalizeUnits(units) {

  if (!units) {
    return [];
  }

  return Array.isArray(units)
    ? units
    : [units];
}

/*
 * ============================================================
 * SOURCE
 * ============================================================
 */

function getSourceText(unit) {

  if (
    !unit ||
    unit.source === undefined
  ) {

    return '';
  }

  if (
    typeof unit.source === 'string'
  ) {

    return unit.source.trim();
  }

  if (
    typeof unit.source === 'object' &&
    unit.source['#text']
  ) {

    return unit.source['#text'].trim();
  }

  return '';
}

/*
 * ============================================================
 * TARGET
 * ============================================================
 */

function getTargetText(unit) {

  if (
    !unit ||
    unit.target === undefined
  ) {

    return '';
  }

  if (
    typeof unit.target === 'string'
  ) {

    return unit.target.trim();
  }

  if (
    typeof unit.target === 'object' &&
    unit.target['#text']
  ) {

    return unit.target['#text'].trim();
  }

  return '';
}

/*
 * ============================================================
 * DETECTAR SI NECESITA TRADUCCIÓN
 * ============================================================
 */

function needsTranslation(unit) {

  const source =
    getSourceText(unit);

  const target =
    getTargetText(unit);

  if (!source) {
    return false;
  }

  if (shouldKeepOriginal(source)) {
    return false;
  }

  if (!target) {
    return true;
  }

  if (source === target) {
    return true;
  }

  return false;
}

/*
 * ============================================================
 * TRADUCCIÓN GOOGLE CON RETRIES
 * ============================================================
 */

async function translateText(text) {

  for (
    let attempt = 0;
    attempt < MAX_RETRIES;
    attempt++
  ) {

    try {

      const result =
        await translate(
          text,
          {
            from: 'es',
            to: 'en'
          }
        );

      const translation =
        result &&
        result.text
          ? result.text.trim()
          : '';

      if (!translation) {

        throw new Error(
          'La API no devolvió una traducción válida.'
        );
      }

      return translation;

    } catch (error) {

      const message =
        error.message || String(error);

      const isRateLimit =
        message.includes('Too Many Requests') ||
        message.includes('429');

      if (
        attempt <
          MAX_RETRIES - 1
      ) {

        const delay =
          RETRY_DELAYS[attempt];

        console.warn('');
        console.warn(
          `⚠️ Google Translate rechazó la petición. Reintento ${attempt + 1}/${MAX_RETRIES} en ${delay / 1000}s...`
        );

        await sleep(delay);

        continue;
      }

      console.error('');
      console.error(
        `❌ No se pudo traducir: "${text}"`
      );

      console.error(
        isRateLimit
          ? 'Google Translate está limitando temporalmente las peticiones (429).'
          : message
      );

      return null;
    }
  }

  return null;
}

/*
 * ============================================================
 * OBTENER TRADUCCIÓN
 * ============================================================
 */

async function getTranslation(
  id,
  source
) {

  /*
   * Traducciones locales.
   */

  if (
    Object.prototype.hasOwnProperty.call(
      EN_TRANSLATIONS,
      id
    )
  ) {

    return EN_TRANSLATIONS[id];
  }

  /*
   * Textos que son iguales en inglés.
   */

  if (
    shouldKeepOriginal(source)
  ) {

    return source;
  }

  /*
   * Google Translate.
   */

  return await translateText(
    source
  );
}

/*
 * ============================================================
 * ACTUALIZAR METADATOS
 * ============================================================
 */

function updateMetadata(
  current,
  updated
) {

  if (
    updated['context-group']
  ) {

    current['context-group'] =
      updated['context-group'];
  }

  if (
    updated.note
  ) {

    current.note =
      updated.note;
  }
}

/*
 * ============================================================
 * MAIN
 * ============================================================
 */

async function main() {

  if (
    !fs.existsSync(
      englishFile
    )
  ) {

    console.error('');
    console.error(
      '❌ No existe:',
      englishFile
    );

    process.exit(1);
  }

  const extracted =
    await extractTranslations();

  const parser =
    createParser();

  const builder =
    createBuilder();

  const englishXml =
    fs.readFileSync(
      englishFile,
      'utf8'
    );

  const extractedXml =
    fs.readFileSync(
      extracted,
      'utf8'
    );

  const englishDocument =
    parser.parse(
      englishXml
    );

  const extractedDocument =
    parser.parse(
      extractedXml
    );

  const englishBody =
    englishDocument.xliff.file.body;

  const extractedBody =
    extractedDocument.xliff.file.body;

  const englishUnits =
    normalizeUnits(
      englishBody['trans-unit']
    );

  const extractedUnits =
    normalizeUnits(
      extractedBody['trans-unit']
    );

  const existingUnits =
    new Map(
      englishUnits.map(
        unit => [
          unit['@_id'],
          unit
        ]
      )
    );

  const newUnits = [];
  const changedUnits = [];
  const untranslatedUnits = [];

  /*
   * ==========================================================
   * ANALIZAR UNIDADES
   * ==========================================================
   */

  for (
    const unit of extractedUnits
  ) {

    const id =
      unit['@_id'];

    if (!id) {
      continue;
    }

    const source =
      getSourceText(unit);

    if (!source) {
      continue;
    }

    const existingUnit =
      existingUnits.get(id);

    if (!existingUnit) {

      newUnits.push(unit);

      continue;
    }

    const existingSource =
      getSourceText(
        existingUnit
      );

    if (
      existingSource !== source
    ) {

      changedUnits.push({
        current: existingUnit,
        updated: unit
      });

      continue;
    }

    if (
      needsTranslation(
        existingUnit
      )
    ) {

      untranslatedUnits.push({
        current: existingUnit,
        updated: unit
      });
    }
  }

  /*
   * ==========================================================
   * RESUMEN
   * ==========================================================
   */

  console.log('');

  console.log(
    `📦 Textos encontrados: ${extractedUnits.length}`
  );

  console.log(
    `📚 Traducciones existentes: ${englishUnits.length}`
  );

  console.log(
    `🆕 Textos nuevos: ${newUnits.length}`
  );

  console.log(
    `🔄 Textos modificados: ${changedUnits.length}`
  );

  console.log(
    `🇪🇸 Textos todavía en español: ${untranslatedUnits.length}`
  );

  console.log('');
  console.log(
    '🌎 Procesando traducciones...'
  );

  let failedTranslations = 0;
  let updatedTranslations = 0;

  /*
   * ==========================================================
   * PROCESAR NUEVOS
   * ==========================================================
   */

  for (
    const unit of newUnits
  ) {

    const id =
      unit['@_id'];

    const source =
      getSourceText(unit);

    const translation =
      await getTranslation(
        id,
        source
      );

    if (!translation) {

      failedTranslations++;

      /*
       * IMPORTANTE:
       * Conservamos el trans-unit.
       */

      unit.target =
        source;

      englishUnits.push(
        unit
      );

      continue;
    }

    unit.target =
      translation;

    englishUnits.push(
      unit
    );

    updatedTranslations++;
  }

  /*
   * ==========================================================
   * PROCESAR MODIFICADOS
   * ==========================================================
   */

  for (
    const item of changedUnits
  ) {

    const current =
      item.current;

    const updated =
      item.updated;

    const id =
      current['@_id'];

    const newSource =
      getSourceText(
        updated
      );

    const translation =
      await getTranslation(
        id,
        newSource
      );

    if (!translation) {

      failedTranslations++;

      continue;
    }

    current.source =
      updated.source;

    current.target =
      translation;

    updateMetadata(
      current,
      updated
    );

    updatedTranslations++;
  }

  /*
   * ==========================================================
   * SIN TRADUCIR
   * ==========================================================
   */

  for (
    const item of untranslatedUnits
  ) {

    const current =
      item.current;

    const updated =
      item.updated;

    const id =
      current['@_id'];

    const source =
      getSourceText(
        updated
      );

    const translation =
      await getTranslation(
        id,
        source
      );

    if (!translation) {

      failedTranslations++;

      continue;
    }

    current.source =
      updated.source;

    current.target =
      translation;

    updateMetadata(
      current,
      updated
    );

    updatedTranslations++;
  }

  /*
   * ==========================================================
   * GUARDAR
   * ==========================================================
   */

  englishBody['trans-unit'] =
    englishUnits;

  const updatedXml =
    builder.build(
      englishDocument
    );

  fs.writeFileSync(
    englishFile,
    updatedXml,
    'utf8'
  );

  fs.rmSync(
    extracted,
    {
      force: true
    }
  );

  /*
   * ==========================================================
   * RESULTADO
   * ==========================================================
   */

  console.log('');
  console.log(
    '✅ Archivo de traducciones actualizado.'
  );

  console.log(
    `📄 ${englishFile}`
  );

  console.log('');
  console.log(
    `✓ Traducciones actualizadas: ${updatedTranslations}`
  );

  if (
    failedTranslations > 0
  ) {

    console.log(
      `⚠️ Traducciones que fallaron: ${failedTranslations}`
    );

    console.log(
      'Las traducciones fallidas se conservaron temporalmente con su texto original.'
    );

  } else {

    console.log(
      '🎉 Todas las traducciones fueron procesadas correctamente.'
    );
  }

  console.log('');
}

main().catch(
  error => {

    console.error('');
    console.error(
      '❌ Error inesperado:'
    );

    console.error(
      error
    );

    process.exit(1);
  }
);