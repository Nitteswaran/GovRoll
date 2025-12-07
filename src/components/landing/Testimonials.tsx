import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

const testimonials = [
  {
    quote:
      '"Since implementing GovRoll, our payroll processing time has been reduced by 70%! Compliance has never been easier, and our team can focus on strategic initiatives instead of manual calculations. Highly recommend if you\'re looking to modernize your payroll operations!"',
    author: 'Emily R.',
    role: 'HR Director',
    rating: 5,
  },
  {
    quote:
      '"GovRoll has been a game-changer for our multi-location business. Their automated compliance features and multi-company management have significantly reduced our administrative burden and eliminated errors. The team is proactive, transparent, and really dedicated to our success."',
    author: 'Marcus L.',
    role: 'CFO',
    rating: 5,
  },
  {
    quote:
      '"I was amazed by the immediate impact GovRoll had on our payroll accuracy. Not only did they streamline our processes, but they also ensured we stayed compliant with all Malaysian regulations, leading to zero penalties. This platform truly knows how to make payroll management effortless."',
    author: 'Sophia T.',
    role: 'Operations Manager',
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Testimonials
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            What our clients say
          </h2>
          <p className="text-xl text-gray-600">
            Don't just take our word for it, see what the awesome people we work
            with have to say.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-gray-50 rounded-2xl p-8"
            >
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-6 text-lg">
                {testimonial.quote}
              </p>
              <div>
                <p className="font-semibold text-gray-900">
                  {testimonial.author}
                </p>
                <p className="text-sm text-gray-500">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

