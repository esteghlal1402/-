from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import aiosqlite


class Database:
    def __init__(self, path: str) -> None:
        self.path = path
        self._conn: Optional[aiosqlite.Connection] = None

    async def connect(self) -> None:
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        self._conn = await aiosqlite.connect(self.path)
        self._conn.row_factory = aiosqlite.Row
        await self._conn.execute("PRAGMA journal_mode=WAL;")
        await self._conn.execute("PRAGMA foreign_keys=ON;")
        await self._conn.commit()

    @property
    def conn(self) -> aiosqlite.Connection:
        if not self._conn:
            raise RuntimeError("Database not connected")
        return self._conn

    async def initialize(self) -> None:
        await self.connect()
        await self.conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS todos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                text TEXT NOT NULL,
                done INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                done_at TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_todos_user ON todos(user_id, done);

            CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                chat_id INTEGER NOT NULL,
                text TEXT NOT NULL,
                run_at TEXT NOT NULL, -- ISO string in UTC
                sent INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_reminders_pending ON reminders(sent, run_at);
            """
        )
        await self.conn.commit()

    async def add_todo(self, user_id: int, text: str) -> int:
        cur = await self.conn.execute(
            "INSERT INTO todos (user_id, text) VALUES (?, ?)", (user_id, text)
        )
        await self.conn.commit()
        return cur.lastrowid

    async def list_todos(self, user_id: int, include_done: bool = False) -> List[Dict[str, Any]]:
        if include_done:
            sql = (
                "SELECT id, text, done, created_at, done_at FROM todos "
                "WHERE user_id=? ORDER BY done, id"
            )
            args = (user_id,)
        else:
            sql = (
                "SELECT id, text, done, created_at, done_at FROM todos "
                "WHERE user_id=? AND done=0 ORDER BY id"
            )
            args = (user_id,)
        cur = await self.conn.execute(sql, args)
        rows = await cur.fetchall()
        return [dict(row) for row in rows]

    async def complete_todo(self, user_id: int, todo_id: int) -> bool:
        cur = await self.conn.execute(
            "UPDATE todos SET done=1, done_at=CURRENT_TIMESTAMP "
            "WHERE user_id=? AND id=? AND done=0",
            (user_id, todo_id),
        )
        await self.conn.commit()
        return cur.rowcount > 0

    async def add_reminder(self, user_id: int, chat_id: int, when: datetime, text: str) -> int:
        when_utc_iso = when.astimezone(timezone.utc).isoformat()
        cur = await self.conn.execute(
            "INSERT INTO reminders (user_id, chat_id, text, run_at) VALUES (?, ?, ?, ?)",
            (user_id, chat_id, text, when_utc_iso),
        )
        await self.conn.commit()
        return cur.lastrowid

    async def list_pending_reminders(self) -> List[Dict[str, Any]]:
        cur = await self.conn.execute(
            "SELECT id, user_id, chat_id, text, run_at FROM reminders WHERE sent=0 ORDER BY run_at"
        )
        rows = await cur.fetchall()
        results: List[Dict[str, Any]] = []
        for row in rows:
            d = dict(row)
            try:
                d["run_at"] = datetime.fromisoformat(d["run_at"]).astimezone(timezone.utc)
            except Exception:
                d["run_at"] = datetime.now(timezone.utc)
            results.append(d)
        return results

    async def mark_reminder_sent(self, reminder_id: int) -> None:
        await self.conn.execute("UPDATE reminders SET sent=1 WHERE id=?", (reminder_id,))
        await self.conn.commit()

    async def close(self) -> None:
        if self._conn:
            await self._conn.close()
            self._conn = None

