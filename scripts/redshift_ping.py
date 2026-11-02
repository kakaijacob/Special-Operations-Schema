#!/usr/bin/env python3
"""Smoke-test Redshift using env vars only. Never hardcode passwords."""

from __future__ import annotations

import os
import sys

try:
    import psycopg2
except ImportError:
    print("Missing psycopg2. Install with: pip install psycopg2-binary", file=sys.stderr)
    sys.exit(2)

REQUIRED = (
    "REDSHIFT_HOST",
    "REDSHIFT_DB",
    "REDSHIFT_USER",
    "REDSHIFT_PASSWORD",
)


def main() -> int:
    missing = [k for k in REQUIRED if not os.environ.get(k)]
    if missing:
        print(
            "Missing env vars: "
            + ", ".join(missing)
            + "\nSet Cursor Environment Secrets (Cloud Agent) or a local .env (WSL).",
            file=sys.stderr,
        )
        return 2

    host = os.environ["REDSHIFT_HOST"]
    port = os.environ.get("REDSHIFT_PORT", "5439")
    db = os.environ["REDSHIFT_DB"]
    user = os.environ["REDSHIFT_USER"]
    password = os.environ["REDSHIFT_PASSWORD"]
    schema = os.environ.get("REDSHIFT_SCHEMA", "public")

    conn = psycopg2.connect(
        host=host,
        port=port,
        dbname=db,
        user=user,
        password=password,
        connect_timeout=15,
        sslmode="require",
    )
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute("SELECT current_database(), current_user")
        database, current_user = cur.fetchone()
        cur.execute("SET search_path TO %s", (schema,))
        cur.execute(
            """
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = %s
            """,
            (schema,),
        )
        table_count = cur.fetchone()[0]
    conn.close()

    print("ok")
    print(f"database={database}")
    print(f"user={current_user}")
    print(f"schema={schema}")
    print(f"tables_in_schema={table_count}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001 — CLI surface
        print(f"connect_failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
