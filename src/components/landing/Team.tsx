import { motion } from 'framer-motion'
import { Linkedin, Instagram, Github } from 'lucide-react'

const teamMembers = [
  {
    name: 'Nittes',
    role: 'CEO & Founder',
    description:
      'Nittes is the founder of GovRoll, and passionate about helping businesses streamline their payroll processes.',
    image: null,
    linkedin: 'https://www.linkedin.com/in/nittes',
    instagram: 'https://www.instagram.com/nitttees_/',
    github: 'https://github.com/Nitteswaran',
  },
]

export function Team() {
  return (
    <section id="about" className="py-24 bg-gray-50">
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
              Who you work with
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Team
            </h2>
            <p className="text-xl text-gray-600">
              Meet the team behind our success
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-8 max-w-md mx-auto">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300"
            >
              {member.image ? (
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <div className="w-24 h-24 bg-primary/30 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                </div>
              )}
              <div className="p-6">
                <div className="mb-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {member.name}
                  </h3>
                  <p className="text-sm text-gray-500">{member.role}</p>
                </div>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  {member.description}
                </p>
                <div className="flex space-x-3">
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <a
                    href={member.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
                    aria-label="GitHub"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

