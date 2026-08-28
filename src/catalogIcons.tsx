import type { ImgHTMLAttributes, ReactNode, SVGProps } from 'react'

type SvgProps = Omit<SVGProps<SVGSVGElement>, 'children'>

const cyan = '#27b8df'
const cyanLight = '#8be9fb'
const blue = '#0879b8'
const blueDark = '#075b91'
const teal = '#0a8fa1'
const white = '#e9fbff'

function IconShell({ children, ...props }: SvgProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

const iconShapes = {
  parks: (
    <>
      <path d="M22 42V27h5v15" fill="#8a531f" stroke="#5b3a19" strokeWidth="2" />
      <path d="M14 31c-5 0-8-3-8-7 0-3 2-6 6-7 0-6 4-10 10-10 5 0 9 3 10 8 5 0 9 4 9 9 0 6-5 10-12 9-4 3-10 2-15-2Z" fill={cyan} stroke={blueDark} strokeWidth="2" strokeLinejoin="round" />
      <path d="M13 20c1-5 5-8 10-8 3 0 6 1 8 4" stroke={cyanLight} strokeWidth="3" strokeLinecap="round" opacity=".8" />
    </>
  ),
  landscape: (
    <>
      <path d="m5 38 11-21 7 10 7-16 13 27H5Z" fill={cyan} stroke={blueDark} strokeWidth="2" strokeLinejoin="round" />
      <path d="m11 30 5-10 4 6-3 1-2 5-4-2Zm14-7 5-9 5 11-5-3-5 1Z" fill={white} opacity=".84" />
      <path d="M7 39h35" stroke={blueDark} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  education: (
    <>
      <path d="M24 13c-5-4-11-5-18-3v27c7-2 13-1 18 3V13Z" fill={cyanLight} stroke={blueDark} strokeWidth="2" strokeLinejoin="round" />
      <path d="M24 13c5-4 11-5 18-3v27c-7-2-13-1-18 3V13Z" fill={cyan} stroke={blueDark} strokeWidth="2" strokeLinejoin="round" />
      <path d="M11 17c3 0 6 .5 9 2m-9 6c3 0 6 .5 9 2m17-10c-3 0-6 .5-9 2m9 6c-3 0-6 .5-9 2" stroke={blue} strokeWidth="2" strokeLinecap="round" opacity=".72" />
    </>
  ),
  transport: (
    <>
      <rect x="7" y="9" width="34" height="29" rx="7" fill={cyan} stroke={blueDark} strokeWidth="2" />
      <rect x="11" y="13" width="26" height="12" rx="3" fill={white} stroke={blue} strokeWidth="2" />
      <path d="M24 13v12M12 30h24" stroke={blue} strokeWidth="2" />
      <circle cx="14" cy="39" r="3" fill={blueDark} />
      <circle cx="34" cy="39" r="3" fill={blueDark} />
      <circle cx="14" cy="30" r="2" fill={cyanLight} />
      <circle cx="34" cy="30" r="2" fill={cyanLight} />
    </>
  ),
  publicTransport: (
    <>
      <path d="M11 8h26M17 8l2 5m12-5-2 5" stroke={blueDark} strokeWidth="2" strokeLinecap="round" />
      <rect x="10" y="12" width="28" height="27" rx="6" fill={cyan} stroke={blueDark} strokeWidth="2" />
      <rect x="14" y="16" width="20" height="10" rx="2" fill={white} stroke={blue} strokeWidth="2" />
      <path d="M24 16v10M15 31h18" stroke={blue} strokeWidth="2" />
      <path d="m17 39-3 4m17-4 3 4" stroke={blueDark} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  beach: (
    <>
      <circle cx="24" cy="10" r="5" fill={cyanLight} stroke={blueDark} strokeWidth="2" />
      <path d="M24 15v25m-8-16h16M9 30c2 8 7 12 15 12s13-4 15-12l-7 4m-23-4 7 4" stroke={blueDark} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 16v23" stroke={cyan} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  entertainment: (
    <>
      <path d="M21 14v22c0 4-4 7-9 7s-8-2-8-5 3-6 8-6c2 0 3 0 5 1V10l26-5v22c0 4-4 7-9 7s-8-2-8-5 3-6 8-6c2 0 3 0 5 1V10l-18 4Z" fill={cyan} stroke={blueDark} strokeWidth="2" strokeLinejoin="round" />
      <path d="m21 14 18-4" stroke={cyanLight} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  mountain: (
    <>
      <path d="M5 37 16 20l6 8 8-15 13 24H5Z" fill={cyanLight} stroke={blueDark} strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 10h30M15 10l4 12m14-12-4 12" stroke={blueDark} strokeWidth="2" strokeLinecap="round" />
      <rect x="15" y="20" width="18" height="13" rx="4" fill={cyan} stroke={blueDark} strokeWidth="2" />
      <path d="M19 24h10" stroke={white} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  gambling: (
    <>
      <path d="m8 14 20-5 7 29-20 5-7-29Z" fill={cyanLight} stroke={blueDark} strokeWidth="2" strokeLinejoin="round" />
      <path d="m22 10 18 5-8 28-17-5" fill={cyan} stroke={blueDark} strokeWidth="2" strokeLinejoin="round" />
      <path d="m17 20 4 7h-8l4-7Zm13 7 4-4 4 4-4 4-4-4Z" fill={blueDark} />
      <circle cx="25" cy="18" r="2" fill={white} />
      <circle cx="29" cy="36" r="2" fill={white} />
    </>
  ),
  monuments: (
    <>
      <path d="M7 19h8l3-5h12l3 5h8v21H7V19Z" fill={cyan} stroke={blueDark} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="24" cy="29" r="8" fill={cyanLight} stroke={blueDark} strokeWidth="3" />
      <circle cx="24" cy="29" r="3" fill={blue} />
      <rect x="10" y="15" width="7" height="4" rx="1" fill={blue} />
      <path d="M34 23h3" stroke={white} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  space: (
    <>
      <path d="M28 5c8 4 12 12 11 21l-12 9-14-14 9-12c2-2 4-3 6-4Z" fill={cyan} stroke={blueDark} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="29" cy="16" r="5" fill={white} stroke={blue} strokeWidth="2" />
      <path d="m15 23-7 2-3 9 10-2m10 2-2 9 9-3 2-7" fill={cyanLight} stroke={blueDark} strokeWidth="2" strokeLinejoin="round" />
      <path d="m17 35-7 7m10-5-3 6" stroke="#ffba43" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  clinic: (
    <>
      <path d="M12 7h24a5 5 0 0 1 5 5v24a5 5 0 0 1-5 5H12a5 5 0 0 1-5-5V12a5 5 0 0 1 5-5Z" fill={cyan} stroke={blueDark} strokeWidth="2" />
      <path d="M20 14h8v6h6v8h-6v6h-8v-6h-6v-8h6v-6Z" fill={white} stroke={blue} strokeWidth="1.5" strokeLinejoin="round" />
    </>
  ),
  fire: (
    <>
      <path d="M25 5c4 8-1 10 4 14 2-4 5-6 7-7 3 6 6 11 6 17 0 9-7 14-17 14S7 38 7 29c0-7 5-14 13-21-1 7 1 9 5 11 3-5 2-9 0-14Z" fill="#ff8b35" stroke="#a94522" strokeWidth="2" strokeLinejoin="round" />
      <path d="M25 23c4 4 6 7 6 11 0 4-3 7-7 7s-7-3-7-7c0-3 2-6 6-10 0 3 1 4 2 5 2-2 2-4 0-6Z" fill="#ffd85c" />
    </>
  ),
  police: (
    <>
      <path d="M24 5c5 4 11 6 17 6v11c0 10-6 17-17 22C13 39 7 32 7 22V11c6 0 12-2 17-6Z" fill={cyan} stroke={blueDark} strokeWidth="2" strokeLinejoin="round" />
      <path d="m24 14 3 7 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1 3-7Z" fill={white} stroke={blue} strokeWidth="1.5" strokeLinejoin="round" />
    </>
  ),
  services: (
    <>
      <path d="M5 39h38" stroke={blueDark} strokeWidth="3" strokeLinecap="round" />
      <path d="M8 18h11v21H8V18Zm21-8h11v29H29V10Z" fill={cyan} stroke={blueDark} strokeWidth="2" />
      <path d="M19 25h10v14H19V25Z" fill={cyanLight} stroke={blueDark} strokeWidth="2" />
      <path d="M12 23h3m-3 6h3m18-13h3m-3 6h3m-3 6h3m-13 2h3" stroke={white} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  uncategorized: (
    <>
      <path d="M7 42V19l17-12 17 12v23H7Z" fill={cyan} stroke={blueDark} strokeWidth="2" strokeLinejoin="round" />
      <path d="M18 42V29h12v13M13 22h5m12 0h5" stroke={white} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
} as const

export type SpecializationIconKey = keyof typeof iconShapes

const specializationIconAssets: Record<SpecializationIconKey, string> = {
  parks: 'parks.webp',
  landscape: 'landscape.webp',
  education: 'education.webp',
  transport: 'transport.webp',
  publicTransport: 'public-transport.webp',
  beach: 'beach.webp',
  entertainment: 'entertainment.webp',
  mountain: 'mountain.webp',
  gambling: 'gambling.webp',
  monuments: 'monuments.webp',
  space: 'space.webp',
  clinic: 'clinic.webp',
  fire: 'fire.webp',
  police: 'police.webp',
  services: 'services.webp',
  uncategorized: 'uncategorized.webp',
}

const specializationIcons: Record<string, SpecializationIconKey> = {
  'без категории': 'uncategorized',
  'все службы': 'services',
  гора: 'mountain',
  'игорный бизнес': 'gambling',
  клиника: 'clinic',
  космос: 'space',
  'ландшафтный дизайн': 'landscape',
  монументы: 'monuments',
  образование: 'education',
  'общественный транспорт': 'publicTransport',
  парки: 'parks',
  пляж: 'beach',
  'пожарная служба': 'fire',
  полиция: 'police',
  развлечения: 'entertainment',
  транспорт: 'transport',
}

export function specializationIconKey(value: string | null | undefined): SpecializationIconKey {
  if (!value) return 'uncategorized'
  return specializationIcons[value.trim().toLocaleLowerCase('ru')] ?? 'uncategorized'
}

type GameIconProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>

interface SpecializationIconProps extends GameIconProps {
  specialization: string | null | undefined
}

export function SpecializationIcon({ specialization, ...props }: SpecializationIconProps) {
  const key = specializationIconKey(specialization)
  return (
    <img
      src={`icons/specializations/${specializationIconAssets[key]}`}
      alt=""
      draggable={false}
      data-catalog-icon={key}
      {...props}
    />
  )
}

export function AllSpecializationsIcon(props: GameIconProps) {
  return (
    <img
      src="icons/specializations/all.webp"
      alt=""
      draggable={false}
      data-catalog-icon="all"
      {...props}
    />
  )
}

export function MayorPassIcon(props: GameIconProps) {
  return (
    <img
      src="icons/specializations/mayor-pass.webp"
      alt=""
      draggable={false}
      data-catalog-icon="mayor-pass"
      {...props}
    />
  )
}

const countryThemeIds = [
  'italy',
  'france',
  'spain',
  'germany',
  'britain',
  'scandinavia',
  'central-europe',
  'netherlands',
  'ireland',
  'monaco',
] as const

export type CountryThemeId = (typeof countryThemeIds)[number]

export function isCountryTheme(themeId: string): themeId is CountryThemeId {
  return (countryThemeIds as readonly string[]).includes(themeId)
}

function FlagShell({ children, themeId }: { children: ReactNode; themeId: CountryThemeId }) {
  return (
    <svg
      className="catalog-country-flag"
      viewBox="0 0 30 20"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
      data-country-theme={themeId}
    >
      {children}
      <rect x=".5" y=".5" width="29" height="19" rx="2.2" fill="none" stroke="rgba(10, 39, 42, .28)" />
    </svg>
  )
}

export function CountryFlag({ themeId }: { themeId: CountryThemeId }) {
  switch (themeId) {
    case 'italy':
      return <FlagShell themeId={themeId}><path fill="#009246" d="M0 0h10v20H0z" /><path fill="#fff" d="M10 0h10v20H10z" /><path fill="#ce2b37" d="M20 0h10v20H20z" /></FlagShell>
    case 'france':
      return <FlagShell themeId={themeId}><path fill="#0055a4" d="M0 0h10v20H0z" /><path fill="#fff" d="M10 0h10v20H10z" /><path fill="#ef4135" d="M20 0h10v20H20z" /></FlagShell>
    case 'spain':
      return <FlagShell themeId={themeId}><path fill="#aa151b" d="M0 0h30v20H0z" /><path fill="#f1bf00" d="M0 5h30v10H0z" /><rect x="8" y="8" width="2.5" height="5" rx=".5" fill="#aa151b" /></FlagShell>
    case 'germany':
      return <FlagShell themeId={themeId}><path fill="#171717" d="M0 0h30v6.67H0z" /><path fill="#d00" d="M0 6.67h30v6.67H0z" /><path fill="#ffce00" d="M0 13.34h30V20H0z" /></FlagShell>
    case 'britain':
      return (
        <FlagShell themeId={themeId}>
          <path fill="#21468b" d="M0 0h30v20H0z" />
          <path stroke="#fff" strokeWidth="5" d="m0 0 30 20M30 0 0 20" />
          <path stroke="#cf142b" strokeWidth="2" d="m0 0 30 20M30 0 0 20" />
          <path fill="#fff" d="M12 0h6v20h-6zM0 7h30v6H0z" />
          <path fill="#cf142b" d="M13.5 0h3v20h-3zM0 8.5h30v3H0z" />
        </FlagShell>
      )
    case 'scandinavia':
      return <FlagShell themeId={themeId}><path fill="#ba0c2f" d="M0 0h30v20H0z" /><path fill="#fff" d="M8 0h5v20H8zM0 8h30v5H0z" /><path fill="#00205b" d="M9.5 0h2v20h-2zM0 9.5h30v2H0z" /></FlagShell>
    case 'central-europe':
      return <FlagShell themeId={themeId}><path fill="#ed2939" d="M0 0h30v20H0z" /><path fill="#fff" d="M0 6.67h30v6.66H0z" /></FlagShell>
    case 'netherlands':
      return <FlagShell themeId={themeId}><path fill="#ae1c28" d="M0 0h30v6.67H0z" /><path fill="#fff" d="M0 6.67h30v6.67H0z" /><path fill="#21468b" d="M0 13.34h30V20H0z" /></FlagShell>
    case 'ireland':
      return <FlagShell themeId={themeId}><path fill="#169b62" d="M0 0h10v20H0z" /><path fill="#fff" d="M10 0h10v20H10z" /><path fill="#ff883e" d="M20 0h10v20H20z" /></FlagShell>
    case 'monaco':
      return <FlagShell themeId={themeId}><path fill="#ce1126" d="M0 0h30v10H0z" /><path fill="#fff" d="M0 10h30v10H0z" /></FlagShell>
  }
}

export function CatalogThemeIcon({ themeId, fallback }: { themeId: string; fallback: string }) {
  return isCountryTheme(themeId)
    ? <CountryFlag themeId={themeId} />
    : <span className="catalog-theme-emoji" aria-hidden="true">{fallback}</span>
}
