from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path
from typing import Any


DEFAULT_SCRIPTS = Path(r"D:\Obsidian\MAIND\Scripts")
DEFAULT_IMAGES = Path(r"D:\Obsidian\MAIND\Wiki\scbi_pdf_data\images")
PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_JSON = PROJECT_ROOT / "src" / "data" / "catalog.json"
OUTPUT_IMAGES = PROJECT_ROOT / "public" / "buildings"
MANUAL_IMAGES = Path(__file__).with_name("manual_images")


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8-sig") as handle:
        return json.load(handle)


def clean_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return None if text in {"", "–", "-", "—"} else text


def parse_number(value: Any) -> float | None:
    text = clean_text(value)
    if text is None:
        return None
    match = re.search(r"-?\d+(?:[.,]\d+)?", text.replace(" ", ""))
    return float(match.group(0).replace(",", ".")) if match else None


def parse_size(value: Any) -> dict[str, int] | None:
    text = clean_text(value)
    if text is None:
        return None
    match = re.search(r"(\d+)\s*[xх×]\s*(\d+)", text, flags=re.IGNORECASE)
    if not match:
        return None
    width, depth = int(match.group(1)), int(match.group(2))
    return {"width": width, "depth": depth, "cells": width * depth}


def parse_footprint(value: Any) -> dict[str, Any]:
    text = clean_text(value)
    if text is None:
        return {"kind": "unknown", "label": None, "width": None, "depth": None, "length": None, "cells": None}
    match = re.search(r"(\d+)\s*[x\u0445\u00d7]\s*(\d+)", text, flags=re.IGNORECASE)
    if match:
        width, depth = int(match.group(1)), int(match.group(2))
        return {
            "kind": "grid",
            "label": f"{width} \u00d7 {depth}",
            "width": width,
            "depth": depth,
            "length": None,
            "cells": width * depth,
        }
    if re.fullmatch(r"\d+", text):
        length = int(text)
        return {
            "kind": "linear",
            "label": str(length),
            "width": None,
            "depth": None,
            "length": length,
            "cells": None,
        }
    return {"kind": "unknown", "label": text, "width": None, "depth": None, "length": None, "cells": None}


def parse_boost(value: Any) -> dict[str, Any]:
    text = clean_text(value)
    if text is None:
        return {"kind": "unknown", "label": None, "min": None, "max": None, "sortValue": None}
    numbers = [float(part.replace(",", ".")) for part in re.findall(r"\d+(?:[.,]\d+)?", text)]
    if not numbers or re.search(r"\d\s*[x\u0445\u00d7]\s*\d", text, flags=re.IGNORECASE):
        return {"kind": "unknown", "label": text, "min": None, "max": None, "sortValue": None}
    minimum, maximum = min(numbers), max(numbers)
    capacity_word = "\u0432\u043c\u0435\u0441\u0442"
    kind = "capacity" if capacity_word in text.casefold() or maximum > 100 else "populationPercent"
    return {
        "kind": kind,
        "label": text,
        "min": minimum,
        "max": maximum,
        "sortValue": maximum if kind == "populationPercent" else None,
    }


def safe_image_name(source: Path) -> str:
    digest = hashlib.sha256(source.read_bytes()).hexdigest()[:20]
    return f"{digest}{source.suffix.lower()}"


def legacy_image_name(text: str) -> str:
    digest = hashlib.md5(text.encode("utf-8")).hexdigest()[:8]
    stem = "".join(char if char.isalnum() else "_" for char in text)[:60]
    return f"{stem}_{digest}.jpg"


IMAGE_ROLE_LABELS = {
    "main": "Основное фото",
    "day": "Днём",
    "night": "Ночью",
    "event": "Эффект / активность",
}

GALLERY_REJECT_MARKERS = (
    "req screen",
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
    "glitch",
    "bug",
    "error",
    "incorrect",
    "calendar",
    "comeback",
    "epic point",
    "in the mayor",
    "хранилищ",
    "доступ",
    "письм",
    "анонс",
    "витрин",
    "предложен",
    "испытан",
    "абонемент",
    "меню",
    "значок",
    "ошиб",
    "календар",
    "возвращ",
    "очки проекта",
)


def has_gallery_reject_marker(value: str) -> bool:
    normalized = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", value)
    normalized = re.sub(r"[_./()-]+", " ", normalized).casefold()
    return any(
        re.search(rf"(?<!\w){re.escape(marker)}", normalized)
        for marker in GALLERY_REJECT_MARKERS
    )


def is_building_gallery_item(item: dict[str, Any]) -> bool:
    description = " ".join(
        str(item.get(field) or "")
        for field in ("file_orig", "caption_orig", "caption_ru")
    )
    return not has_gallery_reject_marker(description)


