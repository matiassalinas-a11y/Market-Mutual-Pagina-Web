import type { CSSProperties } from 'react'
import type { BenefitGroup, BenefitLogo } from '@/lib/benefit-logos'
import { benefitGroups } from '@/lib/benefit-logos'

function Logo({ logo }: { logo: BenefitLogo }) {
  return (
    <span className="flex h-16 w-28 shrink-0 items-center justify-center px-2 sm:h-20 sm:w-32">
      {/* Las imágenes provienen de los archivos oficiales entregados para cada convenio. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo.src} alt={logo.alt} className="max-h-full max-w-full object-contain object-center" />
    </span>
  )
}

function LogoMarquee({ logos, discount }: { logos: BenefitLogo[]; discount: string }) {
  return (
    <div
      className="benefit-logo-viewport w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_13%,black_87%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1456a0] motion-reduce:overflow-x-auto motion-reduce:[mask-image:none]"
      style={{ '--benefit-marquee-duration': `${logos.length * 4}s` } as CSSProperties}
      tabIndex={0}
      role="region"
      aria-label={`Organizaciones con ${discount}% de descuento. La animación se pausa al enfocar esta lista.`}
    >
      <div className="benefit-logo-track flex w-max">
        <ul className="flex shrink-0 items-center gap-1 pr-1" aria-label={`Logos de convenios del ${discount}%`}>
          {logos.map((logo) => <li key={logo.src}><Logo logo={logo} /></li>)}
        </ul>
        <ul className="benefit-logo-copy flex shrink-0 items-center gap-1 pr-1" aria-hidden="true">
          {logos.map((logo) => <li key={`copy-${logo.src}`}><Logo logo={{ ...logo, alt: '' }} /></li>)}
        </ul>
      </div>
    </div>
  )
}

function BenefitColumn({ group, divided }: { group: BenefitGroup; divided: boolean }) {
  return (
    <article className="relative min-w-0 text-center">
      {divided && <span aria-hidden="true" className="absolute -left-5 inset-y-2 hidden w-px bg-[#c7dbea] md:block lg:-left-7" />}
      <h3 className="text-3xl font-black leading-none tracking-[-0.045em] text-[#062d57] sm:text-4xl">
        {group.discount}% off
      </h3>

      <div className="mt-2 flex h-20 items-center justify-center sm:h-24">
        {group.fixed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={group.logos[0].src}
            alt={group.logos[0].alt}
            className="max-h-20 max-w-32 object-contain object-center sm:max-h-24 sm:max-w-36"
          />
        ) : (
          <LogoMarquee logos={group.logos} discount={group.discount} />
        )}
      </div>
    </article>
  )
}

export function BenefitsSection() {
  return (
    <section id="beneficios" className="scroll-mt-28 border-y border-[#dce9f5] bg-[#f3f8fd] py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1474c8]">Cerca tuyo</p>
          <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-[#102f53] sm:text-[1.7rem]">Beneficios Market Mutual</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Conocé los descuentos disponibles según tu afiliación o convenio.</p>
        </div>

        <div className="mt-7 grid gap-x-10 gap-y-8 md:grid-cols-[0.72fr_1.14fr_1.14fr] lg:gap-x-14">
          {benefitGroups.map((group, index) => <BenefitColumn key={group.discount} group={group} divided={index > 0} />)}
        </div>
      </div>
    </section>
  )
}
