import xml.etree.ElementTree as ET

INPUT = "src/locale/messages.xlf"
OUTPUT = "src/locale/messages.en.xlf"

translations = {
    "adminNavProducts": "Products",
    "adminNavFulfillment": "Fulfillment",
    "adminNavDashboard": "Dashboard",

    "dashboardTitle": "Dashboard",
    "dashboardDescription": "Sales and fulfillment metrics",
    "dashboardFulfillmentLink": "View Fulfillment →",
    "dashboardTotalOrders": "Total orders",
    "dashboardTotalRevenue": "Total revenue",
    "dashboardThisMonthRevenue": "Revenue this month",
    "dashboardAverageOrderValue": "Average order value",
    "dashboardAverageDeliveryTime": "Average delivery time",
    "dashboardOrdersByStatus": "Orders by status",
    "dashboardTopProducts": "Best-selling products",
    "dashboardNoSales": "There are not enough sales yet.",
    "dashboardUnits": "units",
    "dashboardCalculating": "Calculating metrics…",
    "dashboardMetricsError": "Metrics could not be loaded. Try reloading the page.",

    "fulfillmentTitle": "Fulfillment",
    "fulfillmentOrderCount": "of",
    "fulfillmentOrders": "orders",
    "fulfillmentKanbanView": "Kanban",
    "fulfillmentListView": "List",
    "fulfillmentSearchPlaceholder": "Search by ID, tracking number, customer name or email",
    "fulfillmentLoading": "Loading orders…",
    "fulfillmentBulkAdvance": "Advance",
    "fulfillmentSelectedOrders": "selected",
    "fulfillmentOrderNumber": "Order",
    "fulfillmentTracking": "Tracking",
    "fulfillmentViewDetails": "View details",
    "fulfillmentAdvanceTo": "Advance to",
    "fulfillmentCancel": "Cancel",
    "fulfillmentEmptyColumn": "No orders here",
    "fulfillmentTableOrder": "Order",
    "fulfillmentTableCustomer": "Customer",
    "fulfillmentTableTracking": "Tracking",
    "fulfillmentTableTotal": "Total",
    "fulfillmentTableStatus": "Status",
    "fulfillmentTableActions": "Actions",
    "fulfillmentMobileOrderNumber": "Order #",
    "fulfillmentListViewDetails": "View details",
    "fulfillmentListAdvance": "Advance",
    "fulfillmentListCancel": "Cancel",
    "fulfillmentNoResults": "No orders match the search",
    "fulfillmentPreviousPage": "Previous",
    "fulfillmentPageInfo": "Page",
    "fulfillmentPageOf": "of",
    "fulfillmentTotalOrders": "Total:",
    "fulfillmentOrdersPagination": "orders",
    "fulfillmentNextPage": "Next",
    "fulfillmentModalOrderNumber": "Order #",
    "fulfillmentCloseModal": "Close",
    "fulfillmentModalDate": "Placed on",
    "fulfillmentModalTracking": "Tracking number:",
    "fulfillmentModalCustomer": "Customer:",
    "fulfillmentModalAddress": "Address:",
    "fulfillmentMissingItems": "⚠️ The backend is not sending the products for this purchase.",
    "fulfillmentShippingCost": "Shipping cost",
    "fulfillmentFreeShipping": "Free",
    "fulfillmentGrandTotal": "Total",

    "productFormBack": "Back to products",
    "productFormEditTitle": "Edit product",
    "productFormNewTitle": "New product",
    "productFormLoading": "Loading…",
    "productFormName": "Name",
    "productFormCategory": "Category",
    "productFormCategoryPlaceholder": "Select a category",
    "productFormDescription": "Description",
    "productFormPrice": "Price (USD)",
    "productFormStock": "Stock",
    "productFormImageUrl": "Main image URL",
    "productFormImageUrlPlaceholder": "https://…",
    "productFormGallery": "Additional gallery images (URLs)",
    "productFormGalleryPlaceholder": "Enter URLs separated by commas or line breaks",
    "productFormShippingInfo": "Shipping information (Shipping Info)",
    "productFormShippingInfoPlaceholder": "E.g. Shipping available nationwide...",
    "productFormSaving": "Saving…",
    "productFormSaveChanges": "Save changes",
    "productFormCreate": "Create product",
    "productFormCancel": "Cancel",

    "productListTitle": "Products",
    "productListCatalogCount": "products in the catalog",
    "productListNewProduct": "New product",
    "productListLoading": "Loading products…",
    "productListProduct": "Product",
    "productListCategory": "Category",
    "productListPrice": "Price",
    "productListStock": "Stock",
    "productListActions": "Actions",
    "productListEdit": "Edit",
    "productListDelete": "Delete",
    "productListPrevious": "Previous",
    "productListPageOf": "of",
    "productListNext": "Next",

    "confirmDialogCancel": "Cancel",

    "loginTitle": "Sign in",
    "loginDemoNote": "This demo does not validate passwords — any password works. The email does matter: <x id=\"START_TAG_CODE\" ctype=\"x-code\" equiv-text=\"&lt;code&gt;\"/>admin@shopsphere.com<x id=\"CLOSE_TAG_CODE\" ctype=\"x-code\" equiv-text=\"&lt;/code&gt;\"/> signs in as an administrator, any other email signs in as a customer.",
    "loginEmailLabel": "Email",
    "loginEmailError": "Enter a valid email address.",
    "loginPasswordLabel": "Password",
    "loginPasswordError": "Use at least 6 characters.",
    "loginSubmitting": "Signing in…",
    "loginSubmit": "Sign in",
    "loginContinueWithoutAccount": "Continue browsing without an account",

    "cartTitle": "Your cart",
    "cartEmptyTitle": "There is nothing here yet",
    "cartEmptyDescription": "Products you add from the catalog will appear in this list.",
    "cartViewCatalog": "View catalog",
    "cartPricePerUnit": "per unit",
    "cartDecreaseQuantity": "Remove one unit",
    "cartIncreaseQuantity": "Add one unit",
    "cartRemoveItem": "Remove",
    "cartSummary": "Summary",
    "cartItems": "items",
    "cartShipping": "Shipping",
    "cartShippingCalculation": "Calculated at checkout",
    "cartCheckout": "Checkout",

    "detailBack": "Back to catalog",
    "detailOutOfStock": "Out of stock for now",
    "detailFewUnits": "Only <x id=\"INTERPOLATION\" equiv-text=\"{{ p.stock }}\"/> units left",
    "detailAvailableUnits": "<x id=\"INTERPOLATION\" equiv-text=\"{{ p.stock }}\"/> units available",
    "detailDecreaseQuantity": "Remove one unit",
    "detailIncreaseQuantity": "Add one unit",
    "detailAddToCart": "Add to cart",
    "detailProductNotFound": "That product is no longer available",
    "detailProductNotFoundDescription": "It may have been removed from the catalog. See what else is available.",
    "detailViewCatalog": "View catalog",

    "catalogTitle": "Everything on the shelf",
    "catalogDescription": "Shoes, clothing, electronics and things for your home. Straightforward prices, no hassle.",
    "catalogSearchLabel": "Search products",
    "catalogSearchPlaceholder": "Search the catalog",
    "catalogCategoryLabel": "Category",
    "catalogAllCategories": "All categories",
    "catalogSortLabel": "Sort",
    "catalogSuggestedOrder": "Recommended order",
    "catalogPriceAsc": "Lowest price first",
    "catalogPriceDesc": "Highest price first",
    "catalogNameOrder": "By name",
    "catalogItemCount": "<x id=\"INTERPOLATION\" equiv-text=\"{{ total() }}\"/> items",
    "catalogNoResults": "Nothing matches that search",
    "catalogNoResultsDescription": "Try another word or remove the filters to see the full catalog.",
    "catalogOutOfStock": "Out of stock",
    "catalogSoldOut": "Sold out",
    "catalogAdd": "Add",
    "catalogPagination": "Catalog pagination",
    "catalogPrevious": "Previous",
    "catalogPageState": "<x id=\"INTERPOLATION\" equiv-text=\"{{ page() }}\"/> of <x id=\"INTERPOLATION_1\" equiv-text=\"{{ totalPages }}\"/>",
    "catalogNext": "Next",

    "checkoutTitle": "Checkout",
    "checkoutEmptyTitle": "There is nothing to pay for",
    "checkoutEmptyDescription": "Add a product to your cart before continuing.",
    "checkoutViewCatalog": "View catalog",
    "checkoutShippingData": "Shipping information",
    "checkoutFullName": "Full name",
    "checkoutFullNameError": "Enter your first and last name.",
    "checkoutAddress": "Address",
    "checkoutAddressError": "Shipping address is required.",
    "checkoutCity": "City",
    "checkoutCityError": "City is required.",
    "checkoutPayment": "Payment",
    "checkoutCardNumber": "Card number",
    "checkoutCardNumberPlaceholder": "16 digits",
    "checkoutCardNumberError": "The card must have 16 numbers, without spaces.",
    "checkoutConfirming": "Confirming…",
    "checkoutConfirm": "Confirm purchase",
    "checkoutOrderSummary": "Your order",
    "checkoutSubtotal": "Subtotal",
    "checkoutShipping": "Shipping",
    "checkoutFreeShipping": "Free",
    "checkoutTotal": "Total",

    "returnsEyebrow": "Help",
    "returnsTitle": "Returns Policy",
    "returns30DaysTitle": "30-day returns",
    "returns30DaysDescription": "If you are not completely satisfied with your purchase, you can return it within 30 days of delivery for a full refund. Items must be unused, in their original packaging and in the same condition in which you received them.",
    "returnsHowToTitle": "How to start a return",
    "returnsHowToDescription": "Send us an email to ",
    "returnsRefundsTitle": "Refunds",
    "returnsRefundsDescription": "Once we receive and inspect your return, we will process your refund to the original payment method. This usually takes between 5 and 7 business days.",
    "returnsExceptionsTitle": "Exceptions",
    "returnsExceptionsDescription": "Clearance items and gift cards are not eligible for returns. Damaged or defective products can be exchanged or refunded at no cost; simply contact us and we will take care of it.",
    "returnsQuickHelpTitle": "Need to check your order number?",
    "returnsQuickHelpSubtitle": "Check your recent purchases to find the details.",
    "returnsMyOrders": "My orders →",

    "shippingEyebrow": "Help",
    "shippingTitle": "Shipping and Delivery",
    "shippingCostsTitle": "Shipping Costs",
    "shippingCostsDescription": "Purchases over $50,000 qualify for free shipping. Orders below that amount have a flat shipping fee shown at checkout before payment.",
    "shippingTimesTitle": "Delivery Times",
    "shippingTimesDescription": "Most orders arrive within 3 to 5 business days after processing. Delivery times may vary depending on location; you can check an estimate for your ZIP code on any product page.",
    "shippingTrackingTitle": "Order Tracking",
    "shippingTrackingDescription": "Once your order has been shipped, you can check its status at any time from <x id=\"START_LINK\" ctype=\"x-a\" equiv-text=\"&lt;a routerLink=&quot;/pedidos&quot; class=&quot;policy-link&quot;&gt;\"/> My orders <x id=\"CLOSE_LINK\" ctype=\"x-a\" equiv-text=\"&lt;/a&gt;\"/>.",
    "shippingInstallmentsTitle": "Installments",
    "shippingInstallmentsDescription": "Eligible purchases can be split into up to 6 interest-free installments at checkout.",
    "shippingQuickHelpTitle": "Looking for something to buy?",
    "shippingQuickHelpSubtitle": "Remember that purchases over $50,000 qualify for free shipping!",
    "shippingStartShopping": "Start shopping →",

    "faqEyebrow": "Help and Support",
    "faqTitle": "Frequently Asked Questions",
    "faqSearchPlaceholder": "Search questions (e.g. shipping, returns)...",
    "faqNoResults": "No matching questions were found. Try another term or contact us below!",
    "faqSupportTitle": "Still have questions?",
    "faqSupportDescription": "Can't find what you're looking for? Contact our support team directly.",
    "faqContactSupport": "Contact support →",

    "homeTitle": "Welcome to ShopSphere",
    "homeDescription": "Discover the best products in technology, clothing, home goods and more. Your next purchase is just one click away.",
    "homeCatalogButton": "View Catalog",

    "branchesEyebrow": "Help",
    "branchesTitle": "Where We Operate",
    "branchesIntroduction": "ShopSphere operates as a 100% digital brand — we do not have retail stores open to the public. You can explore our full catalog online at any time, and every order is shipped directly to your door.",
    "branchesHeadOffice": "Head Office",
    "branchesLogisticsHub": "ShopSphere Logistics Hub — New York, NY",
    "branchesMapTitle": "Head Office Location Map - New York",
    "branchesMapNotice": "* The warehouse location is strictly for logistics operations and is not open to the public.",
    "branchesQuickHelpTitle": "Ready to explore our catalog?",
    "branchesQuickHelpSubtitle": "Discover our products available for online purchase.",
    "branchesOnlineShopping": "Shop online →",

    "termsEyebrow": "Help",
    "termsTitle": "Terms and Conditions",
    "termsIntroduction": "Welcome to ShopSphere. By using this site and placing an order, you accept the terms detailed below. This is a practice project; these terms are provided for demonstration purposes only.",
    "termsOrdersPaymentsTitle": "1. Orders and Payments",
    "termsOrdersPaymentsDescription": "Placing an order constitutes an offer to purchase, which we may accept or reject (for example, if an item is out of stock).",
    "termsShippingTitle": "2. Shipping",
    "termsShippingDescription": "Delivery times are estimates and not guarantees. The risk of loss transfers to you once the order is delivered to the shipping address provided.",
    "termsReturnsTitle": "3. Returns",
    "termsReturnsDescription": "See our <x id=\"START_LINK\" ctype=\"x-a\" equiv-text=\"&lt;a\"/>",
    "termsAccountResponsibilityTitle": "4. Account Responsibility",
    "termsAccountResponsibilityDescription": "You are responsible for keeping your account credentials secure and for all activity that occurs under your account.",
    "termsModificationsTitle": "5. Modifications",
    "termsModificationsDescription": "We may update these terms from time to time. Continued use of the site means that you accept the current version.",
    "termsQuickHelpTitle": "Have a question?",
    "termsQuickHelpSubtitle": "Check our FAQ or contact our team for assistance.",
    "termsVisitFaq": "Visit FAQ →",

    "orderDetailLoading": "Loading order details…",
    "orderDetailBack": "← Back to my orders",
    "orderDetailConfirmation": "Order Confirmation",
    "orderDetailNumber": "Order #<x id=\"INTERPOLATION\" equiv-text=\"{{ o.id }}\"/>",
    "orderDetailDate": "Placed on <x id=\"INTERPOLATION\" equiv-text=\"{{ o.createdAt | date:&apos;d MMM yyyy, HH:mm&apos; }}\"/>",
    "orderDetailCancelled": "This order has been cancelled.",
    "orderDetailTrackingNumber": "Tracking number:",
    "orderDetailShipping": "Shipping",
    "orderDetailFreeShipping": "Free",
    "orderDetailTotal": "Total",
    "orderDetailNotFound": "Order not found",
    "orderDetailBackToOrders": "Back to my orders",

    "ordersTitle": "My orders",
    "ordersLoading": "Loading your orders…",
    "ordersEmptyTitle": "No orders yet",
    "ordersEmptyDescription": "Your purchases will be recorded here.",
    "ordersViewCatalog": "View catalog",
    "ordersOrderNumber": "Order <x id=\"INTERPOLATION\" equiv-text=\"{{ order.id }}\"/>",
    "ordersTrackingInfo": "<x id=\"INTERPOLATION\" equiv-text=\"{{ order.createdAt | date:&apos;d MMM y, HH:mm&apos; }}\"/> · tracking <x id=\"INTERPOLATION_1\" equiv-text=\"{{ order.trackingNumber }}\"/>",

    "newsletterTitle": "Newsletter",
    "newsletterDescription": "Subscribe to receive news about exclusive discounts and new products.",
    "newsletterSuccess": "Thanks for subscribing! 🎉",
    "newsletterEmailLabel": "Email",
    "newsletterEmailPlaceholder": "Enter your email...",
    "newsletterSubmit": "Send",
    "footerCategories": "Categories",
    "footerHelp": "Help",
    "footerContact": "Contact",
    "footerBusinessHours": "Mon to Fri, 9 AM to 6 PM",
    "socialInstagram": "Instagram",
    "socialFacebook": "Facebook",
    "socialTikTok": "TikTok",
    "footerCopyright": "© <x id=\"INTERPOLATION\" equiv-text=\"{{ currentYear }}\"/> ShopSphere. All rights reserved.",
    "footerDevelopedWith": "Developed with Angular",
    "whatsappChat": "Chat on WhatsApp",

    "brandName": "ShopSphere",
    "navHome": "Home",
    "navCatalog": "Catalog",
    "navOrders": "My orders",
    "navAdmin": "Admin",
    "navLogout": "Log out",
    "navLogin": "Sign in",
    "navCart": "Cart <x id=\"START_TAG_SPAN\" ctype=\"x-span\" equiv-text=\"&lt;span class=&quot;navbar__count&quot;&gt;\"/> <x id=\"INTERPOLATION\" equiv-text=\"{{ cart.itemCount() }}\"/> <x id=\"CLOSE_TAG_SPAN\" ctype=\"x-span\" equiv-text=\"&lt;/span&gt;\"/>",
}