def image_sources_for(
    name_ru: str,
    matches: dict[str, str],
    galleries: dict[str, dict[str, Any]],
    images_dir: Path,
    additional_galleries: list[str] | None = None,
) -> tuple[list[tuple[Path, str]], str | None]:
    mapped = matches.get(name_ru)
    if not mapped:
        return [], None

    sources: list[tuple[Path, str]] = []
    original_name: str | None = None

    for gallery_name in [mapped, *(additional_galleries or [])]:
        if gallery_name.startswith("VK:"):
            candidate = images_dir / legacy_image_name("VK_" + gallery_name[3:])
            if candidate.exists():
                sources.append((candidate, "main"))
            continue

        if original_name is None:
            original_name = gallery_name
        gallery = galleries.get(gallery_name) or {}
        main_local = clean_text(gallery.get("main_local"))
        legacy_candidate = images_dir / legacy_image_name(gallery_name)
        main_candidate = images_dir / main_local if main_local else None

        # Some English Wiki entries were later pointed at a VK/Telegram screenshot.
        # Prefer the already downloaded Wiki original whenever it is available.
        if main_local and main_local.startswith("VK_") and legacy_candidate.exists():
            primary = legacy_candidate
        elif main_candidate and main_candidate.exists():
            primary = main_candidate
        else:
            primary = legacy_candidate if legacy_candidate.exists() else None

        if primary:
            primary_role = "day" if sources else "main"
            if sources:
                matching_item = next(
                    (
                        item
                        for item in gallery.get("items") or []
                        if clean_text(item.get("local")) == primary.name
                    ),
                    None,
                )
                if matching_item:
                    candidate_role = str(matching_item.get("role") or "main").lower()
                    if candidate_role in IMAGE_ROLE_LABELS:
                        primary_role = candidate_role
            sources.append((primary, primary_role))
        for item in gallery.get("items") or []:
            if not is_building_gallery_item(item):
                continue
            local = clean_text(item.get("local"))
            if not local:
                continue
            candidate = images_dir / local
            if candidate.exists():
                role = str(item.get("role") or "main").lower()
                sources.append((candidate, role if role in IMAGE_ROLE_LABELS else "main"))
    return sources, original_name


def stable_id(section: str, identity: int | str, name: str, appearance: str) -> str:
    digest = hashlib.sha1(f"{name}|{appearance}".encode("utf-8")).hexdigest()[:10]
    return f"{section}:{identity}:{digest}"


def export_image(source: Path | None, copied: dict[Path, str]) -> str | None:
    if source is None:
        return None
    source = source.resolve()
    if source in copied:
        return copied[source]

    target_name = safe_image_name(source)
    target = OUTPUT_IMAGES / target_name
    if not target.exists() or target.stat().st_size != source.stat().st_size:
        shutil.copy2(source, target)
    web_path = f"buildings/{target_name}"
    copied[source] = web_path
    return web_path


def export_images(
    sources: list[tuple[Path, str]],
    copied: dict[Path, str],
) -> list[dict[str, str]]:
    exported: list[dict[str, str]] = []
    seen_web_paths: set[str] = set()
    role_counts: dict[str, int] = {}
    for source, role in sources:
        web_path = export_image(source, copied)
        if not web_path or web_path in seen_web_paths:
            continue
        seen_web_paths.add(web_path)
        role_counts[role] = role_counts.get(role, 0) + 1
        base_label = IMAGE_ROLE_LABELS.get(role, IMAGE_ROLE_LABELS["main"])
        label = base_label if role_counts[role] == 1 else f"{base_label} · {role_counts[role]}"
        exported.append({"src": web_path, "kind": role, "label": label})
    return exported


def export_configured_images(
    items: list[dict[str, Any]],
    copied: dict[Path, str],
) -> list[dict[str, str]]:
    exported: list[dict[str, str]] = []
    seen_web_paths: set[str] = set()
    manual_root = MANUAL_IMAGES.resolve()
    for item in items:
        filename = clean_text(item.get("file"))
        if not filename:
            continue
        source = (manual_root / filename).resolve()
        if manual_root not in source.parents or not source.is_file():
            raise FileNotFoundError(f"Manual catalog image does not exist: {filename}")
        web_path = export_image(source, copied)
        if not web_path or web_path in seen_web_paths:
            continue
        seen_web_paths.add(web_path)
        role = str(item.get("kind") or "main").lower()
        if role not in IMAGE_ROLE_LABELS:
            role = "main"
        exported.append({
            "src": web_path,
            "kind": role,
            "label": clean_text(item.get("label")) or IMAGE_ROLE_LABELS[role],
        })
    return exported


