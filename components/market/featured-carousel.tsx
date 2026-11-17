'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Clock3, MapPin, Truck } from 'lucide-react'
import { featuredFlyers } from '@/lib/featured-flyers'
import type { FeaturedFlyer } from '@/lib/featured-flyers'

type FlyerCarouselProps = {
  flyers?: FeaturedFlyer[]
  title?: string
  description?: string
  id?: string
  aspectRatio?: '16 / 9' | '3 / 2'
}

export function FeaturedCarousel({ flyers = featuredFlyers, title = 'Destacados', description, id, aspectRatio = '16 / 9' }: FlyerCarouselProps = {}) {
  const [active, setActive] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [visible, setVisible] = useState(true)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const count = flyers.length
  const rotating = count > 1 && !reducedMotion && visible

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReducedMotion(media.matches)
    const updateVisibility = () => setVisible(!document.hidden)
    updateMotion()
    updateVisibility()
    media.addEventListener('change', updateMotion)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      media.removeEventListener('change', updateMotion)
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [])

  useEffect(() => {
    if (!rotating) return
    const timer = window.setInterval(() => setActive(current => (current + 1) % count), 3000)
    return () => window.clearInterval(timer)
  }, [count, rotating])

  if (!count) return null

  const move = (direction: number) => setActive(current => (current + direction + count) % count)

  return (
    <section id={id} className="mx-auto max-w-7xl scroll-mt-36 px-4 pb-2 pt-5 lg:px-8" aria-label={`${title} Market Mutual`} aria-roledescription="carrusel">
      <div className="mx-auto mb-4 md:max-w-[640px]">
        <h2 className="text-xl font-extrabold tracking-tight text-[#102f53] sm:text-2xl">{title}</h2>
        {description && <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>}

      </div>
      <div className="relative isolate">
        {count > 1 && <>
          <button type="button" onClick={() => move(-1)} aria-label="Ver flyer anterior" className="absolute inset-y-0 left-0 hidden w-[calc(50%-352px)] overflow-hidden rounded-[24px] opacity-85 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-[#1456a0] lg:block [mask-image:linear-gradient(to_right,transparent,black_70%)]">
            {flyers.map((flyer, index) => <span key={flyer.id} aria-hidden="true" style={{ backgroundImage: flyer.image ? `url("${flyer.image}")` : undefined }} className={`absolute inset-y-0 right-0 w-[640px] bg-cover bg-right transition-opacity duration-700 ease-in-out motion-reduce:transition-none ${index === (active - 1 + count) % count ? 'opacity-100' : 'opacity-0'}`} />)}
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Ver flyer siguiente" className="absolute inset-y-0 right-0 hidden w-[calc(50%-352px)] overflow-hidden rounded-[24px] opacity-85 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-[#1456a0] lg:block [mask-image:linear-gradient(to_left,transparent,black_70%)]">
            {flyers.map((flyer, index) => <span key={flyer.id} aria-hidden="true" style={{ backgroundImage: flyer.image ? `url("${flyer.image}")` : undefined }} className={`absolute inset-y-0 left-0 w-[640px] bg-cover bg-left transition-opacity duration-700 ease-in-out motion-reduce:transition-none ${index === (active + 1) % count ? 'opacity-100' : 'opacity-0'}`} />)}
          </button>
        </>}
      <div style={{ aspectRatio }} className="relative isolate mx-auto md:max-w-[640px] touch-pan-y overflow-hidden rounded-[24px] bg-[#e2f3f1]"
        onTouchStart={event => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY } }}
        onTouchCancel={() => { touchStart.current = null }}
        onTouchEnd={event => {
          const start = touchStart.current
          touchStart.current = null
          if (!start || count < 2) return
          const touch = event.changedTouches[0]
          const dx = touch.clientX - start.x, dy = touch.clientY - start.y
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1)
        }}>
        {flyers.map((flyer, index) => (
          <div key={flyer.id} role="group" aria-roledescription="diapositiva" aria-label={`${index + 1} de ${count}: ${flyer.title}`} aria-hidden={index !== active} inert={index !== active}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out motion-reduce:transition-none ${index === active ? 'z-10 opacity-100' : 'pointer-events-none z-0 opacity-0'}`}>
            {flyer.image ? (
              <a href={flyer.href} aria-label={flyer.title} className="block h-full w-full focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-[#1456a0]" draggable={false}>
                <picture>
                  {flyer.mobileImage && <source media="(max-width: 639px)" srcSet={flyer.mobileImage} />}
                  {/* Flyers locales con proporción libre: contain conserva todo el diseño. */}
                  <img src={flyer.image} alt={flyer.alt ?? flyer.title} draggable={false} loading={index === 0 ? 'eager' : 'lazy'} className="h-full w-full object-contain" />
                </picture>
              </a>
            ) : (
              <a href={flyer.href ?? '#entregas'} className="relative flex h-full items-center overflow-hidden px-5 py-4 text-[#123b4b] focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-[#1456a0] sm:px-10 lg:px-14">
                <div className="relative z-10 max-w-[78%] sm:max-w-[65%]">
                  <p className="mb-2 text-xs font-bold text-[#24665f] sm:text-sm">Envíos Market Mutual</p>
                  <h3 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">Tu pedido, más cerca</h3>
                  <div className="mt-3 flex flex-col gap-1.5 text-xs font-semibold sm:mt-5 sm:flex-row sm:gap-5 sm:text-sm">
                    <span className="flex items-center gap-1.5"><MapPin className="size-3.5 shrink-0" /> Zonas norte y sur</span>
                    <span className="flex items-center gap-1.5"><Clock3 className="size-3.5 shrink-0" /> De 09:00 a 16:30</span>
                  </div>
                  <span className="mt-3 inline-flex items-center gap-2 text-xs font-bold underline underline-offset-4 sm:mt-6 sm:text-sm">Conocé las entregas <ArrowRight className="size-3.5" /></span>
                </div>
                <div aria-hidden="true" className="absolute -right-7 flex size-36 items-center justify-center rounded-full bg-[#c2e6df] sm:right-10 sm:size-52 lg:right-20 lg:size-64"><Truck className="size-20 stroke-[1.25] text-[#2e7b73] sm:size-28 lg:size-36" /></div>
              </a>
            )}
          </div>
        ))}
      </div>
      </div>
      {count > 1 && <div className="mt-3 flex items-center justify-center gap-1" aria-label="Elegir flyer">
        {flyers.map((flyer, index) => <button type="button" key={flyer.id} aria-label={`Ver ${flyer.title}`} aria-current={index === active ? 'true' : undefined} onClick={() => setActive(index)} className="flex min-h-11 min-w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-[#1456a0]"><span className={`h-2 rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none ${index === active ? 'w-6 bg-[#1456a0]' : 'w-2 bg-[#b5c8db]'}`} /></button>)}
      </div>}
      <p className="sr-only" aria-live={rotating ? 'off' : 'polite'} aria-atomic="true">{flyers[active].title}, {active + 1} de {count}</p>
    </section>
  )
}
