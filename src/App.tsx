import {
  AlertTriangle,
  Archive,
  ArrowUp,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardPaste,
  Copy,
  Crown,
  Grid2X2,
  Heart,
  Info,
  Images,
  Map as MapIcon,
  Moon,
  RotateCcw,
  Scan,
  Search,
  Shapes,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react'
import catalogJson from './data/catalog.json'
import {
  defaultFilters,
  filterAndSortBuildings,
  footprintKey,
  formatBoost,
  formatFootprint,
  sortLabels,
} from './catalog'
import type { Building, CatalogData, Section, SectionFilters, SortMode } from './types'
import { formatFavoriteShareText, matchFavoriteNames } from './favoriteSharing'
import { buildingMatchesTheme, buildingThemeIds, catalogThemes, findCatalogTheme } from './themes'
import { useFavorites } from './useFavorites'
import { AllSpecializationsIcon, CatalogThemeIcon, MayorPassIcon, SpecializationIcon } from './catalogIcons'

const catalog = catalogJson as CatalogData
const ALL_SORT_MODES = Object.keys(sortLabels) as SortMode[]
const PAGE_SIZE = 48
const POPULAR_BUILDINGS_COUNT = catalog.buildings.filter((building) => building.traits.includes('popular')).length
const THEMED_BUILDINGS_COUNT = catalog.buildings.filter((building) => buildingThemeIds(building).length > 0).length
const THEME_COUNTS: ReadonlyMap<string, number> = new Map(
  catalogThemes.map((theme) => [
    theme.id,
    catalog.buildings.filter((building) => buildingMatchesTheme(building, theme)).length,
  ]),
)

type View = 'catalog' | 'favorites' | 'themes' | 'popular'
type Theme = 'dark' | 'light'
type MobileColumns = 1 | 2

const readInitialTheme = (): Theme =>
  document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'

const readInitialMobileColumns = (): MobileColumns => {
  try {
    const savedColumns = window.localStorage.getItem('scbi-mobile-columns')
    return savedColumns === '1' ? 1 : 2
  } catch {
    return 2
  }
}

interface InitialState {
  section: Section
  view: View
  filters: Record<Section, SectionFilters>
  favoriteFilters: SectionFilters
  themedFilters: SectionFilters
  popularFilters: SectionFilters
}

const validSort = (value: string | null): value is SortMode =>
  Boolean(value && ALL_SORT_MODES.includes(value as SortMode))

const readInitialState = (): InitialState => {
  const params = new URLSearchParams(window.location.search)
  const section: Section = params.get('section') === 'other' ? 'other' : 'mayor'
  const requestedView = params.get('view')
  const view: View = requestedView === 'favorites' || requestedView === 'themes' || requestedView === 'popular'
    ? requestedView
    : 'catalog'
  const current = defaultFilters(section)
  current.query = params.get('q') ?? ''
  current.footprint = params.get('size') ?? 'all'
  current.featuredOnly = params.get('rare') === '1'
  if (section === 'mayor') current.season = params.get('season') ?? 'all'
  if (section === 'other') current.specialization = params.get('spec') ?? 'all'
  if (validSort(params.get('sort'))) current.sort = params.get('sort') as SortMode

  const favoriteFilters = { ...defaultFilters('other'), sort: 'name-asc' as SortMode }
  const themedFilters = { ...defaultFilters('other'), sort: 'boost-desc' as SortMode }
  const popularFilters = { ...defaultFilters('other'), sort: 'boost-desc' as SortMode }
  if (view === 'favorites') {
    favoriteFilters.query = params.get('q') ?? ''
    favoriteFilters.footprint = params.get('size') ?? 'all'
    favoriteFilters.featuredOnly = params.get('rare') === '1'
    if (validSort(params.get('sort'))) favoriteFilters.sort = params.get('sort') as SortMode
  }
  if (view === 'popular') {
    popularFilters.query = params.get('q') ?? ''
    popularFilters.footprint = params.get('size') ?? 'all'
    if (validSort(params.get('sort'))) popularFilters.sort = params.get('sort') as SortMode
  }
  if (view === 'themes') {
    themedFilters.query = params.get('q') ?? ''
    themedFilters.footprint = params.get('size') ?? 'all'
    themedFilters.featuredOnly = params.get('rare') === '1'
    themedFilters.specialization = params.get('spec') ?? 'all'
    themedFilters.theme = findCatalogTheme(params.get('theme') ?? '')?.id ?? 'all'
    if (validSort(params.get('sort'))) themedFilters.sort = params.get('sort') as SortMode
  }

  return {
    section,
    view,
    filters: {
      mayor: section === 'mayor' ? current : defaultFilters('mayor'),
      other: section === 'other' ? current : defaultFilters('other'),
    },
    favoriteFilters,
    themedFilters,
    popularFilters,
  }
}

const initialState = readInitialState()

const pluralizeBuildings = (count: number): string => {
  const lastTwo = count % 100
  const last = count % 10
  if (lastTwo >= 11 && lastTwo <= 14) return `${count} зданий`
  if (last === 1) return `${count} здание`
  if (last >= 2 && last <= 4) return `${count} здания`
  return `${count} зданий`
}

const formatPhotoCount = (total: number): string => `${Math.max(total, 1)} фото`

const formatEffectArea = (value: string): string =>
  value.replace(/\s*[xх×]\s*/gi, ' × ')

const compactUniqueEffect = (building: Building): string | null => {
  if (!building.traits.includes('unique-effect')) return null

  const label = building.effectDescription?.trim() || 'Создаёт особый визуальный эффект'
  const description = building.effectArea ? `${label} · ${formatEffectArea(building.effectArea)}` : label
  return `Уникальный эффект · ${description}`
}

const sectionLabels: Record<Section, { title: string; eyebrow: string }> = {
  mayor: { title: 'Абонемент мэра', eyebrow: '71 сезон' },
  other: { title: 'Другие здания', eyebrow: '16 специализаций' },
}

const featureTraitLabels = {
  popular: 'Популярное',
  'unique-effect': 'Уникальный эффект',
  upgradeable: 'Прокачивается',
} as const

const featureSummary = (building: Building): string => {
  if (building.traits.includes('upgradeable')) return 'Редкое · прокачивается'
  if (building.traits.includes('unique-effect')) return 'Уникальный эффект'
  if (building.traits.includes('popular')) return 'Популярное'
  return 'Особый объект'
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])

  return matches
}

function HeroVisual() {
  const shouldRender = useMediaQuery('(min-width: 851px)')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!shouldRender) setReady(false)
  }, [shouldRender])

  if (!shouldRender) return null

  return (
    <div className={`hero__visual${ready ? ' is-loaded' : ''}`} aria-hidden="true">
      <img
        className="hero__image hero__image--placeholder"
        src="hero-city-v1-placeholder.webp"
        alt=""
        width="1217"
        height="1292"
        decoding="async"
      />
      <img
        className="hero__image hero__image--full"
        src="hero-city-v1-640.webp"
        srcSet="hero-city-v1-640.webp 640w, hero-city-v1.webp 1217w"
        sizes="(max-width: 1160px) 500px, 610px"
        alt=""
        width="1217"
        height="1292"
        loading="eager"
        fetchPriority="high"
        decoding="async"
        onLoad={() => setReady(true)}
      />
    </div>
  )
}

function FootprintMark({ building }: { building: Building }) {
  return (
    <span className="meta-mark meta-mark--grid" aria-hidden="true">
      <Grid2X2 size={17} strokeWidth={1.8} />
    </span>
  )
}

interface FavoriteButtonProps {
  building: Building
  active: boolean
  onToggle: (building: Building) => void
  variant?: 'card' | 'dialog'
}

function FavoriteButton({ building, active, onToggle, variant = 'card' }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      className={`favorite-toggle favorite-toggle--${variant}${active ? ' is-active' : ''}`}
      aria-pressed={active}
      aria-label={`${active ? 'Убрать' : 'Добавить'} «${building.name}» ${active ? 'из избранного' : 'в избранное'}`}
      onClick={() => onToggle(building)}
    >
      <Heart size={variant === 'card' ? 20 : 18} fill={active ? 'currentColor' : 'none'} />
      {variant === 'dialog' && <span>{active ? 'В избранном' : 'В избранное'}</span>}
    </button>
  )
}

