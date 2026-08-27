from __future__ import annotations

import argparse
import hashlib
import importlib.util
import io
import json
import re
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

from PIL import Image


API_URL = "https://simcity-buildit.fandom.com/api.php"
USER_AGENT = "SimCityBuildingCatalog/1.0 (gallery maintenance)"
PROJECT_ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = PROJECT_ROOT / "src" / "data" / "catalog.json"
OUTPUT_PATH = Path(__file__).with_name("mayor_fandom_images.json")
IMAGE_DIR = Path(__file__).with_name("manual_images")
DEFAULT_TITLE_MAP = Path(r"D:\Obsidian\MAIND\Scripts\sheet_ru_to_en_mp.py")
DEFAULT_GALLERIES = Path(r"D:\Obsidian\MAIND\Scripts\galleries_v3.json")
DEFAULT_IMAGES = Path(r"D:\Obsidian\MAIND\Wiki\scbi_pdf_data\images")
DEFAULT_MATCHES = Path(r"D:\Obsidian\MAIND\Scripts\ru2en_matches.json")
DEFAULT_VK_DB = Path(r"D:\Obsidian\MAIND\Scripts\vk_photo_db.json")
DEFAULT_SEASON_TITLES = Path(r"D:\Obsidian\MAIND\Scripts\season_pages_v2.json")

EXTRA_TITLE_CANDIDATES = {
    "Яхт-клуб": ["(Alpha) Yacht Club", "Alpha Yacht Club"],
    "Набережная Кейптауна (пляж)": ["Cape Town Waterfront"],
    "Большой главный терминал": ["Grand Central Terminal"],
    "Центр деревни": ["Rustic Village Center"],
    "Университетский парк": ["University Park"],
    "Западный квартал": ["Western District"],
    "Фонтан на берегу озера": ["Lakeside Fountain Chicago"],
    "Абсолютно обычная пещера": ["The Completely Normal Cave"],
    "Абсолютно обычный маяк (пляж)": ["The Completely Normal Lighthouse"],
    "Абсолютно обычный пикник": ["The Completely Normal Picnic"],
    "Конюшня для пони": ["Pony Stable"],
    "Штаб кей-попа": ["K-Pop Headquarters"],
}

REJECT_MARKERS = (
    "req screen",
    "requirement",
    "info",
    "not placed",
    "in storage",
    "available",
    "availability",
    "tip",
    "letter",
    "mail",
    "announc",
    "showcase",
    "offer",
    "event track",
    "design challenge",
    "mayor's pass",
    "mayor pass",
    "menu",
    "icon",
    "storefront",
    "calendar",
    "comeback",
    "epic point",
    "season header",
    "season promo",
    "premium pass",
    "tier notification",
    "city album",
)


@dataclass(frozen=True)
class GalleryItem:
    file: str
    caption: str
    kind: str


@dataclass(frozen=True)
class PageGallery:
    requested_title: str
    canonical_title: str
    page_url: str
    main_file: str | None
    items: list[GalleryItem]
    seasons: frozenset[int]


@dataclass(frozen=True)
class CommunityImage:
    photo_id: str
    url: str
    source_page: str


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8-sig") as handle:
        return json.load(handle)


