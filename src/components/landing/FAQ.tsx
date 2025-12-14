import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'


const faqs = [
  {
    question: 'What features does GovRoll offer?',
    answer:
      'GovRoll specializes in comprehensive payroll management including automated salary calculations, EPF/SOCSO/PCB deductions, compliance reporting, employee management, payslip generation, and regulatory submissions. We tailor our features to meet the unique needs of each business, ensuring a customized approach to streamline your payroll operations.',
  },
  {
    question: 'How do you ensure compliance with Malaysian regulations?',
    answer:
      'Compliance is measured through continuous monitoring of EPF, SOCSO, LHDN, and other regulatory body requirements. We track updates to tax rates, contribution limits, and submission deadlines. Our system provides detailed compliance reports and alerts to ensure you never miss a deadline. We also focus on accuracy metrics such as calculation precision and audit trail completeness. Our team provides detailed reports to track compliance status and assess your payroll operations.',
  },
  {
    question: 'Can GovRoll handle multiple companies and branches?',
    answer:
      'Yes, our Premium plan includes multi-company management capabilities. You can manage payroll for multiple companies, branches, or subsidiaries from a single dashboard. We stay up-to-date with the latest Malaysian payroll regulations to ensure each entity remains compliant while maintaining separate records and reporting.',
  },
  {
    question: 'What makes GovRoll different from other payroll software?',
    answer:
      "What sets us apart is our personalized approach and commitment to understanding your business's unique payroll needs. GovRoll combines automation with deep knowledge of Malaysian regulations to create solutions that save time and ensure accuracy. We prioritize transparency and communication, keeping you informed at every step. Additionally, our team continuously adapts to the ever-changing regulatory landscape to keep your payroll operations ahead of the curve.",
  },
  {
    question: 'How do we get started?',
    answer:
      "Getting started is easy! Simply sign up for a free account through our website, or contact us for a demo. We'll schedule an initial consultation to discuss your payroll requirements, company structure, and compliance needs. From there, we'll help you set up your account and import your employee data. Once you're ready, we'll guide you through your first payroll run and start making payroll management effortless for your business.",
  },
  {
    question: 'Is GovRoll pricing really worth it?',
    answer:
      "Yes. Our goal is to make every sen you spend on GovRoll come back to you in saved time, reduced errors, and stronger compliance. Beyond the core platform, we're building AI-powered capabilities – including a retrieval-augmented assistant and an agent that automates routine HR and employer tasks – so you get faster answers, fewer manual steps, and more strategic bandwidth for your team.",
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            FAQs
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">We are often asked...</p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4 mb-12">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 pr-4">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 py-4 text-gray-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center relative z-20"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Still have questions?
          </h3>
          <p className="text-gray-600 mb-6">
            Contact one of our experts to find out how we can help your business
            today.
          </p>
          <a
            href="https://wa.me/60124760876"
            target="_blank"
            className={buttonVariants({ size: 'lg' })}
          >
            Get in touch
          </a>
        </motion.div>
      </div>
    </section>
  )
}