def merge_exported_images(*groups: list[dict[str, str]]) -> list[dict[str, str]]:
    merged: list[dict[str, str]] = []
    seen_sources: set[str] = set()
    for group in groups:
        for image in group:
            if image["src"] in seen_sources:
                continue
            seen_sources.add(image["src"])
            merged.append(image)
    return merged


def feature_traits(
    section: str,
    code: int | None,
    event: str | None,
    configured: dict[str, list[str]],
    declared: list[str] | None = None,
) -> list[str]:
    traits: list[str] = []
    if event:
        traits.append("popular" if "популяр" in event.casefold() else "unique-effect")
    configured_values = configured.get(f"{section}:{code}", []) if code is not None else []
    for trait in [*configured_values, *(declared or [])]:
        if trait not in traits:
            traits.append(trait)
    return traits


def mayor_record(
    raw: dict[str, Any],
    themes: dict[str, str],
    matches: dict[str, str],
    galleries: dict[str, dict[str, Any]],
    images_dir: Path,
    copied: dict[Path, str],
    configured_traits: dict[str, list[str]],
) -> dict[str, Any]:
    code = int(raw["code"])
    name = str(raw["name"]).strip()
    season = int(raw["season"])
    source_images, matched_original_name = image_sources_for(
        name,
        matches,
        galleries,
        images_dir,
        raw.get("additionalGalleries") or [],
    )
    images = export_images(source_images, copied)
    images = merge_exported_images(
        images,
        export_configured_images(raw.get("additionalImages") or [], copied),
    )
    original_name = clean_text(raw.get("originalName")) or matched_original_name
    theme = clean_text(raw.get("theme")) or clean_text(themes.get(str(season)))
    event = clean_text(raw.get("event"))
    traits = feature_traits("mayor", code, event, configured_traits)
    return {
        "id": stable_id("mayor", code, name, f"season={season}|tier={raw.get('tier')}"),
        "section": "mayor",
        "code": code,
        "name": name,
        "aliases": [],
        "originalName": original_name,
        "image": images[0]["src"] if images else None,
        "images": images,
        "footprint": parse_footprint(raw.get("size")),
        "boost": parse_boost(raw.get("boost")),
        "season": season,
        "seasonName": theme,
        "released": clean_text(raw.get("date")),
        "tier": clean_text(raw.get("tier")),
        "passType": clean_text(raw.get("free")),
        "event": event,
        "isFeatured": bool(traits),
        "traits": traits,
        "specialization": None,
        "effectArea": None,
        "availability": None,
    }


