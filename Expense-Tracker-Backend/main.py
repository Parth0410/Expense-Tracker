import sqlite3
from contextlib import contextmanager
from datetime import date
from pathlib import Path
from typing import Iterator

from fastapi import FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DATABASE_PATH = Path(__file__).with_name("expenses.db")


class TransactionCreate(BaseModel):
    description: str
    amount: float
    dateoftransaction: date
    transactiontype: str


class Transaction(TransactionCreate):
    id: int


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def initialize_database() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL DEFAULT '',
                description TEXT NOT NULL,
                amount REAL NOT NULL,
                dateoftransaction TEXT NOT NULL,
                transactiontype TEXT NOT NULL
            )
            """
        )
        columns = {
            row[1]
            for row in connection.execute("PRAGMA table_info(transactions)").fetchall()
        }
        if "username" not in columns:
            connection.execute(
                "ALTER TABLE transactions ADD COLUMN username TEXT NOT NULL DEFAULT ''"
            )


app = FastAPI(title="Expense Tracker API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
initialize_database()


@app.post("/transactions", response_model=Transaction, status_code=status.HTTP_201_CREATED)
def create_transaction(transaction: TransactionCreate, username: str) -> Transaction:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO transactions
                (username, description, amount, dateoftransaction, transactiontype)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                username.strip(),
                transaction.description,
                transaction.amount,
                transaction.dateoftransaction.isoformat(),
                transaction.transactiontype,
            ),
        )
        row = connection.execute(
            "SELECT * FROM transactions WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    return Transaction(**dict(row))


@app.get("/transactions", response_model=list[Transaction])
def list_transactions(username: str) -> list[Transaction]:
    username = username.strip()
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT * FROM transactions
            WHERE username = ?
            ORDER BY dateoftransaction DESC, id DESC
            """,
            (username,),
        ).fetchall()
    return [Transaction(**dict(row)) for row in rows]


@app.get("/transactions/{transaction_id}", response_model=Transaction)
def get_transaction(transaction_id: int, username: str) -> Transaction:
    username = username.strip()
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM transactions WHERE id = ? AND username = ?",
            (transaction_id, username),
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return Transaction(**dict(row))


@app.put("/transactions/{transaction_id}", response_model=Transaction)
def update_transaction(transaction_id: int, transaction: TransactionCreate, username: str) -> Transaction:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            UPDATE transactions
            SET description = ?, amount = ?, dateoftransaction = ?, transactiontype = ?
            WHERE id = ? AND username = ?
            """,
            (
                transaction.description,
                transaction.amount,
                transaction.dateoftransaction.isoformat(),
                transaction.transactiontype,
                transaction_id,
                username.strip(),
            ),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")
        row = connection.execute(
            "SELECT * FROM transactions WHERE id = ? AND username = ?",
            (transaction_id, username.strip()),
        ).fetchone()
    return Transaction(**dict(row))


@app.delete("/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(transaction_id: int, username: str) -> Response:
    username = username.strip()
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM transactions WHERE id = ? AND username = ?",
            (transaction_id, username),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