def api_request(params: dict[str, str]) -> dict[str, Any]:
    query = urllib.parse.urlencode({**params, "format": "json", "formatversion": "2"})
    request = urllib.request.Request(
        f"{API_URL}?{query}",
        headers={"User-Agent": USER_AGENT},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


@lru_cache(maxsize=32)
def fetch_wikitext(title: str) -> str | None:
    data = api_request(
        {
            "action": "query",
            "titles": title,
            "prop": "revisions",
            "rvprop": "content",
            "rvslots": "main",
            "redirects": "1",
        }
    )
    pages = data.get("query", {}).get("pages", [])
    if not pages or pages[0].get("missing"):
        return None
    return (
        pages[0]
        .get("revisions", [{}])[0]
        .get("slots", {})
        .get("main", {})
        .get("content")
    )


def season_tier_candidates(season_page: str | None, tier: str | None) -> list[str]:
    if not season_page or not tier or not str(tier).strip().isdigit():
        return []
    try:
        wikitext = fetch_wikitext(season_page)
    except Exception as error:
        print(f"    Season page error for {season_page}: {error}")
        return []
    if not wikitext:
        return []
    expected_tier = int(str(tier).strip())
    for block in re.split(r"(?m)^\|-\s*$", wikitext):
        tier_match = re.search(r"(?m)^\|\s*(\d+)\s*$", block)
        if not tier_match or int(tier_match.group(1)) != expected_tier:
            continue
        return unique_candidates(
            re.findall(r"'''\s*\[\[([^\]|#]+)", block)
        )
    return []


def load_title_map(path: Path) -> dict[str, str]:
    if not path.is_file():
        return {}
    spec = importlib.util.spec_from_file_location("mayor_title_map", path)
    if spec is None or spec.loader is None:
        return {}
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return dict(getattr(module, "MP_RU_TO_EN", {}))


def normalize_text(value: str) -> str:
    value = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", value)
    return re.sub(r"[_./()\-]+", " ", value).casefold()


def search_title_matches(candidate: str, result_title: str) -> bool:
    """Reject same-season search results that do not resemble the requested title."""
    ignored = {"and", "building", "club", "estate", "house", "of", "the"}
    candidate_words = {
        word for word in re.findall(r"[a-z0-9]+", normalize_text(candidate))
        if len(word) >= 3 and word not in ignored
    }
    result_words = {
        word for word in re.findall(r"[a-z0-9]+", normalize_text(result_title))
        if len(word) >= 3 and word not in ignored
    }
    return bool(candidate_words & result_words)


def legacy_image_name(value: str) -> str:
    digest = hashlib.md5(value.encode("utf-8")).hexdigest()[:8]
    stem = "".join(character if character.isalnum() else "_" for character in value)[:60]
    return f"{stem}_{digest}.jpg"


def is_usable_gallery_item(file_name: str, caption: str) -> bool:
    normalized = normalize_text(f"{file_name} {caption}")
    return not any(marker in normalized for marker in REJECT_MARKERS)


def image_kind(file_name: str, caption: str) -> str:
    normalized = normalize_text(f"{file_name} {caption}")
    if re.search(r"\b(night|nighttime|after dark|dusk|sunset|sundown)\b", normalized):
        return "night"
    if re.search(r"\b(event|effect|active|firework|parade|animation)\b", normalized):
        return "event"
    return "day"


def parse_infobox_image(wikitext: str) -> str | None:
    match = re.search(
        r"\{\{[^}]*[Bb]uilding\s*info\b.*?\|\s*image1?\s*=\s*([^|\n}]+)",
        wikitext,
        flags=re.DOTALL,
    )
    return match.group(1).strip() if match else None


def parse_gallery_items(wikitext: str, main_file: str | None) -> list[GalleryItem]:
    items: list[GalleryItem] = []
    seen: set[str] = set()
    normalized_main = (main_file or "").casefold().replace("file:", "").strip()
    for gallery in re.finditer(r"<gallery[^>]*>(.+?)</gallery>", wikitext, flags=re.DOTALL):
        for raw_line in gallery.group(1).splitlines():
            line = raw_line.strip()
            if not line:
                continue
            file_part, _, caption_part = line.partition("|")
            file_name = re.sub(r"^File:\s*", "", file_part.strip(), flags=re.IGNORECASE)
            if not file_name or file_name.casefold() == normalized_main or file_name.casefold() in seen:
                continue
            caption = re.sub(r"''+", "", caption_part.strip())
            caption = re.sub(r"\[\[(?:[^\]|]+\|)?([^\]]+)\]\]", r"\1", caption)
            if not is_usable_gallery_item(file_name, caption):
                continue
            seen.add(file_name.casefold())
            items.append(GalleryItem(file_name, caption, image_kind(file_name, caption)))
    return items


def fetch_page_gallery(title: str) -> PageGallery | None:
    data = api_request(
        {
            "action": "query",
            "titles": title,
            "prop": "revisions|categories",
            "rvprop": "content",
            "rvslots": "main",
            "cllimit": "max",
            "redirects": "1",
        }
    )
    pages = data.get("query", {}).get("pages", [])
    if not pages or pages[0].get("missing"):
        return None
    page = pages[0]
    wikitext = (
        page.get("revisions", [{}])[0]
        .get("slots", {})
        .get("main", {})
        .get("content")
    )
    if not wikitext or not re.search(r"\{\{[^}]*[Bb]uilding\s*info\b", wikitext, re.DOTALL):
        return None
    categories = {
        str(item.get("title", "")).removeprefix("Category:").casefold()
        for item in page.get("categories", [])
    }
    if any("mayor's pass season" in category for category in categories):
        return None
    canonical_title = str(page["title"])
    main_file = parse_infobox_image(wikitext)
    season_values = {
        int(value)
        for match in re.findall(r"Mayor['’]?s\s+Pass\s+Season\s+(\d+)|\bMP(\d+)\b", wikitext, re.IGNORECASE)
        for value in match
        if value
    }
    season_values.update(
        int(match.group(1))
        for category in categories
        if (match := re.search(r"\bmp\s*(\d+)\b", category, re.IGNORECASE))
    )
    return PageGallery(
        requested_title=title,
        canonical_title=canonical_title,
        page_url=f"https://simcity-buildit.fandom.com/wiki/{urllib.parse.quote(canonical_title.replace(' ', '_'))}",
        main_file=main_file,
        items=parse_gallery_items(wikitext, main_file),
        seasons=frozenset(season_values),
    )


def search_page_titles(query: str) -> list[str]:
    data = api_request(
        {
            "action": "query",
            "list": "search",
            "srsearch": query,
            "srnamespace": "0",
            "srlimit": "5",
        }
    )
    return [str(item["title"]) for item in data.get("query", {}).get("search", [])]


def unique_candidates(*groups: list[str | None]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for group in groups:
        for value in group:
            title = (value or "").strip()
            if title and title.casefold() not in seen:
                seen.add(title.casefold())
                result.append(title)
    return result


def local_gallery_sources(
    gallery_name: str,
    galleries: dict[str, dict[str, Any]],
    images_dir: Path,
) -> list[Path]:
    if gallery_name.startswith("VK:"):
        candidate = images_dir / legacy_image_name(f"VK_{gallery_name[3:]}")
        return [candidate] if candidate.is_file() else []

    gallery = galleries.get(gallery_name) or {}
    sources: list[Path] = []
    main_local = str(gallery.get("main_local") or "").strip()
    legacy_candidate = images_dir / legacy_image_name(gallery_name)
    main_candidate = images_dir / main_local if main_local else None
    if main_local.startswith("VK_") and legacy_candidate.is_file():
        sources.append(legacy_candidate)
    elif main_candidate and main_candidate.is_file():
        sources.append(main_candidate)
    elif legacy_candidate.is_file():
        sources.append(legacy_candidate)

    for item in gallery.get("items") or []:
        file_name = str(item.get("file_orig") or "")
        caption = " ".join(
            str(item.get(field) or "")
            for field in ("caption_orig", "caption_ru")
        )
        local_name = str(item.get("local") or "").strip()
        candidate = images_dir / local_name if local_name else None
        if (
            candidate
            and candidate.is_file()
            and is_usable_gallery_item(file_name, caption)
            and candidate not in sources
        ):
            sources.append(candidate)
    return sources


def file_digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def select_local_galleries(
    candidates: list[str],
    current_gallery: str | None,
    galleries: dict[str, dict[str, Any]],
    images_dir: Path,
    existing_web_images: list[str],
    limit: int,
) -> tuple[list[str], int]:
    seen_digests = {
        file_digest(PROJECT_ROOT / "public" / relative)
        for relative in existing_web_images
        if (PROJECT_ROOT / "public" / relative).is_file()
    }
    initial_count = len(seen_digests)
    selected: list[str] = []
    for gallery_name in candidates:
        if current_gallery and gallery_name.casefold() == current_gallery.casefold():
            continue
        sources = local_gallery_sources(gallery_name, galleries, images_dir)
        new_digests = {file_digest(source) for source in sources} - seen_digests
        if not new_digests:
            continue
        selected.append(gallery_name)
        seen_digests.update(new_digests)
        if len(seen_digests) - initial_count >= limit:
            break
    return selected, len(seen_digests) - initial_count


def normalized_building_name(value: str) -> str:
    value = re.sub(r"\([^)]*\)", "", value)
    value = value.replace("ё", "е").replace("Ё", "Е")
    return re.sub(r"[^\w]+", " ", value, flags=re.UNICODE).casefold().strip()


def find_community_image(database: dict[str, dict[str, Any]], building_name: str) -> CommunityImage | None:
    expected = normalized_building_name(building_name)
    matches: list[tuple[int, str, dict[str, Any]]] = []
    for photo_id, record in database.items():
        text = str(record.get("text") or "")
        title_match = re.search(r"^\s*Название:\s*(.+?)\s*$", text, flags=re.IGNORECASE | re.MULTILINE)
        if not title_match or normalized_building_name(title_match.group(1)) != expected:
            continue
        url = str(record.get("url") or "").strip()
        if not url:
            continue
        album_priority = 1 if str(record.get("album") or "").casefold() == "mayorpass" else 0
        matches.append((album_priority, str(photo_id), record))
    if not matches:
        return None
    _, photo_id, record = max(matches, key=lambda item: (item[0], int(item[2].get("date") or 0)))
    return CommunityImage(
        photo_id=photo_id,
        url=str(record["url"]),
        source_page=f"https://vk.com/photo-61529959_{photo_id}",
    )


def select_gallery(candidates: list[str], expected_season: int) -> PageGallery | None:
    galleries: list[PageGallery] = []
    for title in candidates:
        try:
            gallery = fetch_page_gallery(title)
        except Exception as error:  # Keep the audit moving if one page is temporarily unavailable.
            print(f"    API error for {title}: {error}")
            continue
        if gallery:
            galleries.append(gallery)
        time.sleep(0.06)
    best = max(galleries, key=lambda item: len(item.items), default=None)
    if best:
        return best

    searched_titles: list[str] = []
    for title in candidates:
        try:
            searched_titles.extend(search_page_titles(f'"{title}"'))
            if not searched_titles:
                searched_titles.extend(search_page_titles(title))
        except Exception as error:
            print(f"    Search error for {title}: {error}")
        time.sleep(0.06)
    for title in unique_candidates(searched_titles):
        if any(title.casefold() == item.canonical_title.casefold() for item in galleries):
            continue
        if not any(search_title_matches(candidate, title) for candidate in candidates):
            continue
        try:
            gallery = fetch_page_gallery(title)
        except Exception as error:
            print(f"    API error for search result {title}: {error}")
            continue
        if gallery and expected_season in gallery.seasons:
            galleries.append(gallery)
        time.sleep(0.06)
    return max(galleries, key=lambda item: len(item.items), default=None)


def select_items(items: list[GalleryItem], limit: int) -> list[GalleryItem]:
    selected: list[GalleryItem] = []
    for preferred_kind in ("day", "night", "event"):
        for item in items:
            if item.kind == preferred_kind and item not in selected:
                selected.append(item)
                break
    for item in items:
        if item not in selected:
            selected.append(item)
        if len(selected) >= limit:
            break
    return selected[:limit]


def get_image_url(file_name: str, width: int) -> str | None:
    data = api_request(
        {
            "action": "query",
            "titles": f"File:{file_name}",
            "prop": "imageinfo",
            "iiprop": "url|mime|size",
            "iiurlwidth": str(width),
        }
    )
    pages = data.get("query", {}).get("pages", [])
    if not pages:
        return None
    image_info = pages[0].get("imageinfo", [])
    if not image_info:
        return None
    return image_info[0].get("thumburl") or image_info[0].get("url")


def output_file_name(page_title: str, file_name: str) -> str:
    digest = hashlib.sha256(f"{page_title}|{file_name}".encode("utf-8")).hexdigest()[:20]
    return f"mayor-fandom-{digest}.webp"


def download_webp(url: str, target: Path, max_size: int) -> None:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=40) as response:
        raw = response.read()
    with Image.open(io.BytesIO(raw)) as image:
        image.load()
        if min(image.size) < 100:
            raise ValueError(f"Image is too small: {image.size}")
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA" if "transparency" in image.info else "RGB")
        image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        image.save(target, "WEBP", quality=82, method=6)


def label_for(item: GalleryItem) -> str:
    base = {"day": "Днём", "night": "Ночью", "event": "Эффект / активность"}[item.kind]
    return f"{base} · Fandom"


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync supplemental Mayor's Pass building photos from Fandom.")
    parser.add_argument("--apply", action="store_true", help="Download images and update the generated manifest.")
    parser.add_argument("--limit", type=int, default=3, help="Maximum supplemental images per building.")
    parser.add_argument("--max-size", type=int, default=1000, help="Maximum output width/height in pixels.")
    parser.add_argument("--title-map", type=Path, default=DEFAULT_TITLE_MAP)
    parser.add_argument("--galleries", type=Path, default=DEFAULT_GALLERIES)
    parser.add_argument("--images", type=Path, default=DEFAULT_IMAGES)
    parser.add_argument("--matches", type=Path, default=DEFAULT_MATCHES)
    parser.add_argument("--community-db", type=Path, default=DEFAULT_VK_DB)
    parser.add_argument("--season-titles", type=Path, default=DEFAULT_SEASON_TITLES)
    parser.add_argument("--min-season", type=int)
    args = parser.parse_args()

    catalog = load_json(CATALOG_PATH)
    title_map = load_title_map(args.title_map.resolve())
    galleries = load_json(args.galleries.resolve()).get("galleries", {})
    matches = load_json(args.matches.resolve()).get("mp", {})
    community_database = load_json(args.community_db.resolve())
    season_titles = load_json(args.season_titles.resolve())
    source_images_dir = args.images.resolve()
    existing_manifest = load_json(OUTPUT_PATH) if OUTPUT_PATH.is_file() else {"buildings": {}}
    existing_buildings = existing_manifest.get("buildings", {})
    targets = [
        item
        for item in catalog["buildings"]
        if item["section"] == "mayor"
        and len(item.get("images") or []) < 2
        and (args.min_season is None or int(item["season"]) >= args.min_season)
    ]

    manifest_buildings = dict(existing_buildings)
    matched = 0
    with_images = 0
    selected_images = 0
    local_images = 0
    print(f"Auditing {len(targets)} Mayor's Pass buildings with one photo...")

    for index, building in enumerate(targets, start=1):
        name = building["name"]
        tier_candidates = season_tier_candidates(
            season_titles.get(str(building["season"])),
            building.get("tier"),
        )
        candidates = unique_candidates(
            [building.get("originalName")],
            tier_candidates,
            [title_map.get(name)],
            EXTRA_TITLE_CANDIDATES.get(name, []),
            [f"VK:{name}"],
        )
        current_gallery = matches.get(name)
        local_galleries, local_count = select_local_galleries(
            candidates,
            current_gallery,
            galleries,
            source_images_dir,
            [image["src"] for image in building.get("images") or []],
            args.limit,
        )
        fandom_candidates = [candidate for candidate in candidates if not candidate.startswith("VK:")]
        gallery = select_gallery(fandom_candidates, int(building["season"]))
        live_items = list(gallery.items) if gallery else []
        local_has_gallery = bool(
            gallery
            and any(
                local.casefold() in {gallery.requested_title.casefold(), gallery.canonical_title.casefold()}
                for local in local_galleries
            )
        )
        if (
            gallery
            and str(current_gallery or "").startswith("VK:")
            and gallery.main_file
            and not local_has_gallery
        ):
            live_items.insert(0, GalleryItem(gallery.main_file, "Fandom main image", "day"))
        chosen = select_items(live_items, args.limit) if gallery else []
        if local_has_gallery and local_count > 1:
            chosen = []
        community_image = (
            None
            if str(current_gallery or "").startswith("VK:") or f"VK:{name}" in local_galleries
            else find_community_image(community_database, name)
        )
        if gallery:
            matched += 1
        if chosen:
            with_images += 1
            selected_images += len(chosen)
        if local_count:
            local_images += local_count
        print(
            f"[{index:02d}/{len(targets)}] S{building['season']} {name}: "
            f"{gallery.canonical_title if gallery else 'page not found'}; "
            f"local+={local_count} ({', '.join(local_galleries) or '-'}), "
            f"community+={1 if community_image else 0}, "
            f"live gallery={len(gallery.items) if gallery else 0}, selected={len(chosen)}"
        )

        if not args.apply:
            continue

        additional_images: list[dict[str, str]] = []
        IMAGE_DIR.mkdir(parents=True, exist_ok=True)
        if community_image:
            file_name = output_file_name(f"VK:{name}", community_image.photo_id)
            target = IMAGE_DIR / file_name
            if not target.is_file():
                download_webp(community_image.url, target, args.max_size)
            additional_images.append(
                {
                    "file": file_name,
                    "kind": "main",
                    "label": "Фото сообщества",
                    "sourcePage": community_image.source_page,
                    "sourceFile": community_image.photo_id,
                }
            )
        if gallery:
            for item in chosen:
                file_name = output_file_name(gallery.canonical_title, item.file)
                target = IMAGE_DIR / file_name
                if not target.is_file():
                    image_url = get_image_url(item.file, args.max_size)
                    if not image_url:
                        print(f"    No image URL for {item.file}")
                        continue
                    download_webp(image_url, target, args.max_size)
                    time.sleep(0.06)
                additional_images.append(
                    {
                        "file": file_name,
                        "kind": item.kind,
                        "label": label_for(item),
                        "sourcePage": gallery.page_url,
                        "sourceFile": item.file,
                    }
                )
        if local_galleries or additional_images:
            generated: dict[str, Any] = {}
            if gallery:
                generated["originalName"] = gallery.canonical_title
                generated["sourcePage"] = gallery.page_url
            if local_galleries:
                generated["additionalGalleries"] = local_galleries
            if additional_images:
                generated["additionalImages"] = additional_images
            manifest_buildings[name] = generated

    print(
        f"Result: pages={matched}/{len(targets)}, local supplemental images={local_images}, "
        f"community images={sum(1 for item in targets if not str(matches.get(item['name']) or '').startswith('VK:') and find_community_image(community_database, item['name']))}, "
        f"live-gallery buildings={with_images}, selected live images={selected_images}."
    )
    if args.apply:
        payload = {
            "sources": ["https://simcity-buildit.fandom.com/", "https://vk.com/simcitybuildit"],
            "buildings": dict(sorted(manifest_buildings.items(), key=lambda item: item[0].casefold())),
        }
        with OUTPUT_PATH.open("w", encoding="utf-8", newline="\n") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        print(f"Updated {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
