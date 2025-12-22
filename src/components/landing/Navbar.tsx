import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import logo from '@/assets/logo.png'
import { NavBar } from '@/components/ui/tubelight-navbar'
import { User, FileText, Zap, Home } from 'lucide-react'

export function Navbar() {
  const navigate = useNavigate()

  const navLinks = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'About', url: '#about', icon: User },
    { name: 'Features', url: '#features', icon: Zap },
    { name: 'FAQ', url: '#faq', icon: FileText }
  ]

  const handleNavClick = (href: string) => {
    if (href === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (href.startsWith('#')) {
      const id = href.slice(1)
      const element = document.getElementById(id)
      if (element) {
        const offset = 80
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
        const offsetPosition = elementPosition - offset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        })
      }
    } else {
      navigate(href)
    }
  }

  return (
    <NavBar
      items={navLinks}
      onItemClick={handleNavClick}
      header={
        <Link to="/" className="hidden md:flex items-center shrink-0">
          <motion.img
            src={logo}
            alt="GovRoll"
            className="h-auto w-40 object-contain"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          />
        </Link>
      }
    />
  )
}


