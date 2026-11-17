export type BenefitLogo = {
  src: string
  alt: string
}

export type BenefitGroup = {
  discount: '30' | '20' | '15'
  title: string
  logos: BenefitLogo[]
  fixed?: boolean
}

const numberedLogos = (discount: '20' | '15', count: number): BenefitLogo[] =>
  Array.from({ length: count }, (_, index) => ({
    src: `/benefits/${discount}/${String(index + 1).padStart(2, '0')}.webp?v=20261117c`,
    alt: `Organización con convenio de ${discount}% — logo ${index + 1}`,
  }))

export const benefitGroups: BenefitGroup[] = [
  {
    discount: '30',
    title: 'Afiliados UOCRA',
    fixed: true,
    logos: [{ src: '/benefits/30/01.webp?v=20261117c', alt: 'UOCRA' }],
  },
  {
    discount: '20',
    title: 'Socios adherentes y convenios',
    logos: numberedLogos('20', 11),
  },
  {
    discount: '15',
    title: 'Convenios especiales',
    logos: numberedLogos('15', 4),
  },
]