interface BuildingCardProps {
  building: Building
  favorite: boolean
  onFavorite: (building: Building) => void
  onOpen: (building: Building) => void
}

function BuildingCard({ building, favorite, onFavorite, onOpen }: BuildingCardProps) {
  const images = building.images.length > 0
    ? building.images
    : building.image
      ? [{ src: building.image, kind: 'main' as const, label: 'Основное фото' }]
      : []
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const pointerStartX = useRef<number | null>(null)
  const suppressOpen = useRef(false)
  const activeImage = images[activeImageIndex] ?? images[0]
  const canShowPrevious = activeImageIndex > 0
  const canShowNext = activeImageIndex < images.length - 1
  const categoryLabel = building.section === 'mayor'
    ? `Сезон ${building.season ?? '—'}`
    : building.specialization ?? 'Другое'
  const detailsLabel = images.length > 1 ? `Сведения · ${formatPhotoCount(images.length)}` : 'Все сведения'
  const cardFeatureLabel = compactUniqueEffect(building) ?? (building.isFeatured ? featureSummary(building) : null)

  const showRelativeImage = (offset: number) => {
    if (images.length < 2) return
    setActiveImageIndex((current) => Math.min(images.length - 1, Math.max(0, current + offset)))
  }

  const beginSwipe = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (images.length < 2) return
    pointerStartX.current = event.clientX
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const completeSwipe = (clientX: number) => {
    if (pointerStartX.current === null || images.length < 2) return
    const distance = pointerStartX.current - clientX
    if (Math.abs(distance) < 34) return
    pointerStartX.current = null
    suppressOpen.current = true
    showRelativeImage(distance > 0 ? 1 : -1)
  }

  const endSwipe = (event: ReactPointerEvent<HTMLButtonElement>) => {
    completeSwipe(event.clientX)
    pointerStartX.current = null
  }

  const openCard = () => {
    if (suppressOpen.current) {
      suppressOpen.current = false
      return
    }
    onOpen(building)
  }

  return (
    <article className={`building-card building-card--${building.section}`} role="listitem">
      <div className="building-card__media">
        <button
          type="button"
          className="building-card__image-button"
          onClick={openCard}
          onPointerDown={beginSwipe}
          onPointerMove={(event) => completeSwipe(event.clientX)}
          onPointerUp={endSwipe}
          onPointerCancel={() => { pointerStartX.current = null }}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
            event.preventDefault()
            showRelativeImage(event.key === 'ArrowRight' ? 1 : -1)
          }}
          aria-label={`Открыть сведения: ${building.name}`}
        >
          {activeImage ? (
            <img
              key={activeImage.src}
              src={activeImage.src}
              alt={`${building.name} — ${activeImage.label}`}
              loading="lazy"
              decoding="async"
              draggable={false}
              style={{ objectPosition: activeImage.focus }}
            />
          ) : (
            <span className="building-card__placeholder" aria-hidden="true">
              <Building2 size={48} />
            </span>
          )}
        </button>
        {canShowPrevious && (
          <button
            type="button"
            className="building-card__gallery-arrow building-card__gallery-arrow--previous"
            aria-label="Предыдущее фото"
            onClick={() => showRelativeImage(-1)}
          >
            <span><ChevronLeft size={15} /></span>
          </button>
        )}
        {canShowNext && (
          <button
            type="button"
            className="building-card__gallery-arrow building-card__gallery-arrow--next"
            aria-label="Следующее фото"
            onClick={() => showRelativeImage(1)}
          >
            <span><ChevronRight size={15} /></span>
          </button>
        )}
        <span
          className={`building-card__index building-card__index--${building.section === 'mayor' ? 'season' : 'specialization'}`}
          role="img"
          aria-label={categoryLabel}
          title={categoryLabel}
        >
          {building.section === 'mayor' ? (
            <>
              <MayorPassIcon />
              <strong aria-hidden="true">{building.season ?? '—'}</strong>
            </>
          ) : (
            <SpecializationIcon specialization={building.specialization} />
          )}
        </span>
        {images.length > 1 && (
          <span
            className="building-card__carousel-dots"
            aria-label={`Фото ${activeImageIndex + 1} из ${images.length}`}
            aria-live="polite"
          >
            {images.map((image, index) => (
              <i key={image.src} className={index === activeImageIndex ? 'is-active' : ''} aria-hidden="true" />
            ))}
          </span>
        )}
        {images.length > 0 && (
          <span
            className="building-card__image-count"
            role="img"
            aria-label={formatPhotoCount(images.length)}
            title={formatPhotoCount(images.length)}
          >
            <strong aria-hidden="true">{images.length}</strong>
            <Images size={14} aria-hidden="true" />
          </span>
        )}
        <FavoriteButton building={building} active={favorite} onToggle={onFavorite} />
      </div>

      <div className="building-card__body">
        <div className="building-card__heading">
          <h2>{building.name}</h2>
          {building.originalName && <p lang="en">{building.originalName}</p>}
        </div>

        {cardFeatureLabel && (
          <span className="building-card__feature">
            <Sparkles size={13} /> <span>{cardFeatureLabel}</span>
          </span>
        )}

        <div className="building-card__facts">
          <div className="card-fact">
            <FootprintMark building={building} />
            <span>{formatFootprint(building)}</span>
          </div>
          <div className="card-fact">
            <span className="meta-mark" aria-hidden="true">
              <Users size={17} strokeWidth={1.8} />
            </span>
            <span>{formatBoost(building.boost)}</span>
          </div>
        </div>

        <div className={`building-card__context building-card__context--${building.section}`}>
          {building.section === 'mayor' ? (
            <>
              <div>
                <span className="building-card__context-label">Тема сезона</span>
                <strong>{building.seasonName ?? 'Не указана'}</strong>
              </div>
              <div>
                <span className="building-card__context-label">Дата выхода</span>
                <strong>{building.released ?? 'Не указана'}</strong>
              </div>
            </>
          ) : building.released ? (
            <div>
              <span className="building-card__context-label">Появилось</span>
              <strong>{building.released}</strong>
            </div>
          ) : null}
          <div className="building-card__context-actions">
            <button
              type="button"
              className="details-link"
              onClick={() => onOpen(building)}
              aria-label={detailsLabel}
              title={detailsLabel}
            >
              <span>Открыть</span>
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

interface CatalogSelectOption {
  value: string
  label: string
  icon?: ReactNode
}

interface CatalogSelectProps {
  label: string
  value: string
  options: CatalogSelectOption[]
  onChange: (value: string) => void
  className?: string
  placement?: 'bottom' | 'top'
}

