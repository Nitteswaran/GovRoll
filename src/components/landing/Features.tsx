import { motion } from 'framer-motion'
import { Calculator, Users, FileCheck, ArrowRight, Clock, Send, Code } from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  {
    icon: Calculator,
    title: 'Automated Payroll Processing',
    description:
      'Streamline your payroll calculations with our intelligent automation. We understand the complexity of Malaysian tax regulations and compliance requirements. With our finger on the pulse of the latest EPF, SOCSO, and PCB updates, we create seamless processes that ensure accuracy and save time.',
    link: '#',
  },
  {
    icon: FileCheck,
    title: 'Compliance Management',
    description:
      "Stay ahead of regulatory requirements. Our comprehensive compliance system ensures visibility to the right submissions, at the right time, with the right documentation. Say goodbye to compliance headaches – we're all about maximizing peace of mind.",
    link: '#',
  },
  {
    icon: Users,
    title: 'Employee Management',
    description:
      "Employee data management is the heartbeat of efficient payroll. Our innovative system fosters an environment that keeps your employee records organized and accessible. We're in the business of building efficiency, not just managing data.",
    link: '#',
  },
  {
    icon: Code,
    title: 'AI-Powered Payroll & HR Assistant',
    description:
      'We are building an AI layer on top of GovRoll that uses retrieval-augmented generation to understand your policies, past payroll runs, and Malaysian regulations. This assistant will help answer complex payroll questions, surface the right information instantly, and automate repetitive HR and employer workflows – making every ringgit you invest in GovRoll work harder for you.',
    link: '#',
  },
  {
    icon: Clock,
    title: 'Employee Clock In / Out Portal',
    description:
      'Employees can securely log in to GovRoll to clock in and out of work, giving you accurate, real-time attendance data that feeds directly into payroll – no more manual time tracking or spreadsheets.',
    link: '#',
  },
  {
    icon: Send,
    title: 'Employer Control & Smart Report Delivery',
    description:
      'Employers maintain complete control over employee access and data, and can send payslips and compliance-ready reports to employees directly through GovRoll with just a few clicks.',
    link: '#',
  },
]

export function Features() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  } as const

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut' as const,
      },
    },
  } as const

  return (
    <section id="features" className="py-24 relative z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            What we do
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Features
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Propel Your Payroll with Proven Expertise
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="group cursor-pointer"
              >
                <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-primary/50 hover:shadow-xl transition-all duration-300 h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                      <Icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  <Link
                    to={feature.link}
                    className="text-primary font-medium hover:underline inline-flex items-center"
                  >
                    Learn more
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

