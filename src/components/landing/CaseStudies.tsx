import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const caseStudies = [
  {
    title: 'TechCorp Malaysia',
    description:
      'Streamlining Payroll for a Growing Tech Company with 200+ Employees',
    tags: ['EPF', 'SOCSO', 'PCB'],
    image: null,
  },
  {
    title: 'Retail Chain Solutions',
    description:
      'Multi-location payroll management for a retail chain with 15 branches across Malaysia.',
    tags: ['Multi-Company', 'Automation'],
    image: null,
  },
  {
    title: 'Manufacturing Excellence',
    description:
      'Comprehensive payroll and compliance solution for a manufacturing company with shift workers.',
    tags: ['Shift Pay', 'Compliance'],
    image: null,
  },
]

export function CaseStudies() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-8 md:mb-0"
          >
            <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              Case studies
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              See our work
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl">
              Welcome to the spotlight, where GovRoll's magic touches down,
              turning complex payroll into streamlined operations.
            </p>
          </motion.div>
          <motion.a
            href="#case-studies"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-primary font-medium hover:underline inline-flex items-center"
          >
            View all
            <ArrowRight className="ml-2 w-4 h-4" />
          </motion.a>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {caseStudies.map((study, index) => (
            <motion.div
              key={study.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group cursor-pointer"
            >
              <Link to="#">
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-full">
                  {study.image ? (
                    <img
                      src={study.image}
                      alt={study.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-primary/30 rounded-full flex items-center justify-center mx-auto mb-2">
                          <svg
                            className="w-8 h-8 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500">Case Study</p>
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {study.title}
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {study.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {study.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center text-primary font-medium group-hover:underline">
                      View project
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

