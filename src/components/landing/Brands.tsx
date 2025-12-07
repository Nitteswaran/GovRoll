import { motion } from 'framer-motion'

const brands = [
  'Company 1',
  'Company 2',
  'Company 3',
  'Company 4',
  'Company 5',
]

export function Brands() {
  return (
    <section className="py-16 bg-white border-y border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-2xl font-semibold text-gray-400 mb-12"
        >
          Trusted by leading companies
        </motion.h2>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {brands.map((brand, index) => (
            <motion.div
              key={brand}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-gray-400 font-medium text-lg hover:text-primary transition-colors"
            >
              {brand}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

