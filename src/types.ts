export type Section = 'mayor' | 'other'
export type FeatureTrait = 'popular' | 'unique-effect' | 'upgradeable'

export type SortMode =
  | 'season-desc'
  | 'season-asc'
  | 'boost-desc'
  | 'boost-asc'
  | 'released-desc'
  | 'released-asc'
  | 'name-asc'

export interface Footprint {
  kind: 'grid' | 'linear' | 'unknown'
  label: string | null
  width: number | null
  depth: number | null
  length: number | null
  cells: number | null
}

export interface BuildingBoost {
  kind: 'populationPercent' | 'capacity' | 'unknown'
  label: string | null
  min: number | null
  max: number | null
  sortValue: number | null
}

export interface BuildingImage {
  src: string
  kind: 'main' | 'day' | 'night' | 'event'
  label: string
  focus?: string
}

export interface Building {
  id: string
  section: Section
  code: number | null
  name: string
  aliases: string[]
  originalName: string | null
  image: string | null
  images: BuildingImage[]
  footprint: Footprint
  boost: BuildingBoost
  season: number | null
  seasonName: string | null
  released: string | null
  tier: string | null
  passType: string | null
  event: string | null
  effectDescription: string | null
  isFeatured: boolean
  traits: FeatureTrait[]
  specialization: string | null
  effectArea: string | null
  availability: string | null
}

export interface CatalogMeta {
  schemaVersion: number
  counts: Record<Section, number>
  images: number
  missingImages: number
  galleryBuildings: number
  featuredBuildings: number
  seasons: Record<string, string>
  specializations: string[]
}

export interface CatalogData {
  meta: CatalogMeta
  buildings: Building[]
}

export interface SectionFilters {
  query: string
  season: string
  specialization: string
  theme: string
  footprint: string
  featuredOnly: boolean
  sort: SortMode
}
