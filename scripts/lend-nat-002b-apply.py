#!/usr/bin/env python3
"""Apply LEND-NAT-002B schema (if missing) and deterministic graph cohort.

Reads DATABASE_URL from the environment. Never prints secrets.
Usage:
  python scripts/lend-nat-002b-apply.py --cohort path.json [--apply]
Default is inspect/dry-run against the live graph.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import uuid
from pathlib import Path

import psycopg
from psycopg.types.json import Jsonb

NS = uuid.UUID("8f14e45f-ceea-467c-9b73-4d1c1e6e8a01")
EXPECTED_HOST_FRAGMENT = "arepfylnilkjmyduhwbz"
TABLES = [
    "lender_national_entities",
    "lender_identifiers",
    "lender_entity_names",
    "lender_source_record_links",
    "legacy_lender_bridges",
    "lender_identity_conflicts",
    "lender_entity_classifications",
    "lender_entity_relationships",
]


def gid(s: str | None) -> uuid.UUID | None:
    if not s:
        return None
    return uuid.uuid5(NS, s)


def host_ok(conninfo: str) -> bool:
    return EXPECTED_HOST_FRAGMENT in conninfo


def table_counts(cur) -> dict[str, int]:
    out = {}
    for t in TABLES:
        cur.execute("select to_regclass(%s)", (f"public.{t}",))
        exists = cur.fetchone()[0]
        if not exists:
            out[t] = -1
            continue
        cur.execute(f"select count(*) from public.{t}")
        out[t] = int(cur.fetchone()[0])
    return out


def schema_report(cur) -> dict:
    cur.execute(
        """
        select c.relname as table_name,
               c.relrowsecurity as rls
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = any(%s)
        order by 1
        """,
        (TABLES,),
    )
    rls = {row[0]: bool(row[1]) for row in cur.fetchall()}
    cur.execute(
        """
        select tc.table_name, tc.constraint_type, tc.constraint_name
        from information_schema.table_constraints tc
        where tc.table_schema = 'public' and tc.table_name = any(%s)
        order by 1,2,3
        """,
        (TABLES,),
    )
    constraints = [
        {"table": a, "type": b, "name": c} for a, b, c in cur.fetchall()
    ]
    return {"rls": rls, "constraints": constraints, "counts": table_counts(cur)}


def split_sql_statements(sql: str) -> list[str]:
    """Split SQL on semicolons, respecting quotes and $tag$ dollar quotes."""
    stmts: list[str] = []
    buf: list[str] = []
    i = 0
    in_single = False
    dollar_tag: str | None = None
    while i < len(sql):
        ch = sql[i]
        if dollar_tag:
            end = sql.find(dollar_tag, i)
            if end < 0:
                buf.append(sql[i:])
                break
            buf.append(sql[i:end + len(dollar_tag)])
            i = end + len(dollar_tag)
            dollar_tag = None
            continue
        if in_single:
            buf.append(ch)
            if ch == "'" and sql[i + 1:i + 2] == "'":
                buf.append("'")
                i += 2
                continue
            if ch == "'":
                in_single = False
            i += 1
            continue
        if ch == "'":
            in_single = True
            buf.append(ch)
            i += 1
            continue
        if ch == "$":
            m_end = sql.find("$", i + 1)
            if m_end > i:
                tag = sql[i : m_end + 1]
                if tag.replace("$", "").replace("_", "").isalnum() or tag == "$$":
                    dollar_tag = tag
                    buf.append(tag)
                    i = m_end + 1
                    continue
        if ch == ";":
            stmt = "".join(buf).strip()
            if stmt:
                stmts.append(stmt)
            buf = []
            i += 1
            continue
        buf.append(ch)
        i += 1
    tail = "".join(buf).strip()
    if tail:
        stmts.append(tail)
    cleaned: list[str] = []
    for s in stmts:
        body = "\n".join(ln for ln in s.splitlines() if not ln.strip().startswith("--")).strip()
        if body:
            cleaned.append(s)
    return cleaned


def apply_migration(conn, sql_path: Path) -> None:
    sql = sql_path.read_text(encoding="utf-8")
    stmts = split_sql_statements(sql)
    print(f"[migrate] {len(stmts)} statements", file=sys.stderr, flush=True)
    for i, stmt in enumerate(stmts, 1):
        preview = " ".join(stmt.split())[:80]
        print(f"[migrate] {i}/{len(stmts)} {preview}", file=sys.stderr, flush=True)
        conn.execute(stmt)
        conn.commit()


def insert_cohort(cur, graph: dict) -> dict[str, int]:
    inserted = {
        "entities": 0,
        "identifiers": 0,
        "names": 0,
        "classifications": 0,
        "source_links": 0,
        "bridges": 0,
        "conflicts": 0,
    }

    ent_rows = [
        (
            gid(e["id"]),
            e["entityKind"],
            e["stableKey"],
            e["legalName"],
            e.get("displayName"),
            e["identityConfidence"],
            e["currentStatus"],
            e["publicProjectionStatus"],
            e.get("reviewStatus"),
            e.get("notes"),
        )
        for e in graph["entities"]
    ]
    cur.executemany(
        """
        insert into public.lender_national_entities (
          id, entity_kind, stable_key, legal_name, display_name,
          identity_confidence, current_status, public_projection_status,
          review_status, notes
        ) values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        on conflict (stable_key) do nothing
        """,
        ent_rows,
    )
    inserted["entities"] = len(ent_rows)
    print(f"[insert] entities {inserted['entities']}", file=sys.stderr, flush=True)

    name_rows = [
        (gid(n["entityId"]), n["nameKind"], n["name"], n["sourceDataset"])
        for n in graph.get("names") or []
    ]
    if name_rows:
        cur.executemany(
            """
            insert into public.lender_entity_names (
              entity_id, name_kind, name, source_dataset
            ) values (%s,%s,%s,%s)
            on conflict (entity_id, name_kind, name, source_dataset) do nothing
            """,
            name_rows,
        )
    inserted["names"] = len(name_rows)
    print(f"[insert] names {inserted['names']}", file=sys.stderr, flush=True)

    class_rows = [
        (gid(c["entityId"]), c["family"], c["source"], False, c.get("rawLabel"))
        for c in graph.get("classifications") or []
        if not c.get("isAuthoritative")
    ]
    if class_rows:
        cur.executemany(
            """
            insert into public.lender_entity_classifications (
              entity_id, family, source, is_authoritative, raw_label
            ) values (%s,%s,%s,%s,%s)
            on conflict (entity_id, family, source) do nothing
            """,
            class_rows,
        )
    inserted["classifications"] = len(class_rows)
    print(f"[insert] classifications {inserted['classifications']}", file=sys.stderr, flush=True)

    ident_rows = [
        (
            gid(i["id"]),
            gid(i.get("entityId")),
            i["identifierType"],
            i["identifierValue"],
            i.get("jurisdiction"),
            i["sourceDataset"],
            i.get("sourceRecordId"),
            i.get("observedAt"),
            i.get("status"),
            i["confidence"],
            Jsonb(i.get("rawMetadata") or {}),
        )
        for i in graph["identifiers"]
    ]
    cur.executemany(
        """
        insert into public.lender_identifiers (
          id, entity_id, identifier_type, identifier_value, jurisdiction,
          source_dataset, source_record_id, observed_at, status, confidence,
          raw_metadata
        ) values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        on conflict (identifier_type, identifier_value) do nothing
        """,
        ident_rows,
    )
    inserted["identifiers"] = len(ident_rows)
    print(f"[insert] identifiers {inserted['identifiers']}", file=sys.stderr, flush=True)

    src_rows = [
        (
            gid(s["id"]),
            s["sourceDataset"],
            s["sourceRecordId"],
            gid(s.get("entityId")),
            gid(s.get("identifierId")),
            s["attributionConfidence"],
            s["method"],
            s.get("observedAt"),
            Jsonb(s.get("rawMetadata") or {}),
        )
        for s in graph["sourceLinks"]
    ]
    cur.executemany(
        """
        insert into public.lender_source_record_links (
          id, source_dataset, source_record_id, entity_id, identifier_id,
          attribution_confidence, method, observed_at, raw_metadata
        ) values (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        on conflict (source_dataset, source_record_id) do nothing
        """,
        src_rows,
    )
    inserted["source_links"] = len(src_rows)
    print(f"[insert] source_links {inserted['source_links']}", file=sys.stderr, flush=True)

    br_rows = [
        (
            gid(b["id"]),
            b["legacySource"],
            b["legacyRowId"],
            b.get("legacySlug"),
            gid(b.get("entityId")),
            b["geoClass"],
            b["confidence"],
        )
        for b in graph["bridges"]
    ]
    cur.executemany(
        """
        insert into public.legacy_lender_bridges (
          id, legacy_source, legacy_row_id, legacy_slug, entity_id,
          geo_class, confidence
        ) values (%s,%s,%s,%s,%s,%s,%s)
        on conflict (legacy_source, legacy_row_id) do nothing
        """,
        br_rows,
    )
    inserted["bridges"] = len(br_rows)
    print(f"[insert] bridges {inserted['bridges']}", file=sys.stderr, flush=True)

    conf_rows = [
        (
            gid(c["id"]),
            c["conflictClass"],
            c.get("identifierType") or "",
            c.get("identifierValue") or "",
            Jsonb(c.get("relatedValues")),
            c["disposition"],
            c.get("notes"),
        )
        for c in graph["conflicts"]
    ]
    if conf_rows:
        cur.executemany(
            """
            insert into public.lender_identity_conflicts (
              id, conflict_class, identifier_type, identifier_value,
              related_values, disposition, notes
            ) values (%s,%s,%s,%s,%s,%s,%s)
            on conflict (conflict_class, identifier_type, identifier_value) do nothing
            """,
            conf_rows,
        )
    inserted["conflicts"] = len(conf_rows)
    print(f"[insert] conflicts {inserted['conflicts']}", file=sys.stderr, flush=True)

    return inserted


def extra_counts(cur) -> dict:
    out = {}
    cur.execute(
        "select count(*) from public.lender_national_entities where entity_kind='institution'"
    )
    out["institutions"] = int(cur.fetchone()[0])
    cur.execute("select count(*) from public.lender_identifiers")
    out["identifiers"] = int(cur.fetchone()[0])
    cur.execute(
        "select count(*) from public.lender_identifiers where identifier_type='NMLS_INSTITUTION'"
    )
    out["nmls_institution"] = int(cur.fetchone()[0])
    cur.execute(
        "select count(*) from public.lender_identifiers where identifier_type='NMLS_BRANCH'"
    )
    out["nmls_branch"] = int(cur.fetchone()[0])
    cur.execute(
        "select count(*) from public.lender_identifiers where identifier_type='NMLS_PERSON'"
    )
    out["nmls_person"] = int(cur.fetchone()[0])
    cur.execute(
        "select count(*) from public.lender_identifiers where identifier_type='LEI'"
    )
    out["lei"] = int(cur.fetchone()[0])
    cur.execute(
        """
        select count(*) from public.lender_identifiers
        where identifier_type='LEI' and entity_id is not null and confidence='confirmed'
        """
    )
    out["lei_attached"] = int(cur.fetchone()[0])
    cur.execute(
        "select count(*) from public.lender_identifiers where identifier_type='LEI' and entity_id is null"
    )
    out["lei_unattached"] = int(cur.fetchone()[0])
    cur.execute("select count(*) from public.lender_source_record_links")
    out["source_links"] = int(cur.fetchone()[0])
    cur.execute("select count(*) from public.legacy_lender_bridges")
    out["legacy_bridges"] = int(cur.fetchone()[0])
    cur.execute("select count(*) from public.lender_identity_conflicts")
    out["identity_conflicts"] = int(cur.fetchone()[0])
    cur.execute("select count(*) from public.lender_entity_relationships")
    out["relationships"] = int(cur.fetchone()[0])
    cur.execute(
        "select count(*) from public.lender_national_entities where entity_kind='branch'"
    )
    out["branch_entities"] = int(cur.fetchone()[0])
    cur.execute(
        "select count(*) from public.lender_national_entities where entity_kind='person_mlo'"
    )
    out["mlo_entities"] = int(cur.fetchone()[0])
    return out


def load_env_file(path: str) -> None:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(path)
    for raw in p.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        os.environ.setdefault(k, v)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cohort", required=True)
    parser.add_argument("--migration", required=True)
    parser.add_argument("--env-file")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    if args.env_file:
        load_env_file(args.env_file)

    url = os.environ.get("DATABASE_URL", "").strip()
    if not url:
        print(json.dumps({"ok": False, "error": "DATABASE_URL unset"}))
        return 2
    if not host_ok(url):
        print(json.dumps({"ok": False, "error": "DATABASE_URL host is not the verified Lender/Move shared project"}))
        return 3

    graph = json.loads(Path(args.cohort).read_text(encoding="utf-8"))
    sql_path = Path(args.migration)

    with psycopg.connect(url, connect_timeout=20) as conn:
        conn.autocommit = True
        conn.execute("set statement_timeout = '30s'")
        with conn.cursor() as cur:
            before = schema_report(cur)
            missing = [t for t, n in before["counts"].items() if n < 0]
            unexpected = {
                t: n
                for t, n in before["counts"].items()
                if n > 0 and t in (
                    "lender_national_entities",
                    "lender_identifiers",
                    "lender_source_record_links",
                    "legacy_lender_bridges",
                    "lender_identity_conflicts",
                )
            }
            result = {
                "ok": True,
                "apply": bool(args.apply),
                "schema_missing": missing,
                "pre_counts": before["counts"],
                "rls": before["rls"],
                "inserted": None,
                "post_counts": None,
                "detail_counts": None,
            }

            if unexpected and not args.apply:
                result["unexpected_preexisting_rows"] = unexpected
            if not args.apply:
                print(json.dumps(result, default=str))
                return 0

            if missing:
                apply_migration(conn, sql_path)
                after_mig = table_counts(cur)
                still_missing = [t for t, n in after_mig.items() if n < 0]
                if still_missing:
                    print(json.dumps({"ok": False, "error": "migration did not create tables", "missing": still_missing}))
                    return 4

        print("[insert] starting cohort", file=sys.stderr, flush=True)
        conn.autocommit = False
        conn.execute("set statement_timeout = '300s'")
        with conn.cursor() as cur:
            inserted = insert_cohort(cur, graph)
            detail = extra_counts(cur)
            conn.commit()
            result["inserted"] = inserted
            result["post_counts"] = table_counts(cur)
            result["detail_counts"] = extra_counts(cur)
            result["rls"] = schema_report(cur)["rls"]
            print(json.dumps(result, default=str))
            return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e), "type": type(e).__name__}))
        return_code = 1
        sys.exit(return_code)