def other_record(
    raw: dict[str, Any],
    matches: dict[str, str],
    galleries: dict[str, dict[str, Any]],
    images_dir: Path,
    copied: dict[Path, str],
    configured_traits: dict[str, list[str]],
) -> dict[str, Any]:
    raw_code = raw.get("code")
    code = int(raw_code) if raw_code is not None else None
    source_name = str(raw["name"]).strip()
    name = clean_text(raw.get("displayName")) or source_name
    manual_images = raw.get("manualImages") or []
    if manual_images:
        images = export_configured_images(manual_images, copied)
        matched_original_name = None
    else:
        source_images, matched_original_name = image_sources_for(
            source_name,
            matches,
            galleries,
            images_dir,
            raw.get("additionalGalleries") or [],
        )
        images = export_images(source_images, copied)
    images = merge_exported_images(
        images,
        export_configured_images(raw.get("additionalImages") or [], copied),
    )
    original_name = clean_text(raw.get("originalName")) or matched_original_name
    event = clean_text(raw.get("event"))
    traits = feature_traits("other", code, event, configured_traits, raw.get("traits"))
    source_identity = code if code is not None else clean_text(raw.get("sourceId"))
    if source_identity is None:
        raise ValueError(f"Building without a game code requires sourceId: {name}")
    stable_appearance = clean_text(raw.get("sourceId")) or json.dumps(
        raw,
        ensure_ascii=False,
        sort_keys=True,
    )
    return {
        "id": stable_id(
            "other",
            source_identity,
            source_name,
            stable_appearance,
        ),
        "section": "other",
        "code": code,
        "name": name,
        "aliases": [str(alias).strip() for alias in raw.get("aliases", []) if str(alias).strip()],
        "originalName": original_name,
        "image": images[0]["src"] if images else None,
        "images": images,
        "footprint": parse_footprint(raw.get("size")),
        "boost": parse_boost(raw.get("boost")),
        "season": None,
        "seasonName": clean_text(raw.get("theme")),
        "released": clean_text(raw.get("year")),
        "tier": None,
        "passType": None,
        "event": event,
        "isFeatured": bool(traits),
        "traits": traits,
        "specialization": clean_text(raw.get("spec")) or "Без категории",
        "effectArea": clean_text(raw.get("area")),
        "availability": clean_text(raw.get("availability")),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Export the SimCity building catalog for the web app.")
    parser.add_argument("--scripts", type=Path, default=DEFAULT_SCRIPTS)
    parser.add_argument("--images", type=Path, default=DEFAULT_IMAGES)
    args = parser.parse_args()

    scripts_dir = args.scripts.resolve()
    images_dir = args.images.resolve()
    mayor_data = load_json(scripts_dir / "scbi_mayor_pass.json")
    full_data = load_json(scripts_dir / "scbi_full_buildings.json")
    match_data = load_json(scripts_dir / "ru2en_matches.json")
    gallery_data = load_json(scripts_dir / "galleries_v3.json").get("galleries", {})
    override_path = Path(__file__).with_name("catalog_overrides.json")
    overrides = load_json(override_path) if override_path.exists() else {}
    featured_path = Path(__file__).with_name("featured_buildings.json")
    featured = load_json(featured_path) if featured_path.exists() else {}
    manual_buildings_path = Path(__file__).with_name("manual_buildings.json")
    manual_buildings = load_json(manual_buildings_path) if manual_buildings_path.exists() else []
    included_permanent_codes = {int(code) for code in featured.get("includePermanentCodes", [])}
    configured_traits = featured.get("traitsByBuilding", {})

    hidden_path = scripts_dir / "hidden_buildings.json"
    hidden_raw = load_json(hidden_path) if hidden_path.exists() else []
    hidden = {hidden_raw} if isinstance(hidden_raw, str) else set(hidden_raw)

    mayor_source = [
        {**record, **overrides.get(record.get("name"), {})}
        for record in mayor_data["buildings"]
        if record.get("code") is not None
    ]
    other_source = [
        {**record, **overrides.get(record.get("name"), {})}
        for record in full_data
        if record.get("code") is not None
        and (
            not str(record.get("availability") or "").strip().lower().startswith("постоян")
            or int(record["code"]) in included_permanent_codes
        )
        and record.get("name") not in hidden
    ]
    other_source.extend(
        {**record, **overrides.get(record.get("name"), {})}
        for record in manual_buildings
    )
    unique_other: list[dict[str, Any]] = []
    seen_other: set[str] = set()
    for record in other_source:
        signature = json.dumps(record, ensure_ascii=False, sort_keys=True)
        if signature not in seen_other:
            seen_other.add(signature)
            unique_other.append(record)
    other_source = unique_other

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_IMAGES.mkdir(parents=True, exist_ok=True)
    copied: dict[Path, str] = {}

    buildings = [
        mayor_record(
            record,
            mayor_data.get("themes", {}),
            match_data.get("mp", {}),
            gallery_data,
            images_dir,
            copied,
            configured_traits,
        )
        for record in mayor_source
    ]
    buildings.extend(
        other_record(
            record,
            match_data.get("fl", {}),
            gallery_data,
            images_dir,
            copied,
            configured_traits,
        )
        for record in other_source
    )

    ids = [item["id"] for item in buildings]
    if len(ids) != len(set(ids)):
        raise RuntimeError("Catalog contains duplicate stable IDs.")

    used_images = {
        image["src"]
        for item in buildings
        for image in item["images"]
    }
    for existing in OUTPUT_IMAGES.glob("*"):
        relative = f"buildings/{existing.name}"
        if existing.is_file() and relative not in used_images:
            existing.unlink()

    seasons = {
        str(record["season"]): record["seasonName"]
        for record in buildings
        if record["section"] == "mayor" and record["season"] is not None
    }
    specializations = sorted(
        {
            record["specialization"]
            for record in buildings
            if record["section"] == "other" and record["specialization"]
        },
        key=str.casefold,
    )
    payload = {
        "meta": {
            "schemaVersion": 4,
            "counts": {"mayor": len(mayor_source), "other": len(other_source)},
            "images": len(used_images),
            "missingImages": sum(1 for item in buildings if not item["image"]),
            "galleryBuildings": sum(1 for item in buildings if len(item["images"]) > 1),
            "featuredBuildings": sum(1 for item in buildings if item["isFeatured"]),
            "seasons": seasons,
            "specializations": specializations,
        },
        "buildings": buildings,
    }
    temporary_output = OUTPUT_JSON.with_suffix(".json.tmp")
    with temporary_output.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(payload, handle, ensure_ascii=False, separators=(",", ":"))
        handle.write("\n")
    temporary_output.replace(OUTPUT_JSON)

    print(
        f"Exported {len(mayor_source)} Mayor's Pass and {len(other_source)} other buildings; "
        f"{len(used_images)} unique images, {payload['meta']['missingImages']} missing."
    )


if __name__ == "__main__":
    main()
