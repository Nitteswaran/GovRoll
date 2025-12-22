import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'
import logo from '@/assets/logo.png'
import dashboardVideo from '@/assets/dashboard_video.mp4'



export function Hero() {
  const navigate = useNavigate()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
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
    <section className="relative pt-12 pb-20 md:pt-40 md:pb-32 overflow-hidden">

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.div
              variants={itemVariants}
              className="md:hidden flex justify-center mb-8"
            >
              <img src={logo} alt="GovRoll" className="h-16 w-auto object-contain" />
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium"
            >
              Welcome to GovRoll!
            </motion.div>


            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
            >
              Streamline Your Payroll Management,{' '}
              <span className="text-primary">One Click at a Time.</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl"
            >
              We're not just a payroll software—we're your ticket to compliance
              excellence and operational efficiency. With Malaysia's most
              comprehensive payroll solution, your business has limitless
              potential to manage employees, calculate taxes, and ensure
              regulatory compliance. And we're here to make that happen.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4"
            >
              <InteractiveHoverButton
                onClick={() => navigate('/register')}
                text="Get Started"
                className="w-40"
              />
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/login')}
              >
                Book a Demo
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto object-contain"
                >
                  <source src={dashboardVideo} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
    </section>
  )
}

