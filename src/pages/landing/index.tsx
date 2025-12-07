import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Brands } from '@/components/landing/Brands'
import { Features } from '@/components/landing/Features'
import { Team } from '@/components/landing/Team'
import { FAQ } from '@/components/landing/FAQ'
import { CaseStudies } from '@/components/landing/CaseStudies'
import { Testimonials } from '@/components/landing/Testimonials'
import { Footer } from '@/components/landing/Footer'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Brands />
      <Features />
      <Team />
      <FAQ />
      <CaseStudies />
      <Testimonials />
      <Footer />
    </div>
  )
}

