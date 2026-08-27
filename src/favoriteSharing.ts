export interface FavoriteBuilding {
  id: string
  code: number | null
  name: string
  aliases?: readonly string[]
  originalName: string | null
}

export interface FavoriteImportAmbiguity<T extends FavoriteBuilding = FavoriteBuilding> {
  input: string
  candidates: T[]
}

export interface FavoriteImportResult<T extends FavoriteBuilding = FavoriteBuilding> {
  matched: T[]
  matchedIds: string[]
  ambiguous: FavoriteImportAmbiguity<T>[]
  notFound: string[]
}

const russianCollator = new Intl.Collator('ru', {
  numeric: true,
  sensitivity: 'base',
})

export const normalizeFavoriteName = (value: string): string =>
  value
    .normalize('NFKC')
    .toLocaleLowerCase('ru')
    .replace(/ё/g, 'е')
    .replace(/[“”„«»]/g, '"')
    .replace(/[‐‑‒–—―]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()

const removeListMarker = (value: string): string => {
  let result = value.trim()
  let previous = ''

  while (result !== previous) {
    previous = result
    result = result
      .replace(/^\s*(?:[-*•◦▪▫–—]+|\[(?:\s|x|х|✓)\])\s+/iu, '')
      .replace(/^\s*\d{1,4}\s*[.):]\s+/u, '')
      .trim()
  }

  return result
}

export const parseFavoriteNames = (value: string): string[] =>
  value
    .split(/\r?\n|[;|\t]/u)
    .map(removeListMarker)
    .filter(Boolean)

const CODE_SUFFIX = /\s*(?:\[|\()\s*(?:код|code)\s*:?\s*(-?\d+)\s*(?:\]|\))\s*$/iu
const ID_SUFFIX = /\s*(?:\[|\()\s*(?:карточка|id)\s*:?\s*([^\]\)]+)\s*(?:\]|\))\s*$/iu

const parseEntry = (input: string): { name: string; code: number | null; id: string | null } => {
  const idMatch = input.match(ID_SUFFIX)
  if (idMatch) {
    return {
      name: input.slice(0, idMatch.index).trim(),
      code: null,
      id: idMatch[1].trim(),
    }
  }

  const codeMatch = input.match(CODE_SUFFIX)
  if (!codeMatch) return { name: input, code: null, id: null }

  return {
    name: input.slice(0, codeMatch.index).trim(),
    code: Number(codeMatch[1]),
    id: null,
  }
}

const uniqueById = <T extends FavoriteBuilding>(buildings: readonly T[]): T[] => {
  const result = new Map<string, T>()
  for (const building of buildings) {
    if (!result.has(building.id)) result.set(building.id, building)
  }
  return [...result.values()]
}

const buildAliasIndex = <T extends FavoriteBuilding>(buildings: readonly T[]): Map<string, T[]> => {
  const index = new Map<string, Map<string, T>>()

  for (const building of buildings) {
    for (const alias of [building.name, ...(building.aliases ?? []), building.originalName]) {
      if (!alias) continue
      const normalized = normalizeFavoriteName(alias)
      if (!normalized) continue

      const byCode = index.get(normalized) ?? new Map<string, T>()
      if (!byCode.has(building.id)) byCode.set(building.id, building)
      index.set(normalized, byCode)
    }
  }

  return new Map([...index].map(([alias, byCode]) => [alias, [...byCode.values()]]))
}

export const formatFavoriteShareText = <T extends FavoriteBuilding>(
  buildings: readonly T[],
  favoriteIds: ReadonlySet<string>,
): string => {
  const selected = uniqueById(buildings.filter((building) => favoriteIds.has(building.id)))
  const aliases = buildAliasIndex(buildings)

  return selected
    .sort((left, right) => russianCollator.compare(left.name, right.name))
    .map((building) => {
      const sameName = aliases.get(normalizeFavoriteName(building.name)) ?? []
      if (sameName.length <= 1) return building.name
      const sameCode = building.code === null
        ? []
        : sameName.filter((candidate) => candidate.code === building.code)
      return sameCode.length === 1
        ? `${building.name} [код: ${building.code}]`
        : `${building.name} [карточка: ${building.id}]`
    })
    .join('\n')
}

export const matchFavoriteNames = <T extends FavoriteBuilding>(
  value: string,
  buildings: readonly T[],
): FavoriteImportResult<T> => {
  const aliases = buildAliasIndex(buildings)
  const uniqueBuildings = uniqueById(buildings)
  const byId = new Map(uniqueBuildings.map((building) => [building.id, building]))
  const matchedById = new Map<string, T>()
  const ambiguous: FavoriteImportAmbiguity<T>[] = []
  const notFound: string[] = []

  for (const input of parseFavoriteNames(value)) {
    const parsed = parseEntry(input)
    const normalized = normalizeFavoriteName(parsed.name)
    let candidates = aliases.get(normalized) ?? []

    if (parsed.id !== null) {
      candidates = candidates.filter((candidate) => candidate.id === parsed.id)
    }

    if (parsed.code !== null) {
      candidates = candidates.filter((candidate) => candidate.code === parsed.code)
    }

    if (candidates.length === 0) {
      const idCandidate = parsed.id === null ? undefined : byId.get(parsed.id)
      const candidateAliases = idCandidate
        ? [idCandidate.name, ...(idCandidate.aliases ?? []), idCandidate.originalName]
            .filter(Boolean)
            .map((alias) => normalizeFavoriteName(String(alias)))
        : []
      if (idCandidate && candidateAliases.includes(normalized)) {
        candidates = [idCandidate]
      }
    }

    if (candidates.length === 0) {
      notFound.push(input)
      continue
    }

    if (candidates.length > 1) {
      ambiguous.push({ input, candidates })
      continue
    }

    const candidate = candidates[0]
    matchedById.set(candidate.id, candidate)
  }

  const matched = [...matchedById.values()]
  return {
    matched,
    matchedIds: matched.map((building) => building.id),
    ambiguous,
    notFound,
  }
}
