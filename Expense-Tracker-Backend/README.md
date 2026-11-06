# Expense Tracker FastAPI Backend

A minimal REST API for managing expense, income, and investment transactions. The API stores user-specific data in SQLite and supports create, read, update, and delete operations.

## Features

- FastAPI REST API
- SQLite database storage
- Separate transactions for each username
- CRUD operations for transactions
- CORS enabled for browser applications
- Automatic database and table initialization
- Interactive Swagger and ReDoc documentation

## Technology Stack

- Python 3
- FastAPI
- Uvicorn
- SQLite
- Pydantic

## Project Structure

```text
Expense-Tracker-Backend/
|-- main.py
|-- requirements.txt
|-- README.md
|-- expenses.db
`-- myvenv/
```

`expenses.db` is created automatically when the application starts.

## Prerequisites

- Python 3.9 or newer
- Windows PowerShell

## Setup

Open PowerShell in the backend folder and run:

```powershell
python -m venv myvenv
.\myvenv\Scripts\Activate.ps1
pip install -r requirements.txt
```

If PowerShell blocks the activation script, run this command first for the current session:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## Run the API

```powershell
uvicorn main:app --reload
```

The API is available at:

- API base URL: `http://localhost:8000`
- Transactions: `http://localhost:8000/transactions`
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Data Model

### Transaction request

```json
{
  "description": "Monthly salary",
  "amount": 5000,
  "dateoftransaction": "2026-11-02",
  "transactiontype": "income"
}
```

### Transaction response

```json
{
  "id": 1,
  "description": "Monthly salary",
  "amount": 5000,
  "dateoftransaction": "2026-11-02",
  "transactiontype": "income"
}
```

The `username` is supplied separately as a query parameter. It is not part of the JSON request model.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/transactions?username={username}` | Create a transaction |
| `GET` | `/transactions?username={username}` | List all transactions for a user |
| `GET` | `/transactions/{id}?username={username}` | Get one transaction |
| `PUT` | `/transactions/{id}?username={username}` | Update one transaction |
| `DELETE` | `/transactions/{id}?username={username}` | Delete one transaction |

## Endpoint Examples

The following examples use PowerShell's `Invoke-RestMethod`. Replace the username and ID when needed.

### Create a transaction

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8000/transactions?username=Dhiraj" `
  -ContentType "application/json" `
  -Body '{"description":"Monthly salary","amount":5000,"dateoftransaction":"2026-11-02","transactiontype":"income"}'
```

### List transactions for a user

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/transactions?username=Dhiraj"
```

### Get a transaction

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/transactions/1?username=Dhiraj"
```

### Update a transaction

```powershell
Invoke-RestMethod `
  -Method Put `
  -Uri "http://localhost:8000/transactions/1?username=Dhiraj" `
  -ContentType "application/json" `
  -Body '{"description":"Updated salary","amount":5200,"dateoftransaction":"2026-11-02","transactiontype":"income"}'
```

### Delete a transaction

```powershell
Invoke-RestMethod -Method Delete -Uri "http://localhost:8000/transactions/1?username=Dhiraj"
```

## Browser Fetch Examples

### List transactions

```javascript
const username = "Dhiraj";
const response = await fetch(
  `http://localhost:8000/transactions?username=${encodeURIComponent(username)}`
);
const transactions = await response.json();
```

### Create a transaction

```javascript
const username = "Dhiraj";
const response = await fetch(
  `http://localhost:8000/transactions?username=${encodeURIComponent(username)}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      description: "Monthly salary",
      amount: 5000,
      dateoftransaction: "2026-11-02",
      transactiontype: "income"
    })
  }
);
const transaction = await response.json();
```

### Delete a transaction

```javascript
const username = "Dhiraj";
await fetch(
  `http://localhost:8000/transactions/1?username=${encodeURIComponent(username)}`,
  { method: "DELETE" }
);
```

## User Data Isolation

Every API operation requires a `username` query parameter. The backend stores this value in the `transactions.username` column and filters reads, updates, and deletes by both transaction ID and username.

This prevents one user from reading, changing, or deleting another user's transaction. Use a stable, unique value for the logged-in user, such as the account username or user ID.

## SQLite Database

The API creates and maintains the following table automatically:

```sql
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  dateoftransaction TEXT NOT NULL,
  transactiontype TEXT NOT NULL
);
```

On startup, the API also checks for an older database without a `username` column and adds that column without deleting existing records.

## CORS Configuration

The API allows requests from any origin, method, and header. This enables the Expense Tracker frontend served locally or from another development URL to call the API.

## Status Codes

- `200 OK`: Request succeeded
- `201 Created`: Transaction created
- `204 No Content`: Transaction deleted
- `404 Not Found`: Transaction does not exist for the supplied username
- `422 Unprocessable Entity`: Request data does not match the API model

## Testing the API

1. Start the backend with `uvicorn main:app --reload`.
2. Open `http://localhost:8000/docs`.
3. Expand a transaction endpoint.
4. Enter the required username as the query parameter.
5. Provide the transaction JSON body where required.
6. Execute the request and inspect the response.

## Common Issues

### Address already in use

Stop the existing Uvicorn process or start another port:

```powershell
uvicorn main:app --reload --port 8001
```

When using another port, update the frontend API URL accordingly.

### Module not found

Make sure the virtual environment is active and dependencies are installed:

```powershell
pip install -r requirements.txt
```

### Browser cannot call the API

Confirm that:

- Uvicorn is running on port `8000`.
- CORS middleware is enabled.
- The browser URL uses the correct username query parameter.
- Frontend requests use `http://localhost:8000`, not `https://localhost:8000`.
