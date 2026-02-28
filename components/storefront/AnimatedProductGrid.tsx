"use client"

import { motion } from "framer-motion"
import ProductCard from "@/components/storefront/ProductCard"
import type { Variants } from "framer-motion"

type Product = {
    id: string
    title: string
    basePrice: number
    category: string
    totalStock: number
}

const containerVariants: Variants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.06, delayChildren: 0.1 }
    }
}

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } // cubic-bezier easeOut
    }
}

export default function AnimatedProductGrid({ products }: { products: Product[] }) {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4"
        >
            {products.map(product => (
                <motion.div key={product.id} variants={itemVariants}>
                    <ProductCard {...product} />
                </motion.div>
            ))}
        </motion.div>
    )
}
