import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import Image from 'next/image'

// Import all logos from the local assets directory
import googleLogo from '@/assets/logos/google.svg'
import microsoftLogo from '@/assets/logos/microsoft.svg'
import amazonLogo from '@/assets/logos/amazon.svg'
import metaLogo from '@/assets/logos/meta.svg'
import tcsLogo from '@/assets/logos/tcs.svg'
import infosysLogo from '@/assets/logos/infosys.svg'
import wiproLogo from '@/assets/logos/wipro.svg'
import hcltechLogo from '@/assets/logos/hcltech.svg'
import zomatoLogo from '@/assets/logos/zomato.svg'
import swiggyLogo from '@/assets/logos/swiggy.svg'
import nykaaLogo from '@/assets/logos/nykaa.svg'
import olaLogo from '@/assets/logos/ola.svg'
import paytmLogo from '@/assets/logos/paytm.svg'
import urbanCompanyLogo from '@/assets/logos/urban_company.png'

const COMPANIES = [
  { name: 'Google', src: googleLogo, color: '#4285F4', needsInvert: false },
  { name: 'Microsoft', src: microsoftLogo, color: '#00A4EF', needsInvert: true },
  { name: 'Amazon', src: amazonLogo, color: '#FF9900', needsInvert: true },
  { name: 'Meta', src: metaLogo, color: '#0668E1', needsInvert: true },
  { name: 'TCS', src: tcsLogo, color: '#FFFFFF', needsInvert: true },
  { name: 'Infosys', src: infosysLogo, color: '#0076AB', needsInvert: false },
  { name: 'Wipro', src: wiproLogo, color: '#7F3F98', needsInvert: false },
  { name: 'HCLTech', src: hcltechLogo, color: '#0070AD', needsInvert: false },
  { name: 'Zomato', src: zomatoLogo, color: '#CB202D', needsInvert: false },
  { name: 'Swiggy', src: swiggyLogo, color: '#FC8019', needsInvert: false },
  { name: 'Nykaa', src: nykaaLogo, color: '#FC2779', needsInvert: false },
  { name: 'Ola', src: olaLogo, color: '#FFFFFF', needsInvert: true },
  { name: 'Paytm', src: paytmLogo, color: '#00B9F1', needsInvert: true },
  { name: 'Urban Company', src: urbanCompanyLogo, color: '#FFFFFF', needsInvert: true },
]

export const MNCWall = () => {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!scrollRef.current) return

    const scrollWidth = scrollRef.current.scrollWidth
    const duration = 60 // Even slower, more elite feel

    gsap.to(scrollRef.current, {
      x: `-${scrollWidth / 2}px`,
      duration,
      ease: 'none',
      repeat: -1,
    })
  }, [])

  return (
    <div className="relative w-full py-20 overflow-hidden bg-[#050505]">
      {/* Premium Glass Overlays */}
      <div className="absolute inset-y-0 left-0 w-64 z-10 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-64 z-10 bg-gradient-to-l from-[#050505] via-[#050505]/80 to-transparent pointer-events-none" />

      <div className="flex flex-col gap-12">
        <div className="px-6 text-center space-y-4">
          <h2 className="text-4xl font-bold tracking-tight text-white/90">
            Trusted by the world's <span className="text-blue-500">most innovative</span> companies
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-white/40 font-medium">
            Join the elite club of talent working at global tech giants and Indian unicorns.
          </p>
        </div>

        <div className="relative flex whitespace-nowrap group">
          <div ref={scrollRef} className="flex gap-24 items-center px-10">
            {[...COMPANIES, ...COMPANIES].map((company, i) => (
              <div
                key={`${company.name}-${i}`}
                className="flex flex-col items-center gap-4 group/logo transition-all duration-700 hover:scale-110"
              >
                <div className="relative w-20 h-20 flex items-center justify-center p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-500 shadow-2xl backdrop-blur-sm overflow-hidden group/card">
                  {/* Glow Effect */}
                  <div 
                    className="absolute inset-0 transition-opacity duration-700 opacity-0 group-hover/logo:opacity-10 blur-xl"
                    style={{ backgroundColor: company.color }}
                  />
                  
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                      src={company.src}
                      alt={company.name}
                      width={64}
                      height={64}
                      className={`
                        max-w-full max-h-full object-contain transition-all duration-700
                        ${company.needsInvert ? 'invert brightness-200' : ''}
                        grayscale group-hover/logo:grayscale-0 
                        opacity-40 group-hover/logo:opacity-100
                      `}
                    />
                  </div>
                </div>
                <span className="text-sm font-bold uppercase tracking-[0.2em] text-white/20 group-hover/logo:text-white/60 transition-all duration-500 font-mono">
                  {company.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