function CatalogSelect({
  label,
  value,
  options,
  onChange,
  className = '',
  placement = 'bottom',
}: CatalogSelectProps) {
  const [open, setOpen] = useState(false)
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const [activeIndex, setActiveIndex] = useState(selectedIndex)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const labelId = useId()
  const valueId = useId()
  const listboxId = useId()
  const selectedOption = options[selectedIndex] ?? options[0]

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => optionRefs.current[activeIndex]?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [activeIndex, open])

  useEffect(() => {
    if (!open) return
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [open])

  const openMenu = (index = selectedIndex) => {
    setActiveIndex(Math.max(0, Math.min(index, options.length - 1)))
    setOpen(true)
  }

  const closeMenu = (restoreFocus = false) => {
    setOpen(false)
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus())
  }

  const chooseOption = (index: number) => {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    closeMenu(true)
  }

  const moveFocus = (index: number) => {
    const next = Math.max(0, Math.min(index, options.length - 1))
    setActiveIndex(next)
  }

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      openMenu(selectedIndex)
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      closeMenu()
    }
  }

  const handleOptionKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveFocus(index + 1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveFocus(index - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      moveFocus(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      moveFocus(options.length - 1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      chooseOption(index)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeMenu(true)
    } else if (event.key === 'Tab') {
      closeMenu()
    }
  }

  return (
    <div
      ref={rootRef}
      className={`control-field catalog-select catalog-select--${placement}${className ? ` ${className}` : ''}${open ? ' is-open' : ''}`}
    >
      <span id={labelId}>{label}</span>
      <button
        ref={triggerRef}
        id={valueId}
        type="button"
        className="catalog-select__trigger"
        aria-labelledby={`${labelId} ${valueId}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => open ? closeMenu() : openMenu()}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className='catalog-select__value'>
          {selectedOption?.icon && <span className='catalog-select__option-icon'>{selectedOption.icon}</span>}
          <span>{selectedOption?.label ?? 'Не выбрано'}</span>
        </span>
        <span className="catalog-select__chevron" aria-hidden="true">
          <ChevronDown size={16} />
        </span>
      </button>

      {open && (
        <div id={listboxId} className="catalog-select__menu" role="listbox" aria-labelledby={labelId}>
          {options.map((option, index) => (
            <button
              ref={(node) => { optionRefs.current[index] = node }}
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={option.value === value ? 'is-selected' : ''}
              onClick={() => chooseOption(index)}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
            >
              <span className='catalog-select__option-label'>
                {option.icon && <span className='catalog-select__option-icon'>{option.icon}</span>}
                <span>{option.label}</span>
              </span>
              {option.value === value && <Check size={15} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface FilterPanelProps {
  section: Section
  view: View
  filters: SectionFilters
  footprints: string[]
  onChange: (patch: Partial<SectionFilters>) => void
}

function FilterPanel({ section, view, filters, footprints, onChange }: FilterPanelProps) {
  const sortOptions: SortMode[] = view === 'favorites'
    ? ['name-asc', 'boost-desc', 'boost-asc', 'season-desc', 'season-asc']
    : view === 'popular' || view === 'themes'
      ? ['boost-desc', 'boost-asc', 'released-desc', 'released-asc', 'name-asc']
    : section === 'mayor'
      ? ['season-desc', 'season-asc', 'boost-desc', 'boost-asc', 'name-asc']
      : ['boost-desc', 'boost-asc', 'released-desc', 'released-asc', 'name-asc']

  return (
    <div className="filter-panel">
      {view === 'catalog' && section === 'mayor' && (
        <CatalogSelect
          label="Сезон"
          className="control-field--wide"
          value={filters.season}
          options={[
            { value: 'all', label: 'Все сезоны' },
            ...Object.entries(catalog.meta.seasons)
              .sort(([left], [right]) => Number(right) - Number(left))
              .map(([season, name]) => ({ value: season, label: `${season}. ${name}` })),
          ]}
          onChange={(season) => onChange({ season })}
        />
      )}

      {((view === 'catalog' && section === 'other') || view === 'themes') && (
        <CatalogSelect
          label="Специализация"
          className="control-field--wide"
          value={filters.specialization}
          options={[
            { value: 'all', label: 'Все специализации', icon: <AllSpecializationsIcon aria-hidden='true' /> },
            ...catalog.meta.specializations.map((specialization) => ({
              value: specialization,
              label: specialization,
              icon: <SpecializationIcon specialization={specialization} />,
            })),
          ]}
          onChange={(specialization) => onChange({ specialization })}
        />
      )}

      {view !== 'popular' && (
        <label className={`featured-filter${filters.featuredOnly ? ' is-active' : ''}`}>
          <input
            type="checkbox"
            checked={filters.featuredOnly}
            onChange={(event) => onChange({ featuredOnly: event.target.checked })}
          />
          <span className="featured-filter__mark" aria-hidden="true"><Sparkles size={17} /></span>
          <span>
            <strong>Популярные / редкие</strong>
            <small>Эффекты и прокачиваемые</small>
          </span>
        </label>
      )}

      <CatalogSelect
        label="Размер"
        value={filters.footprint}
        options={[
          { value: 'all', label: 'Любой' },
          ...footprints.map((footprint) => ({
            value: footprint,
            label: footprint.startsWith('linear-') ? `Линейный · ${footprint.slice(7)}` : footprint.replace('x', ' × '),
          })),
        ]}
        onChange={(footprint) => onChange({ footprint })}
      />

      <CatalogSelect
        label="Сортировка"
        className="control-field--sort"
        placement="top"
        value={filters.sort}
        options={sortOptions.map((sort) => ({ value: sort, label: sortLabels[sort] }))}
        onChange={(sort) => onChange({ sort: sort as SortMode })}
      />
    </div>
  )
}

interface DetailDialogProps {
  building: Building | null
  favorite: boolean
  onFavorite: (building: Building) => void
  onClose: () => void
}

function DetailDialog({ building, favorite, onFavorite, onClose }: DetailDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const pointerStartX = useRef<number | null>(null)
  const activePointers = useRef(new globalThis.Map<number, { x: number; y: number }>())
  const dragStart = useRef<{ pointerId: number; x: number; y: number; panX: number; panY: number } | null>(null)
  const pinchStart = useRef<{ distance: number; zoom: number } | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (building && !dialog.open) dialog.showModal()
    if (!building && dialog.open) dialog.close()
  }, [building])

  useEffect(() => {
    setActiveImageIndex(0)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [building?.id])

  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    activePointers.current.clear()
    dragStart.current = null
    pinchStart.current = null
  }, [activeImageIndex])

  if (!building) return <dialog ref={ref} className="detail-dialog" aria-labelledby="building-detail-heading" onClose={onClose} />

  const images = building.images.length > 0
    ? building.images
    : building.image
      ? [{ src: building.image, kind: 'main' as const, label: 'Основное фото' }]
      : []
  const activeImage = images[activeImageIndex] ?? images[0]
  const canShowPrevious = activeImageIndex > 0
  const canShowNext = activeImageIndex < images.length - 1
  const showRelativeImage = (offset: number) => {
    setActiveImageIndex((current) => Math.min(images.length - 1, Math.max(0, current + offset)))
  }

  const clampPan = (x: number, y: number, scale = zoom) => {
    const stage = stageRef.current
    const image = imageRef.current
    if (!stage || !image || scale <= 1) return { x: 0, y: 0 }

    const style = getComputedStyle(stage)
    const availableWidth = stage.clientWidth
      - Number.parseFloat(style.paddingLeft)
      - Number.parseFloat(style.paddingRight)
    const availableHeight = stage.clientHeight
      - Number.parseFloat(style.paddingTop)
      - Number.parseFloat(style.paddingBottom)
    const naturalWidth = image.naturalWidth || availableWidth
    const naturalHeight = image.naturalHeight || availableHeight
    const containScale = Math.min(availableWidth / naturalWidth, availableHeight / naturalHeight)
    const renderedWidth = naturalWidth * containScale
    const renderedHeight = naturalHeight * containScale
    const maxX = Math.max(0, (renderedWidth * scale - availableWidth) / 2)
    const maxY = Math.max(0, (renderedHeight * scale - availableHeight) / 2)
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    }
  }

  const applyZoom = (value: number) => {
    const nextZoom = Math.min(4, Math.max(1, Math.round(value * 10) / 10))
    setZoom(nextZoom)
    setPan((current) => clampPan(current.x, current.y, nextZoom))
  }

  const resetZoom = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const beginSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    event.currentTarget.setPointerCapture(event.pointerId)

    const pointers = [...activePointers.current.values()]
    if (pointers.length >= 2) {
      pinchStart.current = {
        distance: Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y),
        zoom,
      }
      pointerStartX.current = null
      dragStart.current = null
      return
    }

    if (zoom > 1) {
      dragStart.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        panX: pan.x,
        panY: pan.y,
      }
      return
    }

    if (images.length < 2) return
    pointerStartX.current = event.clientX
  }

  const completeSwipe = (clientX: number) => {
    if (pointerStartX.current === null || images.length < 2) return
    const distance = pointerStartX.current - clientX
    if (Math.abs(distance) < 40) return
    pointerStartX.current = null
    showRelativeImage(distance > 0 ? 1 : -1)
  }

  const movePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!activePointers.current.has(event.pointerId)) return

    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const pointers = [...activePointers.current.values()]
    if (pointers.length >= 2 && pinchStart.current) {
      const distance = Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y)
      applyZoom(pinchStart.current.zoom * distance / Math.max(1, pinchStart.current.distance))
      return
    }

    if (zoom <= 1) {
      completeSwipe(event.clientX)
      return
    }

    if (dragStart.current?.pointerId === event.pointerId) {
      setPan(clampPan(
        dragStart.current.panX + event.clientX - dragStart.current.x,
        dragStart.current.panY + event.clientY - dragStart.current.y,
      ))
    }
  }

  const endSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (zoom <= 1) completeSwipe(event.clientX)
    pointerStartX.current = null
    activePointers.current.delete(event.pointerId)
    if (activePointers.current.size < 2) pinchStart.current = null
    if (dragStart.current?.pointerId === event.pointerId) dragStart.current = null
  }

  const cancelPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointerStartX.current = null
    activePointers.current.delete(event.pointerId)
    if (activePointers.current.size < 2) pinchStart.current = null
    if (dragStart.current?.pointerId === event.pointerId) dragStart.current = null
  }

  const highlights = [
    {
      key: 'size',
      label: 'Размер',
      value: formatFootprint(building),
      icon: <Grid2X2 size={18} strokeWidth={1.8} />,
    },
    {
      key: 'boost',
      label: building.boost.kind === 'capacity' ? 'Вместимость' : 'Бонус населения',
      value: formatBoost(building.boost),
      icon: <Users size={18} strokeWidth={1.8} />,
    },
  ]
  if (building.specialization) {
    highlights.push({
      key: 'specialization',
      label: 'Специализация',
      value: building.specialization,
      icon: <SpecializationIcon specialization={building.specialization} />,
    })
  }
  if (building.effectArea) {
    highlights.push({
      key: 'area',
      label: 'Область действия',
      value: formatEffectArea(building.effectArea),
      icon: <Scan size={18} strokeWidth={1.8} />,
    })
  }

  const meaningfulEvent = building.event && !/^популярн(?:ый|ое) объект$/i.test(building.event.trim())
    ? building.event
    : null
  const effectDetails = [
    meaningfulEvent,
    images.some((image) => image.kind === 'event') ? 'Есть отдельное фото события / эффекта' : null,
    images.some((image) => image.kind === 'night') ? 'Доступен отдельный ночной вид' : null,
  ].filter((value): value is string => Boolean(value))

  const facts: Array<[string, string]> = []
  if (building.section === 'mayor') {
    facts.push(
      ['Сезон', '№ ' + (building.season ?? '—') + ' · ' + (building.seasonName ?? 'Название неизвестно')],
      ['Дата выхода', building.released ?? 'Не указана'],
      ['Уровень абонемента', building.tier ? 'Уровень ' + building.tier : 'Не указан'],
      ['Тип награды', building.passType ?? 'Не указан'],
    )
  } else {
    if (building.released) facts.push(['Дата появления', building.released])
    if (building.seasonName) facts.push(['Тема', building.seasonName])
    if (building.availability) facts.push(['Доступность', building.availability])
  }
  if (building.traits.length) {
    facts.push(['Особенности', building.traits.map((trait) => featureTraitLabels[trait]).join(' · ')])
  }
  if (effectDetails.length) facts.push(['События и эффекты', effectDetails.join(' · ')])
  if (building.aliases.length) facts.push(['Другие названия', building.aliases.join(' · ')])

  return (
    <dialog
      ref={ref}
      className="detail-dialog"
      aria-labelledby="building-detail-heading"
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) ref.current?.close()
      }}
    >
      <div className="detail-dialog__shell">
        <button type="button" className="dialog-close" aria-label="Закрыть" onClick={() => ref.current?.close()}>
          <X size={21} />
        </button>
        <div className="detail-dialog__media">
          <div
            ref={stageRef}
            className={`detail-dialog__stage${zoom > 1 ? ' is-zoomed' : ''}`}
            onPointerDown={beginSwipe}
            onPointerMove={movePointer}
            onPointerUp={endSwipe}
            onPointerCancel={cancelPointer}
            onDoubleClick={(event) => {
              if (!(event.target as HTMLElement).closest('button')) applyZoom(zoom > 1 ? 1 : 2)
            }}
            onWheel={(event) => {
              if (!event.ctrlKey && !event.metaKey) return
              event.preventDefault()
              applyZoom(zoom + (event.deltaY < 0 ? 0.5 : -0.5))
            }}
          >
            {activeImage ? (
              <img
                ref={imageRef}
                src={activeImage.src}
                alt={building.name + ' — ' + activeImage.label}
                draggable={false}
                style={{
                  objectPosition: activeImage.focus,
                  transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                }}
              />
            ) : (
              <Building2 size={72} />
            )}
            {activeImage && (
              <div className="detail-dialog__zoom-controls" role="group" aria-label="Масштаб фотографии">
                <button
                  type="button"
                  aria-label="Уменьшить фотографию"
                  title="Уменьшить"
                  disabled={zoom <= 1}
                  onClick={() => applyZoom(zoom - 0.5)}
                >
                  <ZoomOut size={16} />
                </button>
                <span aria-live="polite">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  aria-label="Увеличить фотографию"
                  title="Увеличить"
                  disabled={zoom >= 4}
                  onClick={() => applyZoom(zoom + 0.5)}
                >
                  <ZoomIn size={16} />
                </button>
                {zoom > 1 && (
                  <button type="button" aria-label="Сбросить масштаб" title="Сбросить масштаб" onClick={resetZoom}>
                    <RotateCcw size={15} />
                  </button>
                )}
              </div>
            )}
            <span className="detail-dialog__badge">
              {building.section === 'mayor'
                ? <Crown size={15} />
                : <SpecializationIcon specialization={building.specialization} />}
              {building.section === 'mayor' ? 'Сезон ' + building.season : building.specialization}
            </span>
            {images.length > 1 && (
              <>
                {zoom === 1 && canShowPrevious && (
                  <button
                    type="button"
                    className="gallery-arrow gallery-arrow--previous"
                    aria-label="Предыдущее фото"
                    onClick={() => showRelativeImage(-1)}
                  >
                    <ChevronLeft size={22} />
                  </button>
                )}
                {zoom === 1 && canShowNext && (
                  <button
                    type="button"
                    className="gallery-arrow gallery-arrow--next"
                    aria-label="Следующее фото"
                    onClick={() => showRelativeImage(1)}
                  >
                    <ChevronRight size={22} />
                  </button>
                )}
                <span className="detail-dialog__counter" aria-live="polite">
                  {formatPhotoCount(images.length)}
                </span>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="detail-dialog__thumbnails" role="group" aria-label="Фотографии здания">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={image.src}
                  className={index === activeImageIndex ? 'is-active' : ''}
                  aria-label={'Показать фото: ' + image.label}
                  aria-pressed={index === activeImageIndex}
                  onClick={() => setActiveImageIndex(index)}
                >
                  <img src={image.src} alt="" loading="lazy" />
                  <span>{image.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-dialog__content">
          <p className="detail-dialog__eyebrow">Карточка городского архива</p>
          <h2 id="building-detail-heading">{building.name}</h2>
          {building.originalName && <p className="detail-dialog__original" lang="en">{building.originalName}</p>}
          {building.isFeatured && (
            <span className="detail-dialog__feature">
              <Sparkles size={14} /> {featureSummary(building)}
            </span>
          )}
          <dl className="detail-dialog__highlights" aria-label="Основные характеристики">
            {highlights.map((item) => (
              <div key={item.key} className={`detail-highlight detail-highlight--${item.key}`}>
                <span aria-hidden="true">{item.icon}</span>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
          <dl className="detail-dialog__facts">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <FavoriteButton building={building} active={favorite} onToggle={onFavorite} variant="dialog" />
        </div>
      </div>
    </dialog>
  )
}

interface MobileFilterDialogProps extends FilterPanelProps {
  open: boolean
  resultCount: number
  onClose: () => void
  onReset: () => void
}

function MobileFilterDialog({ open, resultCount, onClose, onReset, ...panelProps }: MobileFilterDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={ref} className="mobile-filter-dialog" aria-labelledby="mobile-filter-heading" onClose={onClose} onCancel={onClose}>
      <div className="mobile-filter-dialog__header">
        <div>
          <span>Настроить выдачу</span>
          <h2 id="mobile-filter-heading">Фильтры и сортировка</h2>
        </div>
        <button type="button" className="dialog-close" aria-label="Закрыть фильтры" onClick={() => ref.current?.close()}>
          <X size={21} />
        </button>
      </div>
      <FilterPanel {...panelProps} />
      <div className="mobile-filter-dialog__footer">
        <button type="button" className="button-secondary" onClick={onReset}>
          <RotateCcw size={16} /> Сбросить
        </button>
        <button type="button" className="button-primary" onClick={() => ref.current?.close()}>
          Показать {pluralizeBuildings(resultCount)}
        </button>
      </div>
    </dialog>
  )
}

interface FavoriteImportDialogProps {
  open: boolean
  onClose: () => void
  onAdd: (ids: string[]) => void
}

function FavoriteImportDialog({ open, onClose, onAdd }: FavoriteImportDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [value, setValue] = useState('')
  const [choices, setChoices] = useState<Record<number, string>>({})
  const [clipboardMessage, setClipboardMessage] = useState<string | null>(null)
  const result = useMemo(() => matchFavoriteNames(value, catalog.buildings), [value])
  const selectedIds = Object.values(choices)
  const idsToAdd = [...new Set([...result.matchedIds, ...selectedIds])]

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const changeValue = (next: string) => {
    setValue(next)
    setChoices({})
    setClipboardMessage(null)
  }

  const pasteFromClipboard = async () => {
    try {
      changeValue(await navigator.clipboard.readText())
    } catch {
      setClipboardMessage('Браузер не разрешил чтение буфера. Вставьте список в поле сочетанием Ctrl+V.')
    }
  }

  const addAndClose = () => {
    if (idsToAdd.length === 0) return
    onAdd(idsToAdd)
    setValue('')
    setChoices({})
    ref.current?.close()
  }

  return (
    <dialog
      ref={ref}
      className="favorite-import-dialog"
      aria-labelledby="favorite-import-heading"
      onClose={onClose}
      onCancel={onClose}
    >
      <div className="favorite-import-dialog__header">
        <div>
          <span>Обмен подборками</span>
          <h2 id="favorite-import-heading">Добавить здания из списка</h2>
          <p>Вставьте русские или английские названия — по одному в строке. Текущее избранное сохранится.</p>
        </div>
        <button type="button" className="dialog-close" aria-label="Закрыть импорт" onClick={() => ref.current?.close()}>
          <X size={21} />
        </button>
      </div>

      <button type="button" className="clipboard-paste-button" onClick={pasteFromClipboard}>
        <ClipboardPaste size={18} /> Вставить из буфера
      </button>
      {clipboardMessage && <p className="favorite-import-dialog__message" role="status">{clipboardMessage}</p>}

      <label className="favorite-import-dialog__field">
        <span>Названия зданий</span>
        <textarea
          aria-label="Список названий зданий"
          value={value}
          onChange={(event) => changeValue(event.target.value)}
          placeholder={'Космопорт\nGhost Portal\nЧайный домик'}
          rows={8}
          autoFocus
        />
      </label>

      {value.trim() && (
        <div className="favorite-import-dialog__report" aria-live="polite">
          <div className="import-summary">
            <span><Check size={15} /> Найдено: <strong>{result.matched.length}</strong></span>
            <span>Нужно уточнить: <strong>{result.ambiguous.length}</strong></span>
            <span>Не найдено: <strong>{result.notFound.length}</strong></span>
          </div>

          {result.ambiguous.map((ambiguity, ambiguityIndex) => (
            <fieldset key={ambiguity.input + ambiguityIndex} className="import-ambiguity">
              <legend>Какое здание «{ambiguity.input}»?</legend>
              {ambiguity.candidates.map((candidate) => (
                <label key={candidate.id}>
                  <input
                    type="radio"
                    name={'ambiguity-' + ambiguityIndex}
                    checked={choices[ambiguityIndex] === candidate.id}
                    onChange={() => setChoices((current) => ({ ...current, [ambiguityIndex]: candidate.id }))}
                  />
                  <span>
                    <strong>{candidate.name}</strong>
                    <small>
                      {candidate.section === 'mayor'
                        ? 'Сезон ' + (candidate.season ?? '—') + ' · ' + (candidate.seasonName ?? 'без темы')
                        : (candidate.specialization ?? 'Без категории') + ' · ' + (candidate.released ?? 'дата неизвестна')}
                    </small>
                  </span>
                </label>
              ))}
            </fieldset>
          ))}

          {result.notFound.length > 0 && (
            <details className="import-not-found">
              <summary>Показать ненайденные названия</summary>
              <ul>
                {result.notFound.map((name, index) => <li key={name + index}>{name}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}

      <div className="favorite-import-dialog__footer">
        <button type="button" className="button-secondary" onClick={() => ref.current?.close()}>Отмена</button>
        <button type="button" className="button-primary" disabled={idsToAdd.length === 0} onClick={addAndClose}>
          Добавить {pluralizeBuildings(idsToAdd.length)}
        </button>
      </div>
    </dialog>
  )
}

interface ClearFavoritesDialogProps {
  open: boolean
  count: number
  onClose: () => void
  onConfirm: () => void
}

function ClearFavoritesDialog({ open, count, onClose, onConfirm }: ClearFavoritesDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="clear-favorites-dialog"
      aria-labelledby="clear-favorites-heading"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <div className="clear-favorites-dialog__body">
        <span className="clear-favorites-dialog__icon" aria-hidden="true">
          <AlertTriangle size={25} />
        </span>
        <p className="clear-favorites-dialog__eyebrow">Нужно подтверждение</p>
        <h2 id="clear-favorites-heading">Очистить всё избранное?</h2>
        <p>
          Из подборки будет удалено <strong>{pluralizeBuildings(count)}</strong>.
          Восстановить список можно будет только повторным добавлением или импортом.
        </p>
      </div>
      <div className="clear-favorites-dialog__actions">
        <button type="button" className="button-secondary" autoFocus onClick={onClose}>
          Нет, оставить
        </button>
        <button
          type="button"
          className="button-danger button-danger--solid"
          onClick={() => {
            ref.current?.close()
            onConfirm()
          }}
        >
          <Trash2 size={16} /> Очистить {pluralizeBuildings(count)}
        </button>
      </div>
    </dialog>
  )
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme)
  const [section, setSection] = useState<Section>(initialState.section)
  const [view, setView] = useState<View>(initialState.view)
  const [filtersBySection, setFiltersBySection] = useState(initialState.filters)
  const [favoriteFilters, setFavoriteFilters] = useState(initialState.favoriteFilters)
  const [themedFilters, setThemedFilters] = useState(initialState.themedFilters)
  const [popularFilters, setPopularFilters] = useState(initialState.popularFilters)
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [favoriteImportOpen, setFavoriteImportOpen] = useState(false)
  const [clearFavoritesOpen, setClearFavoritesOpen] = useState(false)
  const [showScrollToFilters, setShowScrollToFilters] = useState(false)
  const [mobileColumns, setMobileColumns] = useState<MobileColumns>(readInitialMobileColumns)
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE)
  const [toast, setToast] = useState<string | null>(null)
  const { favoriteIds, toggleFavorite, addFavorites, clearFavorites } = useFavorites()

  const activeFilters = view === 'favorites'
    ? favoriteFilters
    : view === 'themes'
      ? themedFilters
    : view === 'popular'
      ? popularFilters
      : filtersBySection[section]
  const activeSection: Section | 'all' = view === 'catalog' ? section : 'all'
  const activeTheme = findCatalogTheme(themedFilters.theme)
  const themeBuildings = useMemo(
    () => view !== 'themes'
      ? catalog.buildings
      : catalog.buildings.filter((building) => activeTheme
        ? buildingMatchesTheme(building, activeTheme)
        : buildingThemeIds(building).length > 0),
    [activeTheme, view],
  )

  const availableBuildings = useMemo(
    () => themeBuildings.filter(
      (building) =>
        (activeSection === 'all' || building.section === activeSection) &&
        (view !== 'popular' || building.traits.includes('popular')),
    ),
    [activeSection, themeBuildings, view],
  )
  const footprints = useMemo(
    () => [...new Set(availableBuildings.map(footprintKey).filter((key) => key !== 'unknown'))]
      .sort((left, right) => {
        const [lw, ld] = left.split('x').map(Number)
        const [rw, rd] = right.split('x').map(Number)
        return lw * ld - rw * rd || lw - rw || ld - rd
      }),
    [availableBuildings],
  )

  const visibleBuildings = useMemo(
    () => filterAndSortBuildings(themeBuildings, {
      section: activeSection,
      filters: activeFilters,
      favoriteIds,
      favoritesOnly: view === 'favorites',
      popularOnly: view === 'popular',
    }),
    [activeFilters, activeSection, favoriteIds, themeBuildings, view],
  )
  const crossSection: Section = section === 'mayor' ? 'other' : 'mayor'
  const crossSectionMatches = useMemo(() => {
    const query = activeFilters.query.trim()
    if (view !== 'catalog' || visibleBuildings.length > 0 || !query) return []

    return filterAndSortBuildings(catalog.buildings, {
      section: crossSection,
      filters: { ...defaultFilters(crossSection), query, sort: 'name-asc' },
    }).slice(0, 3)
  }, [activeFilters.query, crossSection, view, visibleBuildings.length])
  const renderedBuildings = visibleBuildings.slice(0, visibleLimit)
  const favoriteShareText = useMemo(
    () => formatFavoriteShareText(catalog.buildings, favoriteIds),
    [favoriteIds],
  )

  const filterCount = [
    activeFilters.season !== 'all',
    activeFilters.specialization !== 'all',
    activeFilters.theme !== 'all',
    activeFilters.footprint !== 'all',
    activeFilters.featuredOnly,
  ].filter(Boolean).length

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      window.localStorage.setItem('scbi-catalog-theme', theme)
    } catch {
      // The theme still works for the current session when storage is unavailable.
    }
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#091615' : '#102b2c')
  }, [theme])

  useEffect(() => {
    try {
      window.localStorage.setItem('scbi-mobile-columns', String(mobileColumns))
    } catch {
      // The selected layout still works for the current session when storage is unavailable.
    }
  }, [mobileColumns])

  useEffect(() => {
    setVisibleLimit(PAGE_SIZE)
  }, [activeFilters, activeSection, view])

  useEffect(() => {
    const params = new URLSearchParams()
    if (view === 'favorites' || view === 'themes' || view === 'popular') params.set('view', view)
    else params.set('section', section)
    if (activeFilters.query.trim()) params.set('q', activeFilters.query.trim())
    if (activeFilters.footprint !== 'all') params.set('size', activeFilters.footprint)
    if (activeFilters.featuredOnly) params.set('rare', '1')
    if (view === 'catalog' && section === 'mayor' && activeFilters.season !== 'all') params.set('season', activeFilters.season)
    if (view === 'catalog' && section === 'other' && activeFilters.specialization !== 'all') params.set('spec', activeFilters.specialization)
    if (view === 'themes' && activeFilters.specialization !== 'all') params.set('spec', activeFilters.specialization)
    if (view === 'themes' && activeFilters.theme !== 'all') params.set('theme', activeFilters.theme)
    const defaultSort = view === 'favorites'
      ? 'name-asc'
      : view === 'popular' || view === 'themes'
        ? 'boost-desc'
        : defaultFilters(section).sort
    if (activeFilters.sort !== defaultSort) params.set('sort', activeFilters.sort)
    const query = params.toString()
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
  }, [activeFilters, section, view])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const updateFilters = (patch: Partial<SectionFilters>) => {
    if (view === 'favorites') {
      setFavoriteFilters((current) => ({ ...current, ...patch }))
    } else if (view === 'themes') {
      setThemedFilters((current) => ({ ...current, ...patch }))
    } else if (view === 'popular') {
      setPopularFilters((current) => ({ ...current, ...patch }))
    } else {
      setFiltersBySection((current) => ({
        ...current,
        [section]: { ...current[section], ...patch },
      }))
    }
  }

  const resetFilters = () => {
    if (view === 'favorites') {
      setFavoriteFilters({ ...defaultFilters('other'), sort: 'name-asc' })
    } else if (view === 'themes') {
      setThemedFilters({ ...defaultFilters('other'), sort: 'boost-desc' })
    } else if (view === 'popular') {
      setPopularFilters({ ...defaultFilters('other'), sort: 'boost-desc' })
    } else {
      setFiltersBySection((current) => ({ ...current, [section]: defaultFilters(section) }))
    }
  }

  const handleFavorite = (building: Building) => {
    const isNowFavorite = toggleFavorite(building.id)
    setToast(isNowFavorite ? 'Сохранено в избранном на этом устройстве' : 'Удалено из избранного')
  }

  const copyFavorites = async () => {
    if (!favoriteShareText) {
      setToast('Сначала добавьте хотя бы одно здание')
      return
    }

    try {
      await navigator.clipboard.writeText(favoriteShareText)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = favoriteShareText
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.append(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
    }
    setToast('Скопировано: ' + pluralizeBuildings(favoriteShareText.split('\n').length))
  }

  const importFavorites = (ids: string[]) => {
    const uniqueIds = [...new Set(ids)]
    const newCount = uniqueIds.filter((id) => !favoriteIds.has(id)).length
    addFavorites(uniqueIds)
    setView('favorites')
    setToast(newCount > 0 ? 'Добавлено: ' + pluralizeBuildings(newCount) : 'Все найденные здания уже были в избранном')
  }

  const confirmClearFavorites = () => {
    const removedCount = favoriteIds.size
    clearFavorites()
    setClearFavoritesOpen(false)
    setToast('Избранное очищено: ' + pluralizeBuildings(removedCount))
  }

  const showSection = (nextSection: Section) => {
    setSection(nextSection)
    setView('catalog')
  }

  const showPopular = () => {
    setView('popular')
  }

  const showThemes = () => {
    setView('themes')
  }

  const showFavoritesView = () => {
    setView('favorites')
    window.setTimeout(() => {
      document.getElementById('catalog-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  const toggleFavoritesView = () => {
    setView((current) => current === 'favorites' ? 'catalog' : 'favorites')
    window.setTimeout(() => {
      document.getElementById('catalog-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  const scrollToCatalogFilters = () => {
    const target = document.getElementById('catalog-controls')
    if (!target) return

    const stickyNav = document.querySelector<HTMLElement>('.catalog-nav-wrap')
    const stickyNavRect = stickyNav?.getBoundingClientRect()
    const navOccupiesTopEdge = Boolean(stickyNavRect && stickyNavRect.top <= 1)
    const stickyOffset = (navOccupiesTopEdge ? Math.ceil(stickyNavRect?.height ?? 0) : 0) + 16
    const targetTop = target.getBoundingClientRect().top + window.scrollY - stickyOffset
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
    target.focus({ preventScroll: true })
  }

  useEffect(() => {
    let frame = 0

    const updateVisibility = () => {
      const target = document.getElementById('catalog-controls')
      const stickyNav = document.querySelector<HTMLElement>('.catalog-nav-wrap')
      const stickyNavRect = stickyNav?.getBoundingClientRect()
      const stickyHeight = stickyNavRect && stickyNavRect.top <= 1 ? stickyNavRect.height : 0
      setShowScrollToFilters(Boolean(target && target.getBoundingClientRect().bottom < stickyHeight))
    }

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(updateVisibility)
    }

    updateVisibility()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [])

  const returnToCatalog = () => {
    setView('catalog')
    window.setTimeout(scrollToCatalogFilters, 0)
  }

  const showCrossSectionMatches = () => {
    const query = activeFilters.query.trim()
    setFiltersBySection((current) => ({
      ...current,
      [crossSection]: { ...defaultFilters(crossSection), query },
    }))
    setSection(crossSection)
    setView('catalog')
    window.setTimeout(scrollToCatalogFilters, 0)
  }

  const activeSectionTitle = view === 'favorites'
    ? 'Ваше избранное'
    : view === 'themes'
      ? activeTheme?.label ?? 'Тематические подборки'
    : view === 'popular'
      ? 'Популярные здания'
      : sectionLabels[section].title
  const activeSectionDescription = view === 'favorites'
    ? 'Копируйте список названий или вставляйте подборку другого человека.'
    : view === 'themes'
      ? activeTheme?.description ?? 'Здания из всего каталога, собранные по регионам, архитектуре и настроению.'
    : view === 'popular'
      ? 'Объекты, отмеченные как популярные в актуальной таблице каталога.'
      : section === 'mayor'
        ? 'Коллекция зданий из 71 сезона Абонемента мэра.'
        : 'Пляжи, горы, парки, монументы и другие особые объекты.'
  const activeSectionKicker = view === 'favorites'
    ? 'Личная коллекция'
    : view === 'themes'
      ? activeTheme
        ? (
          <>
            <span className="section-kicker__theme-icon">
              <CatalogThemeIcon themeId={activeTheme.id} fallback={activeTheme.icon} />
            </span>
            {THEME_COUNTS.get(activeTheme.id) ?? 0} объектов в подборке
          </>
        )
        : `${catalogThemes.length} тематик · ${THEMED_BUILDINGS_COUNT} объектов`
    : view === 'popular'
      ? POPULAR_BUILDINGS_COUNT + ' популярных объектов'
      : sectionLabels[section].eyebrow

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__grid" aria-hidden="true" />
        <div className="site-header__top page-width">
          <a className="brand" href="./" aria-label="Городской архив — на главную">
            <span className="brand__mark"><Archive size={22} /></span>
            <span>
              <strong>Городской архив</strong>
              <small>SimCity BuildIt</small>
            </span>
          </a>
          <div className="header-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
              title={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
            </button>
            <button
              type="button"
              className="header-import-button"
              onClick={() => setFavoriteImportOpen(true)}
              aria-label="Вставить список зданий в избранное"
            >
              <ClipboardPaste size={18} />
              <span>Вставить список</span>
            </button>
          </div>
        </div>

        <div className="hero page-width">
          <div className="hero__copy">
            <p className="eyebrow"><span /> Независимая библиотека зданий</p>
            <h1>Город — в деталях.<br /><em>Все здания</em> под рукой.</h1>
            <p>Смотрите размеры, бонусы, сезоны и даты выхода. Собирайте собственную подборку без регистрации.</p>
            <div className="hero__ledger" aria-label="Статистика каталога">
              <div><strong>{catalog.meta.counts.mayor}</strong><span>Абонемент мэра</span></div>
              <div><strong>{catalog.meta.counts.other}</strong><span>Другие здания</span></div>
              <div><strong>{catalog.meta.counts.mayor + catalog.meta.counts.other}</strong><span>Всего карточек</span></div>
            </div>
          </div>
          <HeroVisual />
        </div>
      </header>

      <div className="floating-actions">
        {showScrollToFilters && (
          <button
            type="button"
            className="scroll-to-filters"
            onClick={scrollToCatalogFilters}
            aria-label="Наверх к фильтрам каталога"
            title="Наверх к фильтрам"
          >
            <ArrowUp size={18} aria-hidden="true" />
            <span>Наверх</span>
          </button>
        )}
        <button
          type="button"
          className={`favorites-button floating-favorites${view === 'favorites' ? ' is-active' : ''}`}
          onClick={toggleFavoritesView}
          aria-pressed={view === 'favorites'}
          aria-label={`Избранное ${favoriteIds.size}`}
          title="Открыть избранное"
        >
          <Heart size={18} fill={view === 'favorites' ? 'currentColor' : 'none'} />
          <span>Избранное</span>
          <b>{favoriteIds.size}</b>
        </button>
      </div>

      <main>
        <div className="catalog-nav-wrap">
          <div className="catalog-nav page-width" aria-label="Разделы каталога">
            <button
              type="button"
              className={view === 'catalog' && section === 'mayor' ? 'is-active' : ''}
              onClick={() => showSection('mayor')}
              aria-current={view === 'catalog' && section === 'mayor' ? 'page' : undefined}
            >
              <span className="catalog-nav__icon"><Crown size={19} /></span>
              <span><strong>Абонемент мэра</strong><small>{catalog.meta.counts.mayor} зданий · 71 сезон</small></span>
            </button>
            <button
              type="button"
              className={view === 'catalog' && section === 'other' ? 'is-active' : ''}
              onClick={() => showSection('other')}
              aria-current={view === 'catalog' && section === 'other' ? 'page' : undefined}
            >
              <span className="catalog-nav__icon"><MapIcon size={19} /></span>
              <span><strong>Другие здания</strong><small>{catalog.meta.counts.other} зданий · 16 категорий</small></span>
            </button>
            <button
              type="button"
              className={view === 'themes' ? 'is-active' : ''}
              onClick={showThemes}
              aria-current={view === 'themes' ? 'page' : undefined}
            >
              <span className="catalog-nav__icon"><Shapes size={19} /></span>
              <span><strong>Тематические</strong><small>{catalogThemes.length} тем · {THEMED_BUILDINGS_COUNT} объектов</small></span>
            </button>
            <button
              type="button"
              className={view === 'popular' ? 'is-active' : ''}
              onClick={showPopular}
              aria-current={view === 'popular' ? 'page' : undefined}
            >
              <span className="catalog-nav__icon"><Sparkles size={19} /></span>
              <span><strong>Популярные</strong><small>{POPULAR_BUILDINGS_COUNT} зданий из таблицы</small></span>
            </button>
          </div>
        </div>

        <section className="catalog-section page-width" aria-labelledby="catalog-heading">
          <div className="catalog-heading-row">
            <div>
              <p className="section-kicker">{activeSectionKicker}</p>
              <h2 id="catalog-heading">{activeSectionTitle}</h2>
              <p>{activeSectionDescription}</p>
            </div>
          </div>

          <div className="collection-bar collection-bar--mobile-dock" aria-label="Обмен избранным">
            <div className="collection-bar__summary">
              <span className="collection-bar__icon"><Heart size={18} fill={favoriteIds.size ? 'currentColor' : 'none'} /></span>
              <span className="collection-bar__copy">
                <strong>Поделиться избранным</strong>
                <small>{favoriteIds.size ? `${pluralizeBuildings(favoriteIds.size)} в подборке` : 'Добавляйте здания сердцем'}</small>
              </span>
              <button
                type="button"
                className="collection-bar__open"
                onClick={showFavoritesView}
                aria-label="Перейти в избранное"
                aria-current={view === 'favorites' ? 'page' : undefined}
              >
                <span>Перейти</span>
                <ChevronRight size={15} aria-hidden="true" />
              </button>
            </div>
            <div className="favorite-actions">
              <span className="local-note"><Info size={15} /> На этом устройстве</span>
              <button
                type="button"
                className="button-danger"
                disabled={favoriteIds.size === 0}
                onClick={() => setClearFavoritesOpen(true)}
                aria-label="Очистить всё избранное"
                title="Очистить всё избранное"
              >
                <Trash2 size={16} /> Очистить
              </button>
              <button type="button" className="button-primary" onClick={() => setFavoriteImportOpen(true)}>
                <ClipboardPaste size={16} />
                <span className="favorite-action-label--full">Вставить список</span>
                <span className="favorite-action-label--compact">Вставить</span>
              </button>
              <button
                type="button"
                className="button-secondary"
                disabled={!favoriteShareText}
                onClick={copyFavorites}
                aria-label="Копировать все названия"
                title="Копировать все названия"
              >
                <Copy size={16} /> Копировать
              </button>
            </div>
          </div>

          <div
            id="catalog-controls"
            className="search-row"
            role="region"
            aria-label="Поиск и фильтры каталога"
            tabIndex={-1}
          >
            <label className="search-field">
              <Search size={20} aria-hidden="true" />
              <span className="sr-only">Поиск зданий</span>
              <input
                type="search"
                value={activeFilters.query}
                onChange={(event) => updateFilters({ query: event.target.value })}
                placeholder="Название здания, сезон или категория…"
                autoComplete="off"
              />
              {activeFilters.query && (
                <button type="button" onClick={() => updateFilters({ query: '' })} aria-label="Очистить поиск">
                  <X size={17} />
                </button>
              )}
            </label>
            <button type="button" className="mobile-filter-button" onClick={() => setMobileFiltersOpen(true)}>
              <SlidersHorizontal size={18} /> Фильтры{filterCount > 0 && <b>{filterCount}</b>}
            </button>
          </div>

          <div className="desktop-filters" role="region" aria-label="Фильтры каталога">
            <FilterPanel
              section={section}
              view={view}
              filters={activeFilters}
              footprints={footprints}
              onChange={updateFilters}
            />
          </div>

          {view === 'catalog' && section === 'other' && (
            <div className="specialization-rail" aria-label="Быстрый выбор специализации">
              <button
                type="button"
                className={activeFilters.specialization === 'all' ? 'is-active' : ''}
                onClick={() => updateFilters({ specialization: 'all' })}
              >
                <span className='specialization-rail__icon' aria-hidden='true'><AllSpecializationsIcon /></span>
                <span>Все</span>
              </button>
              {catalog.meta.specializations.map((specialization) => (
                <button
                  type="button"
                  key={specialization}
                  className={activeFilters.specialization === specialization ? 'is-active' : ''}
                  onClick={() => updateFilters({ specialization })}
                >
                  <span className='specialization-rail__icon'><SpecializationIcon specialization={specialization} /></span>
                  <span>{specialization}</span>
                </button>
              ))}
            </div>
          )}

          {view === 'themes' && (
            <div className="theme-rail" aria-label="Выбор тематики">
              <button
                type="button"
                className={activeFilters.theme === 'all' ? 'is-active' : ''}
                onClick={() => updateFilters({ theme: 'all' })}
                aria-pressed={activeFilters.theme === 'all'}
              >
                <span className="theme-rail__icon" aria-hidden="true">✦</span>
                <span><strong>Все темы</strong><small>{THEMED_BUILDINGS_COUNT} объектов</small></span>
              </button>
              {catalogThemes.map((theme) => (
                <button
                  type="button"
                  key={theme.id}
                  className={activeFilters.theme === theme.id ? 'is-active' : ''}
                  onClick={() => updateFilters({ theme: theme.id })}
                  aria-pressed={activeFilters.theme === theme.id}
                  title={theme.description}
                >
                  <span className="theme-rail__icon" aria-hidden="true">
                    <CatalogThemeIcon themeId={theme.id} fallback={theme.icon} />
                  </span>
                  <span><strong>{theme.label}</strong><small>{THEME_COUNTS.get(theme.id) ?? 0} объектов</small></span>
                </button>
              ))}
            </div>
          )}

          <div className="results-toolbar">
            <p aria-live="polite">
              <strong>{pluralizeBuildings(visibleBuildings.length)}</strong>
              {activeFilters.query && <span> по запросу «{activeFilters.query}»</span>}
            </p>
            <div className="results-toolbar__actions">
              <div className="mobile-layout-toggle" role="group" aria-label="Карточек в одном ряду">
                <button
                  type="button"
                  className={mobileColumns === 1 ? 'is-active' : ''}
                  aria-pressed={mobileColumns === 1}
                  aria-label="Показывать по одному зданию в ряду"
                  title="По одному зданию"
                  onClick={() => setMobileColumns(1)}
                >
                  <Building2 size={15} aria-hidden="true" /> 1
                </button>
                <button
                  type="button"
                  className={mobileColumns === 2 ? 'is-active' : ''}
                  aria-pressed={mobileColumns === 2}
                  aria-label="Показывать по два здания в ряду"
                  title="По два здания"
                  onClick={() => setMobileColumns(2)}
                >
                  <Grid2X2 size={15} aria-hidden="true" /> 2
                </button>
              </div>
              {(filterCount > 0 || activeFilters.query) && (
                <button type="button" onClick={resetFilters}><RotateCcw size={15} /> Сбросить всё</button>
              )}
            </div>
          </div>

          {view === 'favorites' && (
            <button type="button" className="mobile-catalog-return mobile-catalog-return--top" onClick={returnToCatalog}>
              <ChevronLeft size={17} aria-hidden="true" /> Вернуться в каталог
            </button>
          )}

          {visibleBuildings.length > 0 ? (
            <>
              <div className={`building-grid building-grid--mobile-${mobileColumns}`} role="list" aria-label="Результаты каталога">
                {renderedBuildings.map((building) => (
                  <BuildingCard
                    key={building.id}
                    building={building}
                    favorite={favoriteIds.has(building.id)}
                    onFavorite={handleFavorite}
                    onOpen={setSelectedBuilding}
                  />
                ))}
              </div>
              {renderedBuildings.length < visibleBuildings.length && (
                <div className="load-more">
                  <p>Показано <strong>{renderedBuildings.length}</strong> из {visibleBuildings.length}</p>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setVisibleLimit((current) => current + PAGE_SIZE)}
                  >
                    Показать ещё {Math.min(PAGE_SIZE, visibleBuildings.length - renderedBuildings.length)}
                  </button>
                </div>
              )}
              {view === 'favorites' && (
                <button type="button" className="mobile-catalog-return mobile-catalog-return--bottom" onClick={returnToCatalog}>
                  <ChevronLeft size={17} aria-hidden="true" /> Вернуться в каталог
                </button>
              )}
            </>
          ) : (
            <div className="empty-state">
              <span><Sparkles size={30} /></span>
              <h3>{view === 'favorites' && favoriteIds.size === 0 ? 'Избранное пока пусто' : 'Таких зданий не найдено'}</h3>
              <p>
                {view === 'favorites' && favoriteIds.size === 0
                  ? 'Нажмите на сердце в карточке здания — оно останется здесь на этом устройстве.'
                  : 'Попробуйте изменить запрос или сбросить выбранные параметры.'}
              </p>
              {view === 'favorites' && favoriteIds.size === 0 ? (
                <div className="empty-state__actions">
                  <button type="button" className="button-primary" onClick={() => setFavoriteImportOpen(true)}>
                    <ClipboardPaste size={16} /> Вставить список зданий
                  </button>
                  <button type="button" className="button-secondary" onClick={() => setView('catalog')}>
                    Перейти в каталог
                  </button>
                </div>
              ) : (
                <div className="empty-state__actions">
                  {crossSectionMatches.length > 0 && (
                    <button
                      type="button"
                      className="cross-section-match"
                      onClick={showCrossSectionMatches}
                      aria-label={`Показать в ${crossSection === 'other' ? 'Других зданиях' : 'Абонементе мэра'}: ${crossSectionMatches.map((building) => building.name).join(', ')}`}
                    >
                      <span className="cross-section-match__icon" aria-hidden="true">
                        {crossSection === 'other' ? <MapIcon size={18} /> : <Crown size={18} />}
                      </span>
                      <span>
                        <small>Найдено в «{crossSection === 'other' ? 'Других зданиях' : 'Абонементе мэра'}»</small>
                        <strong>{crossSectionMatches.map((building) => building.name).join(' · ')}</strong>
                      </span>
                      <ChevronRight size={18} aria-hidden="true" />
                    </button>
                  )}
                  <button type="button" className="button-primary" onClick={resetFilters}>
                    Сбросить фильтры
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-width">
          <div className="brand brand--footer">
            <span className="brand__mark"><Archive size={19} /></span>
            <span><strong>Городской архив</strong><small>Каталог сообщества</small></span>
          </div>
          <p>Неофициальная библиотека зданий SimCity BuildIt. Названия и изображения используются в справочных целях.</p>
          <span>{catalog.meta.counts.mayor + catalog.meta.counts.other} карточек · обновлено по локальному каталогу</span>
        </div>
      </footer>

      <DetailDialog
        building={selectedBuilding}
        favorite={selectedBuilding ? favoriteIds.has(selectedBuilding.id) : false}
        onFavorite={handleFavorite}
        onClose={() => setSelectedBuilding(null)}
      />
      <MobileFilterDialog
        open={mobileFiltersOpen}
        section={section}
        view={view}
        filters={activeFilters}
        footprints={footprints}
        resultCount={visibleBuildings.length}
        onChange={updateFilters}
        onClose={() => setMobileFiltersOpen(false)}
        onReset={resetFilters}
      />
      <FavoriteImportDialog
        open={favoriteImportOpen}
        onClose={() => setFavoriteImportOpen(false)}
        onAdd={importFavorites}
      />
      <ClearFavoritesDialog
        open={clearFavoritesOpen}
        count={favoriteIds.size}
        onClose={() => setClearFavoritesOpen(false)}
        onConfirm={confirmClearFavorites}
      />

      {toast && (
        <div className="toast" role="status">
          <span><Check size={16} /></span>{toast}
        </div>
      )}
    </div>
  )
}
