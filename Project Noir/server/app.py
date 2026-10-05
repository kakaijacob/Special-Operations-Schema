"""
Project Noir shared books server.

Shop staff submit orders & expenditures.
Manager sees live data and full financial statements.
"""

from __future__ import annotations

import json
import os
import secrets
import sqlite3
import uuid
from datetime import datetime, timezone
from functools import wraps
from pathlib import Path

from flask import Flask, g, jsonify, request, send_from_directory, session

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "server" / "data"
DB_PATH = DATA_DIR / "noir.db"
SEED_PATH = ROOT / "data" / "seed.json"
STATIC_ROOT = ROOT

# Default shop logins — change these before going live
USERS = {
    "staff": {"password": os.environ.get("NOIR_STAFF_PASSWORD", "staff123"), "role": "staff", "name": "Shop Staff"},
    "manager": {"password": os.environ.get("NOIR_MANAGER_PASSWORD", "manager123"), "role": "manager", "name": "Manager"},
}

app = Flask(__name__, static_folder=None)
app.secret_key = os.environ.get("NOIR_SECRET", "laundry-noir-dev-secret-change-me")


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def get_db() -> sqlite3.Connection:
    if "db" not in g:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(_exc=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS meta (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          customer_name TEXT NOT NULL,
          customer_id TEXT,
          order_date TEXT,
          delivery_date TEXT,
          customer_tag TEXT,
          location TEXT,
          building TEXT,
          service TEXT,
          quantity REAL,
          unit_price REAL,
          payment_status TEXT,
          delivery_status TEXT,
          notes TEXT,
          submitted_by TEXT,
          created_at TEXT,
          updated_at TEXT
        );
        CREATE TABLE IF NOT EXISTS expenditures (
          id TEXT PRIMARY KEY,
          date_incurred TEXT,
          category TEXT,
          description TEXT,
          supplier TEXT,
          payment_method TEXT,
          amount REAL,
          source TEXT,
          notes TEXT,
          submitted_by TEXT,
          created_at TEXT,
          updated_at TEXT
        );
        CREATE TABLE IF NOT EXISTS balance_sheet (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          payload TEXT NOT NULL
        );
        """
    )
    seeded = db.execute("SELECT value FROM meta WHERE key='seeded'").fetchone()
    if not seeded:
        seed = json.loads(SEED_PATH.read_text())
        now = utc_now()
        for o in seed.get("orders", []):
            oid = o.get("id") or f"ord_{uuid.uuid4().hex[:10]}"
            db.execute(
                """
                INSERT INTO orders (
                  id, customer_name, customer_id, order_date, delivery_date, customer_tag,
                  location, building, service, quantity, unit_price, payment_status,
                  delivery_status, notes, submitted_by, created_at, updated_at
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """,
                (
                    oid,
                    o.get("customerName") or "",
                    o.get("customerId") or "",
                    o.get("orderDate") or "",
                    o.get("deliveryDate") or "",
                    o.get("customerTag") or "",
                    o.get("location") or "",
                    o.get("building") or "",
                    o.get("service") or "",
                    float(o.get("quantity") or 0),
                    float(o.get("unitPrice") or 0),
                    o.get("paymentStatus") or "Pending",
                    o.get("deliveryStatus") or "Pending",
                    o.get("notes") or "",
                    "seed",
                    now,
                    now,
                ),
            )
        for e in seed.get("expenditures", []):
            eid = e.get("id") or f"exp_{uuid.uuid4().hex[:10]}"
            db.execute(
                """
                INSERT INTO expenditures (
                  id, date_incurred, category, description, supplier, payment_method,
                  amount, source, notes, submitted_by, created_at, updated_at
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
                """,
                (
                    eid,
                    e.get("dateIncurred") or "",
                    e.get("category") or "",
                    e.get("description") or "",
                    e.get("supplier") or "",
                    e.get("paymentMethod") or "M-Pesa",
                    float(e.get("amount") or 0),
                    e.get("source") or "",
                    e.get("notes") or "",
                    "seed",
                    now,
                    now,
                ),
            )
        bs = seed.get("balanceSheet") or {}
        db.execute(
            "INSERT INTO balance_sheet (id, payload) VALUES (1, ?)",
            (json.dumps(bs),),
        )
        db.execute(
            "INSERT INTO meta (key, value) VALUES ('seeded', ?), ('catalog', ?)",
            ("1", json.dumps(seed.get("catalog") or {})),
        )
        db.commit()
    db.close()


def require_auth(roles=None):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = session.get("user")
            if not user:
                return jsonify({"error": "Login required"}), 401
            if roles and user.get("role") not in roles:
                return jsonify({"error": "Not allowed for your role"}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def order_from_row(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "customerName": row["customer_name"],
        "customerId": row["customer_id"] or "",
        "orderDate": row["order_date"] or "",
        "deliveryDate": row["delivery_date"] or "",
        "customerTag": row["customer_tag"] or "",
        "location": row["location"] or "",
        "building": row["building"] or "",
        "service": row["service"] or "",
        "quantity": row["quantity"] or 0,
        "unitPrice": row["unit_price"] or 0,
        "paymentStatus": row["payment_status"] or "Pending",
        "deliveryStatus": row["delivery_status"] or "Pending",
        "notes": row["notes"] or "",
        "submittedBy": row["submitted_by"] or "",
        "createdAt": row["created_at"] or "",
        "updatedAt": row["updated_at"] or "",
    }


def exp_from_row(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "dateIncurred": row["date_incurred"] or "",
        "category": row["category"] or "",
        "description": row["description"] or "",
        "supplier": row["supplier"] or "",
        "paymentMethod": row["payment_method"] or "",
        "amount": row["amount"] or 0,
        "source": row["source"] or "",
        "notes": row["notes"] or "",
        "submittedBy": row["submitted_by"] or "",
        "createdAt": row["created_at"] or "",
        "updatedAt": row["updated_at"] or "",
    }


def load_catalog(db) -> dict:
    row = db.execute("SELECT value FROM meta WHERE key='catalog'").fetchone()
    return json.loads(row["value"]) if row else {}


def load_balance(db) -> dict:
    row = db.execute("SELECT payload FROM balance_sheet WHERE id=1").fetchone()
    return json.loads(row["payload"]) if row else {}


def full_state(db) -> dict:
    orders = [order_from_row(r) for r in db.execute("SELECT * FROM orders ORDER BY order_date DESC, created_at DESC")]
    exps = [exp_from_row(r) for r in db.execute("SELECT * FROM expenditures ORDER BY date_incurred DESC, created_at DESC")]
    return {
        "catalog": load_catalog(db),
        "orders": orders,
        "expenditures": exps,
        "balanceSheet": load_balance(db),
    }


# -------- Auth --------


@app.post("/api/login")
def login():
    body = request.get_json(force=True, silent=True) or {}
    username = (body.get("username") or "").strip().lower()
    password = body.get("password") or ""
    user = USERS.get(username)
    if not user or user["password"] != password:
        return jsonify({"error": "Wrong username or password"}), 401
    session["user"] = {
        "username": username,
        "role": user["role"],
        "name": user["name"],
    }
    return jsonify({"user": session["user"]})


@app.post("/api/logout")
def logout():
    session.clear()
    return jsonify({"ok": True})


@app.get("/api/me")
def me():
    user = session.get("user")
    if not user:
        return jsonify({"user": None})
    return jsonify({"user": user})


# -------- Shared books --------


@app.get("/api/state")
@require_auth()
def get_state():
    return jsonify(full_state(get_db()))


@app.get("/api/orders")
@require_auth()
def list_orders():
    db = get_db()
    rows = db.execute("SELECT * FROM orders ORDER BY created_at DESC").fetchall()
    return jsonify([order_from_row(r) for r in rows])


@app.post("/api/orders")
@require_auth(roles=["staff", "manager"])
def create_order():
    body = request.get_json(force=True, silent=True) or {}
    user = session["user"]
    now = utc_now()
    oid = body.get("id") or f"ord_{uuid.uuid4().hex[:10]}"
    db = get_db()
    db.execute(
        """
        INSERT INTO orders (
          id, customer_name, customer_id, order_date, delivery_date, customer_tag,
          location, building, service, quantity, unit_price, payment_status,
          delivery_status, notes, submitted_by, created_at, updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        (
            oid,
            (body.get("customerName") or "").strip(),
            (body.get("customerId") or "").strip(),
            body.get("orderDate") or "",
            body.get("deliveryDate") or "",
            body.get("customerTag") or "Household",
            body.get("location") or "",
            body.get("building") or "",
            body.get("service") or "",
            float(body.get("quantity") or 0),
            float(body.get("unitPrice") or 0),
            body.get("paymentStatus") or "Pending",
            body.get("deliveryStatus") or "Pending",
            body.get("notes") or "",
            user["username"],
            now,
            now,
        ),
    )
    db.commit()
    row = db.execute("SELECT * FROM orders WHERE id=?", (oid,)).fetchone()
    return jsonify(order_from_row(row)), 201


@app.put("/api/orders/<oid>")
@require_auth(roles=["manager"])
def update_order(oid):
    body = request.get_json(force=True, silent=True) or {}
    db = get_db()
    existing = db.execute("SELECT id FROM orders WHERE id=?", (oid,)).fetchone()
    if not existing:
        return jsonify({"error": "Not found"}), 404
    now = utc_now()
    db.execute(
        """
        UPDATE orders SET
          customer_name=?, customer_id=?, order_date=?, delivery_date=?, customer_tag=?,
          location=?, building=?, service=?, quantity=?, unit_price=?, payment_status=?,
          delivery_status=?, notes=?, updated_at=?
        WHERE id=?
        """,
        (
            (body.get("customerName") or "").strip(),
            (body.get("customerId") or "").strip(),
            body.get("orderDate") or "",
            body.get("deliveryDate") or "",
            body.get("customerTag") or "Household",
            body.get("location") or "",
            body.get("building") or "",
            body.get("service") or "",
            float(body.get("quantity") or 0),
            float(body.get("unitPrice") or 0),
            body.get("paymentStatus") or "Pending",
            body.get("deliveryStatus") or "Pending",
            body.get("notes") or "",
            now,
            oid,
        ),
    )
    db.commit()
    row = db.execute("SELECT * FROM orders WHERE id=?", (oid,)).fetchone()
    return jsonify(order_from_row(row))


@app.delete("/api/orders/<oid>")
@require_auth(roles=["manager"])
def delete_order(oid):
    db = get_db()
    db.execute("DELETE FROM orders WHERE id=?", (oid,))
    db.commit()
    return jsonify({"ok": True})


@app.post("/api/expenditures")
@require_auth(roles=["staff", "manager"])
def create_exp():
    body = request.get_json(force=True, silent=True) or {}
    user = session["user"]
    now = utc_now()
    eid = body.get("id") or f"exp_{uuid.uuid4().hex[:10]}"
    db = get_db()
    db.execute(
        """
        INSERT INTO expenditures (
          id, date_incurred, category, description, supplier, payment_method,
          amount, source, notes, submitted_by, created_at, updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        (
            eid,
            body.get("dateIncurred") or "",
            body.get("category") or "Operating Expenses",
            (body.get("description") or "").strip(),
            body.get("supplier") or "",
            body.get("paymentMethod") or "M-Pesa",
            float(body.get("amount") or 0),
            body.get("source") or "Business Account",
            body.get("notes") or "",
            user["username"],
            now,
            now,
        ),
    )
    db.commit()
    row = db.execute("SELECT * FROM expenditures WHERE id=?", (eid,)).fetchone()
    return jsonify(exp_from_row(row)), 201


@app.put("/api/expenditures/<eid>")
@require_auth(roles=["manager"])
def update_exp(eid):
    body = request.get_json(force=True, silent=True) or {}
    db = get_db()
    if not db.execute("SELECT id FROM expenditures WHERE id=?", (eid,)).fetchone():
        return jsonify({"error": "Not found"}), 404
    now = utc_now()
    db.execute(
        """
        UPDATE expenditures SET
          date_incurred=?, category=?, description=?, supplier=?, payment_method=?,
          amount=?, source=?, notes=?, updated_at=?
        WHERE id=?
        """,
        (
            body.get("dateIncurred") or "",
            body.get("category") or "Operating Expenses",
            (body.get("description") or "").strip(),
            body.get("supplier") or "",
            body.get("paymentMethod") or "M-Pesa",
            float(body.get("amount") or 0),
            body.get("source") or "Business Account",
            body.get("notes") or "",
            now,
            eid,
        ),
    )
    db.commit()
    row = db.execute("SELECT * FROM expenditures WHERE id=?", (eid,)).fetchone()
    return jsonify(exp_from_row(row))


@app.delete("/api/expenditures/<eid>")
@require_auth(roles=["manager"])
def delete_exp(eid):
    db = get_db()
    db.execute("DELETE FROM expenditures WHERE id=?", (eid,))
    db.commit()
    return jsonify({"ok": True})


@app.put("/api/balance")
@require_auth(roles=["manager"])
def update_balance():
    body = request.get_json(force=True, silent=True) or {}
    db = get_db()
    db.execute("UPDATE balance_sheet SET payload=? WHERE id=1", (json.dumps(body),))
    db.commit()
    return jsonify(body)


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "service": "project-noir"})


# -------- Static frontend --------


@app.get("/")
def index():
    return send_from_directory(STATIC_ROOT, "index.html")


@app.get("/<path:path>")
def static_proxy(path):
    target = STATIC_ROOT / path
    if target.is_file():
        return send_from_directory(STATIC_ROOT, path)
    return jsonify({"error": "Not found"}), 404


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if DB_PATH.exists() and os.environ.get("NOIR_RESET_DB") == "1":
        DB_PATH.unlink()
    init_db()
    host = os.environ.get("NOIR_HOST", "0.0.0.0")
    port = int(os.environ.get("NOIR_PORT", "5173"))
    print(f"Project Noir running on http://{host}:{port}")
    print("Logins: staff / staff123   ·   manager / manager123")
    print("On a phone (same Wi‑Fi): http://<this-computer-ip>:5173")
    app.run(host=host, port=port, debug=False)


if __name__ == "__main__":
    main()
