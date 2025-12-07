import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import logo from '@/assets/logo.png'
import { Instagram, Linkedin, Github, MessageCircle } from 'lucide-react'

const quickLinks = [
  { label: 'About us', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Blog', href: '#blog' },
  { label: 'Contact', href: '#contact' },
]

const socialLinks = [
  { icon: Linkedin, href: 'https://www.linkedin.com/in/nittes', label: 'LinkedIn' },
  { icon: Instagram, href: 'https://www.instagram.com/nitttees_/', label: 'Instagram' },
  { icon: Github, href: 'https://github.com/Nitteswaran', label: 'GitHub' },
  { icon: MessageCircle, href: 'https://wa.me/60124760876', label: 'WhatsApp' },
]

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand & Newsletter */}
          <div className="md:col-span-1">
            <Link to="/" className="inline-block mb-6">
              <img src={logo} alt="GovRoll" className="h-10 w-auto" />
            </Link>
            <p className="text-gray-400 mb-6">
              Join our newsletter to stay up to date.
            </p>
            <form className="space-y-3">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
              <Button type="submit" className="w-full">
                Subscribe
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-3">
              By subscribing you agree to with our Privacy Policy and provide
              consent to receive updates from our company.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-gray-400">
              <li>
                <a
                  href="tel:+60124760876"
                  className="hover:text-white transition-colors"
                >
                  +60 12 476 0876
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/60124760876"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp: +60 12 476 0876
                </a>
              </li>
              <li>
                <a
                  href="mailto:spnittes@gmail.com"
                  className="hover:text-white transition-colors"
                >
                  spnittes@gmail.com
                </a>
              </li>
              <li className="pt-2">
                <p>Universiti Kebangsaan Malaysia</p>
                <p>43600 UKM Bangi</p>
                <p>Selangor, Malaysia</p>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold mb-4">Follow us</h3>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-primary flex items-center justify-center transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            © 2024 GovRoll - All rights reserved
          </p>
          <div className="flex space-x-6 text-sm text-gray-400">
            <Link to="#" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="#" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

