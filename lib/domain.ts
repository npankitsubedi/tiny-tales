export const ORDER_STATUSES = [
    "PENDING",
    "CONFIRMED",
    "PACKED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELED",
    "RETURNED",
] as const

export type OrderStatusValue = (typeof ORDER_STATUSES)[number]

export const PRODUCT_CATEGORIES = [
    "NEWBORN",
    "BOYS",
    "GIRLS",
    "MATERNITY",
] as const

export type ProductCategoryValue = (typeof PRODUCT_CATEGORIES)[number]
