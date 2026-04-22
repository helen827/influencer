#!/usr/bin/env python3
"""
Parse a Word .docx book list, enrich each book with ISBN and cover URL,
and emit front-end ready JSON.

Data sources:
1. Open Library Search API + Covers API
   Docs:
   - https://openlibrary.org/dev/docs/api/search
   - https://openlibrary.org/dev/docs/api/covers
2. Google Books Volumes API as a fallback
   Docs:
   - https://developers.google.com/books/docs/v1/reference/volumes
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from dataclasses import dataclass
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path
from typing import Iterable


NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
}

LABEL_MAP = {
    "书名": "title",
    "推荐书名": "title",
    "推荐人": "recommender",
    "荐书人": "recommender",
    "推荐理由": "recommendation",
    "推荐语": "recommendation",
    "理由": "recommendation",
    "金句": "quote",
    "摘录": "quote",
    "摘抄": "quote",
    "名句": "quote",
}

REQUIRED_FIELDS = ("title", "recommender", "recommendation", "quote")
USER_AGENT = "BookListEnricher/1.0 (+https://example.com)"
DEFAULT_TIMEOUT = 15
TITLE_OVERRIDES = {
    "科技共和国": {
        "source": "douban",
        "matched_title": "科技共和国",
        "confidence": 0.99,
        "author": "亚历山大·卡普 / 尼古拉斯·扎米斯卡",
        "isbn": "9787521779608",
        "isbn10": None,
        "isbn13": "9787521779608",
        "cover_url": "https://img9.doubanio.com/view/subject/l/public/s35331666.jpg",
        "cover_thumbnail_url": "https://img9.doubanio.com/view/subject/m/public/s35331666.jpg",
    },
    "有限与无限的游戏——一个哲学家眼中的竞技世界": {
        "source": "douban",
        "matched_title": "有限与无限的游戏",
        "confidence": 0.98,
        "author": "詹姆斯·卡斯",
        "isbn": "9787121215698",
        "isbn10": None,
        "isbn13": "9787121215698",
        "cover_url": "https://img9.doubanio.com/view/subject/l/public/s27082884.jpg",
        "cover_thumbnail_url": "https://img9.doubanio.com/view/subject/m/public/s27082884.jpg",
    },
    "从优秀到卓越": {
        "source": "douban",
        "matched_title": "从优秀到卓越",
        "confidence": 0.99,
        "author": "吉姆·柯林斯",
        "isbn": "9787508617138",
        "isbn10": None,
        "isbn13": "9787508617138",
        "cover_url": "https://img1.doubanio.com/view/subject/l/public/s4175268.jpg",
        "cover_thumbnail_url": "https://img1.doubanio.com/view/subject/m/public/s4175268.jpg",
    },
    "预测之书:1000天后的世界": {
        "source": "douban",
        "matched_title": "预测之书",
        "confidence": 0.97,
        "author": "罗振宇（主编）",
        "isbn": "9787513358217",
        "isbn10": None,
        "isbn13": "9787513358217",
        "cover_url": "https://img1.doubanio.com/view/subject/l/public/s35048838.jpg",
        "cover_thumbnail_url": "https://img1.doubanio.com/view/subject/m/public/s35048838.jpg",
    },
    "个人知识": {
        "source": "douban",
        "matched_title": "个人知识",
        "confidence": 0.99,
        "author": "迈克尔·波兰尼",
        "isbn": "9787208172746",
        "isbn10": None,
        "isbn13": "9787208172746",
        "cover_url": "https://img2.doubanio.com/view/subject/l/public/s34051321.jpg",
        "cover_thumbnail_url": "https://img2.doubanio.com/view/subject/m/public/s34051321.jpg",
    },
    "硅谷热": {
        "source": "publisher",
        "matched_title": "硅谷热：高科技文化的成长",
        "confidence": 0.8,
        "author": "埃弗里特·M. 罗杰斯 / 朱迪丝·K. 拉森",
        "isbn": "9787121332395",
        "isbn10": None,
        "isbn13": "9787121332395",
        "cover_url": "https://img1.doubanio.com/view/subject/l/public/s2744959.jpg",
        "cover_thumbnail_url": "https://img1.doubanio.com/view/subject/m/public/s2744959.jpg",
    },
    "何为人类: GPT书写的人类备忘录": {
        "source": "megbook",
        "matched_title": "何为人类",
        "confidence": 0.96,
        "author": "伊恩·S. 托马斯 / GPT-3",
        "isbn": "9787521754452",
        "isbn10": None,
        "isbn13": "9787521754452",
        "cover_url": "https://img.megbook.hk/upload/mall/productImages/y23/7/9787521754452.jpg",
        "cover_thumbnail_url": "https://img.megbook.hk/upload/mall/productImages/y23/7/9787521754452.jpg",
    },
    "极简增长": {
        "source": "douban",
        "matched_title": "极简增长",
        "confidence": 0.99,
        "author": "彭志强",
        "isbn": "9787572289705",
        "isbn10": None,
        "isbn13": "9787572289705",
        "cover_url": "https://img9.doubanio.com/view/subject/l/public/s35015294.jpg",
        "cover_thumbnail_url": "https://img9.doubanio.com/view/subject/m/public/s35015294.jpg",
    },
    "石油风云": {
        "source": "douban",
        "matched_title": "石油风云",
        "confidence": 0.98,
        "author": "丹尼尔·耶金",
        "isbn": "9787532720194",
        "isbn10": None,
        "isbn13": "9787532720194",
        "cover_url": "https://img3.doubanio.com/view/subject/l/public/s2961227.jpg",
        "cover_thumbnail_url": "https://img3.doubanio.com/view/subject/m/public/s2961227.jpg",
    },
    "理性的疯狂梦": {
        "source": "douban",
        "matched_title": "理性的疯狂梦",
        "confidence": 0.99,
        "author": "本哈明·拉巴图特",
        "isbn": "9787020186112",
        "isbn10": None,
        "isbn13": "9787020186112",
        "cover_url": "https://img1.doubanio.com/view/subject/l/public/s34825439.jpg",
        "cover_thumbnail_url": "https://img1.doubanio.com/view/subject/m/public/s34825439.jpg",
    },
}


@dataclass
class BookRecord:
    title: str
    recommender: str
    recommendation: str
    quote: str


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Read a .docx book list, enrich ISBN/cover data, and export JSON."
    )
    parser.add_argument("input", help="Path to the input .docx file")
    parser.add_argument(
        "-o",
        "--output",
        default="books.enriched.json",
        help="Path to the output JSON file",
    )
    parser.add_argument(
        "--schema",
        default="books.schema.json",
        help="Path to the JSON Schema file to reference in docs or validation workflows",
    )
    parser.add_argument(
        "--skip-enrichment",
        action="store_true",
        help="Only parse the Word file without calling external APIs",
    )
    args = parser.parse_args()

    input_path = Path(args.input).expanduser().resolve()
    output_path = Path(args.output).expanduser().resolve()

    if input_path.suffix.lower() != ".docx":
        raise SystemExit("Only .docx files are supported. Please save the Word file as .docx.")

    books = parse_docx_books(input_path)
    if not books:
        raise SystemExit("No book records were parsed from the Word document.")

    payload_books = []
    for index, book in enumerate(books, start=1):
        enriched = enrich_book(book) if not args.skip_enrichment else empty_enrichment()
        payload_books.append(
            {
                "id": f"book-{index:03d}",
                "title": book.title,
                "recommender": book.recommender,
                "author": enriched["author"],
                "recommendation": book.recommendation,
                "quote": book.quote,
                "isbn": enriched["isbn"],
                "isbn10": enriched["isbn10"],
                "isbn13": enriched["isbn13"],
                "cover_url": enriched["cover_url"],
                "cover_thumbnail_url": enriched["cover_thumbnail_url"],
                "enrichment": {
                    "source": enriched["source"],
                    "matched_title": enriched["matched_title"],
                    "confidence": round(enriched["confidence"], 4),
                },
            }
        )

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_document": str(input_path),
        "books": payload_books,
        "stats": {
            "total": len(payload_books),
            "with_isbn": sum(1 for item in payload_books if item["isbn"]),
            "with_cover_url": sum(1 for item in payload_books if item["cover_url"]),
        },
    }

    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(payload_books)} books to {output_path}")
    if args.schema:
        print(f"Schema available at {Path(args.schema).expanduser().resolve()}")
    return 0


def parse_docx_books(path: Path) -> list[BookRecord]:
    with zipfile.ZipFile(path) as zf:
        xml_bytes = zf.read("word/document.xml")

    root = ET.fromstring(xml_bytes)
    table_records = parse_tables(root)
    if table_records:
        return table_records

    text_lines = extract_paragraph_lines(root)
    labeled_records = parse_labeled_blocks(text_lines)
    if labeled_records:
        return labeled_records

    title_block_records = parse_title_blocks(text_lines)
    if title_block_records:
        return title_block_records

    raise SystemExit(
        "The document could not be parsed with the built-in heuristics. "
        "Please structure it as a table or use explicit labels like 书名/推荐人/推荐理由/金句."
    )


def parse_tables(root: ET.Element) -> list[BookRecord]:
    records: list[BookRecord] = []
    for table in root.findall(".//w:tbl", NS):
        rows = table.findall("./w:tr", NS)
        if len(rows) < 2:
            continue

        matrix = [extract_row_texts(row) for row in rows]
        header_idx, mapping = find_header_mapping(matrix)
        if header_idx is None or not set(REQUIRED_FIELDS).issubset(mapping):
            continue

        for row in matrix[header_idx + 1 :]:
            item = {field: clean_text(row[idx]) if idx < len(row) else "" for field, idx in mapping.items()}
            if not any(item.values()):
                continue
            if not item.get("title"):
                continue
            records.append(
                BookRecord(
                    title=item.get("title", ""),
                    recommender=item.get("recommender", ""),
                    recommendation=item.get("recommendation", ""),
                    quote=item.get("quote", ""),
                )
            )
        if records:
            return [record for record in records if is_complete_record(record)]
    return []


def parse_labeled_blocks(lines: list[str]) -> list[BookRecord]:
    records: list[BookRecord] = []
    current: dict[str, str] = {}
    active_field: str | None = None

    for raw_line in lines + [""]:
        line = clean_text(raw_line)
        if not line:
            if is_complete_mapping(current):
                records.append(book_from_mapping(current))
            current = {}
            active_field = None
            continue

        field, value = split_labeled_line(line)
        if field:
            active_field = field
            current[field] = join_text(current.get(field, ""), value)
        elif active_field:
            current[active_field] = join_text(current.get(active_field, ""), line)

    return records


def parse_title_blocks(lines: list[str]) -> list[BookRecord]:
    blocks: list[list[str]] = []
    current: list[str] = []

    for raw_line in lines:
        line = clean_text(raw_line)
        if not line:
            continue
        if is_title_line(line):
            if current:
                blocks.append(current)
            current = [line]
        elif current:
            current.append(line)
    if current:
        blocks.append(current)

    records = []
    for block in blocks:
        record = parse_title_block(block)
        if record and is_complete_record(record):
            records.append(record)
    return records


def parse_title_block(block: list[str]) -> BookRecord | None:
    title = extract_title(block[0])
    if not title:
        return None

    recommender = ""
    recommendation_lines: list[str] = []
    quote_lines: list[str] = []
    quote_mode = False

    for raw_line in block[1:]:
        line = clean_text(raw_line)
        if not line or is_metadata_line(line):
            continue

        recommender_match = re.match(r"^推荐人\s*[:：]?\s*(.+)$", line)
        if recommender_match:
            recommender = clean_text(strip_wrapper_marks(recommender_match.group(1)))
            quote_mode = False
            continue

        if re.match(r"^(作者|出版年份)\s*[:：]", line):
            quote_mode = False
            continue

        inline_quote = extract_inline_quote_label(line)
        if inline_quote is not None:
            quote_mode = True
            if inline_quote:
                quote_lines.append(inline_quote)
            continue

        recommendation_label = re.match(r"^推荐理由\s*[:：]?\s*(.*)$", line)
        if recommendation_label:
            quote_mode = False
            content = clean_text(recommendation_label.group(1))
            if content:
                recommendation_lines.append(content)
            continue

        if quote_mode:
            quote_lines.append(line)
        else:
            recommendation_lines.append(line)

    if not quote_lines:
        quoted_snippets = []
        for line in recommendation_lines:
            quoted_snippets.extend(extract_quoted_snippets(line))
        if quoted_snippets:
            candidate = max(quoted_snippets, key=len)
            if len(candidate) >= 12:
                quote_lines.append(candidate)

    recommendation = "\n".join(line for line in recommendation_lines if line).strip()
    quote = "\n".join(line for line in quote_lines if line).strip()
    if not quote and recommendation:
        quote = infer_quote_from_recommendation(recommendation)

    if not recommender:
        recommender = "未知推荐人"
    if not recommendation or not quote:
        return None

    return BookRecord(
        title=title,
        recommender=recommender,
        recommendation=recommendation,
        quote=quote,
    )


def extract_paragraph_lines(root: ET.Element) -> list[str]:
    lines: list[str] = []
    for paragraph in root.findall(".//w:p", NS):
        texts = []
        for node in paragraph.findall(".//w:t", NS):
            texts.append(node.text or "")
        for br in paragraph.findall(".//w:br", NS):
            if br is not None:
                texts.append("\n")
        merged = "".join(texts).replace("\xa0", " ").strip()
        if "\n" in merged:
            lines.extend(part.strip() for part in merged.splitlines())
        else:
            lines.append(merged)
    return lines


def extract_row_texts(row: ET.Element) -> list[str]:
    cells = []
    for cell in row.findall("./w:tc", NS):
        texts = []
        for paragraph in cell.findall(".//w:p", NS):
            para = "".join(node.text or "" for node in paragraph.findall(".//w:t", NS))
            para = clean_text(para)
            if para:
                texts.append(para)
        cells.append("\n".join(texts).strip())
    return cells


def find_header_mapping(matrix: list[list[str]]) -> tuple[int | None, dict[str, int]]:
    for idx, row in enumerate(matrix[:3]):
        mapping: dict[str, int] = {}
        for col, cell in enumerate(row):
            normalized = normalize_label(cell)
            if normalized in LABEL_MAP:
                mapping[LABEL_MAP[normalized]] = col
        if set(REQUIRED_FIELDS).issubset(mapping):
            return idx, mapping
    return None, {}


def split_labeled_line(line: str) -> tuple[str | None, str]:
    match = re.match(r"^\s*([^\s:：]{1,12})\s*[:：]\s*(.*)$", line)
    if not match:
        return None, line
    label = normalize_label(match.group(1))
    field = LABEL_MAP.get(label)
    if not field:
        return None, line
    return field, match.group(2).strip()


def is_title_line(line: str) -> bool:
    return bool(re.match(r"^《[^》]+》", clean_text(line)))


def extract_title(line: str) -> str:
    match = re.match(r"^《([^》]+)》", clean_text(line))
    if not match:
        return ""
    return clean_text(match.group(1))


def extract_inline_quote_label(line: str) -> str | None:
    patterns = [
        r"^最喜欢的一句话\s*[:：]?\s*(.*)$",
        r"^最喜欢的句子\s*[:：]?\s*(.*)$",
        r"^我最喜欢的书中句子是\s*[:：]?\s*(.*)$",
        r"^我最喜欢的句子是\s*[:：]?\s*(.*)$",
        r"^五[:：]\s*最喜欢的书中句子\s*[:：]?\s*(.*)$",
    ]
    for pattern in patterns:
        match = re.match(pattern, line)
        if match:
            return clean_text(match.group(1))
    return None


def extract_quoted_snippets(text: str) -> list[str]:
    snippets = []
    for pattern in (r"“([^”]+)”", r"\"([^\"]+)\""):
        snippets.extend(clean_text(match) for match in re.findall(pattern, text))
    unmatched_open = re.findall(r"“([^”]+)$", text)
    snippets.extend(clean_text(match) for match in unmatched_open)
    return [item for item in snippets if len(item) >= 6]


def is_metadata_line(line: str) -> bool:
    normalized = clean_text(line)
    return normalized in {"推荐理由", "最喜欢的一句话", "最喜欢的句子", "五：最喜欢的书中句子"}


def strip_wrapper_marks(text: str) -> str:
    value = clean_text(text)
    value = value.strip("[]【】()（）")
    return clean_text(value)


def infer_quote_from_recommendation(text: str) -> str:
    cleaned = clean_text(text)
    sentences = [
        clean_text(part)
        for part in re.split(r"[。！？!?]\s*", cleaned)
        if clean_text(part)
    ]
    if not sentences:
        return cleaned

    preferred = [s for s in sentences if 12 <= len(s) <= 48]
    if preferred:
        return preferred[-1]

    medium = [s for s in sentences if 8 <= len(s) <= 64]
    if medium:
        return medium[-1]

    return min(sentences, key=len)


def enrich_book(book: BookRecord) -> dict[str, object]:
    override = lookup_title_override(book.title)
    if override:
        return override

    openlibrary = lookup_openlibrary(book.title)
    if openlibrary and openlibrary["confidence"] >= 0.6:
        return openlibrary

    google_books = lookup_google_books(book.title)
    if google_books and google_books["confidence"] >= 0.6:
        return google_books

    return openlibrary or google_books or empty_enrichment()


def lookup_title_override(title: str) -> dict[str, object] | None:
    target = normalize_title(title)
    for key, value in TITLE_OVERRIDES.items():
        if normalize_title(key) == target:
            return dict(value)
    return None


def lookup_openlibrary(title: str) -> dict[str, object] | None:
    params = {
        "title": title,
        "fields": "title,isbn,cover_i,edition_count,author_name",
        "limit": "5",
    }
    url = "https://openlibrary.org/search.json?" + urllib.parse.urlencode(params)
    try:
        payload = fetch_json(url)
    except Exception:
        return None

    docs = payload.get("docs", [])
    best = None
    best_score = -1.0
    for doc in docs:
        candidate_title = clean_text(doc.get("title", ""))
        score = title_similarity(title, candidate_title)
        if score > best_score:
            best = doc
            best_score = score

    if not best:
        return None

    isbn10, isbn13 = choose_isbns(best.get("isbn", []))
    isbn = isbn13 or isbn10
    cover_url = None
    cover_thumb = None

    if isbn:
        cover_url = f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false"
        cover_thumb = f"https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg?default=false"
    elif best.get("cover_i"):
        cover_id = str(best["cover_i"])
        cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg?default=false"
        cover_thumb = f"https://covers.openlibrary.org/b/id/{cover_id}-M.jpg?default=false"

    return {
        "source": "openlibrary",
        "matched_title": clean_text(best.get("title", "")) or None,
        "confidence": max(best_score, 0.0),
        "author": clean_text(", ".join(best.get("author_name", [])[:3])) or None,
        "isbn": isbn,
        "isbn10": isbn10,
        "isbn13": isbn13,
        "cover_url": cover_url,
        "cover_thumbnail_url": cover_thumb,
    }


def lookup_google_books(title: str) -> dict[str, object] | None:
    params = {
        "q": f'intitle:"{title}"',
        "maxResults": "5",
        "printType": "books",
        "langRestrict": "zh",
    }
    url = "https://www.googleapis.com/books/v1/volumes?" + urllib.parse.urlencode(params)
    try:
        payload = fetch_json(url)
    except Exception:
        return None

    items = payload.get("items", [])
    best = None
    best_score = -1.0
    for item in items:
        info = item.get("volumeInfo", {})
        candidate_title = clean_text(info.get("title", ""))
        score = title_similarity(title, candidate_title)
        if score > best_score:
            best = info
            best_score = score

    if not best:
        return None

    isbn10 = None
    isbn13 = None
    for identifier in best.get("industryIdentifiers", []):
        value = normalize_isbn(identifier.get("identifier"))
        if not value:
            continue
        if len(value) == 10 and not isbn10:
            isbn10 = value
        elif len(value) == 13 and not isbn13:
            isbn13 = value
    image_links = best.get("imageLinks", {})
    cover_thumb = normalize_cover_url(image_links.get("thumbnail"))
    cover_url = normalize_cover_url(
        image_links.get("large")
        or image_links.get("medium")
        or image_links.get("small")
        or image_links.get("thumbnail")
        or image_links.get("smallThumbnail")
    )
    return {
        "source": "google_books",
        "matched_title": clean_text(best.get("title", "")) or None,
        "confidence": max(best_score, 0.0),
        "author": clean_text(" / ".join(best.get("authors", [])[:3])) or None,
        "isbn": isbn13 or isbn10,
        "isbn10": isbn10,
        "isbn13": isbn13,
        "cover_url": cover_url,
        "cover_thumbnail_url": cover_thumb,
    }


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=DEFAULT_TIMEOUT) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        data = response.read().decode(charset)
    return json.loads(data)


def choose_isbns(isbns: Iterable[str]) -> tuple[str | None, str | None]:
    isbn10 = None
    isbn13 = None
    for raw in isbns:
        value = normalize_isbn(raw)
        if not value:
            continue
        if len(value) == 13 and not isbn13:
            isbn13 = value
        elif len(value) == 10 and not isbn10:
            isbn10 = value
    return isbn10, isbn13


def normalize_isbn(value: object) -> str | None:
    if value is None:
        return None
    text = re.sub(r"[^0-9Xx]", "", str(value))
    if len(text) == 10 and re.fullmatch(r"\d{9}[\dXx]", text):
        return text.upper()
    if len(text) == 13 and text.isdigit():
        return text
    return None


def normalize_cover_url(url: str | None) -> str | None:
    if not url:
        return None
    return re.sub(r"^http://", "https://", url)


def title_similarity(a: str, b: str) -> float:
    na = normalize_title(a)
    nb = normalize_title(b)
    if not na or not nb:
        return 0.0
    if na == nb:
        return 1.0
    if na in nb or nb in na:
        return 0.92
    return SequenceMatcher(None, na, nb).ratio()


def normalize_title(text: str) -> str:
    text = clean_text(text).lower()
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"[《》“”\"'‘’:：,，.!！？?、·\-—_()\[\]（）\s]+", "", text)
    return text


def normalize_label(text: str) -> str:
    text = clean_text(text)
    text = re.sub(r"[:：\s]", "", text)
    return text


def clean_text(text: object) -> str:
    value = "" if text is None else str(text)
    value = unicodedata.normalize("NFKC", value)
    value = value.replace("\r", "\n")
    value = re.sub(r"\n{3,}", "\n\n", value)
    value = re.sub(r"[ \t]+", " ", value)
    return value.strip()


def join_text(existing: str, incoming: str) -> str:
    if not incoming:
        return existing
    if not existing:
        return incoming
    return f"{existing}\n{incoming}"


def book_from_mapping(data: dict[str, str]) -> BookRecord:
    return BookRecord(
        title=clean_text(data.get("title", "")),
        recommender=clean_text(data.get("recommender", "")),
        recommendation=clean_text(data.get("recommendation", "")),
        quote=clean_text(data.get("quote", "")),
    )


def is_complete_mapping(data: dict[str, str]) -> bool:
    return all(clean_text(data.get(field, "")) for field in REQUIRED_FIELDS)


def is_complete_record(record: BookRecord) -> bool:
    return all(clean_text(getattr(record, field)) for field in REQUIRED_FIELDS)


def empty_enrichment() -> dict[str, object]:
    return {
        "source": None,
        "matched_title": None,
        "confidence": 0.0,
        "author": None,
        "isbn": None,
        "isbn10": None,
        "isbn13": None,
        "cover_url": None,
        "cover_thumbnail_url": None,
    }


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except urllib.error.URLError as exc:
        raise SystemExit(f"Network error while fetching book metadata: {exc}") from exc
