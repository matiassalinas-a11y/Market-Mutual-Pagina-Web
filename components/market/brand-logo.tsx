import Image from 'next/image'

export function BrandLogo() {
  return <Image src="/images/market-mutual-logo.png" alt="Market Mutual" width={1843} height={638} sizes="128px" className="h-11 w-auto shrink-0 object-contain" />
}