ns = {"x": "urn:oasis:names:tc:xliff:document:1.2"}

ET.register_namespace("", ns["x"])

tree = ET.parse(INPUT)
root = tree.getroot()

file_node = root.find("x:file", ns)

if file_node is None:
    raise RuntimeError("No se encontró el elemento <file> en el XLIFF.")

file_node.set("source-language", "es")
file_node.set("target-language", "en")

for unit in file_node.findall(".//x:trans-unit", ns):
    unit_id = unit.get("id")

    if unit_id not in translations:
        raise RuntimeError(
            f"Falta traducción para el ID: {unit_id}"
        )

    old_target = unit.find("x:target", ns)

    if old_target is not None:
        unit.remove(old_target)

    target = ET.Element(f"{{{ns['x']}}}target")

    # Para traducciones que contienen elementos <x>,
    # copiamos el contenido XML manualmente.
    value = translations[unit_id]

    if "<x " in value:
        fragments = value.split("<x ")
        target.text = fragments[0]

        for fragment in fragments[1:]:
            xml_fragment, text_after = fragment.split("/>", 1)

            x_element = ET.fromstring(
                f"<x {xml_fragment}/>",
            )

            target.append(x_element)
            x_element.tail = text_after

    else:
        target.text = value

    unit.append(target)

tree.write(
    OUTPUT,
    encoding="UTF-8",
    xml_declaration=True
)

print(f"✅ Archivo generado: {OUTPUT}")
print(f"✅ Traducciones: {len(translations)}")
