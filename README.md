## 🚀 Getting Started

### Prerequisites

- **Node.js v23.0.0** or higher (Recommended: v23.11.1)
- **pnpm** (Package manager)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/gutogalego/simple-ledger-test-reference
   cd simple-ledger-test-reference
   ```

2. **Use the correct Node version**

   ```bash
   nvm use
   # or manually: nvm use 23
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

### Running the Application

**Development Mode:**

```bash
pnpm dev
```

Starts the server on `http://localhost:3000` with hot-reloading.
_Note: You might see an "ExperimentalWarning: SQLite" - this is normal._

**Running Tests:**

```bash
pnpm test
```

# 🏦 Node.js Accounting Ledger

A robust, double-entry accounting ledger system built with Node.js, Hono, and SQLite.

## 🌟 Features

- **Double-Entry Bookkeeping**: Enforces balanced transactions (debits = credits).
- **Immutability**: Database triggers prevent deletion of accounts and transactions.
- **ACID Guarantees**: Uses SQLite with WAL mode for data integrity.
- **Idempotency**: Prevents duplicate transaction processing using `node-cache`.
- **Node.js Native SQLite**: Leverages the new native SQLite module in Node 23+.
- **Clustering**: Runs multiple worker processes for parallel request handling.
- **Type Safety**: Built with TypeScript and Zod validation.

## 🛠️ Tech Stack

- **Runtime**: Node.js v23+ (Required for native SQLite)
- **Framework**: [Hono](https://hono.dev/) (Lightweight, ultra-fast web framework)
- **Database**: Native `node:sqlite` (Zero-dependency SQLite)
- **Validation**: Zod
- **Testing**: Vitest
- **Caching**: node-cache (Idempotency)

## 📐 Architecture

The project follows a **Hexagonal / Clean Architecture** inspired structure:

```
src/
├── domain/          # Core business logic and rules (Money, Errors)
├── modules/         # Feature modules (Accounts, Transactions)
│   ├── accounts/    # Account management
│   └── transactions/# Ledger entries & balancing logic
├── infra/           # Infrastructure implementations (SQLite Database)
├── shared/          # Shared utilities (Middleware, Caching)
└── index.ts         # Application entry point & Clustering
```

### Key Design Decisions

1. **Native SQLite**: I though about creating our own in memory implementation since having a DB is not required. But since Node 22.5+ has an experimental SQLite, I opted for that. It was simple, server the purpose, and I could enfoce a non-delete policy on the ledger.

2. **Database Constraints**: Business rules (like non-negative amounts and valid directions) are enforced at the database level using CHECK constraints. They are also on the Domain level. You can't create a non-balanced transaction.

3. **Validation**: We use Zod for runtime validation. We could have used it

4. **Immutability**: `BEFORE DELETE` triggers in SQLite prevent any deletion of accounts or transactions, ensuring a strictly append-only ledger.

5. **Iterator Helpers**: Complex logic like balance calculation uses immutable iterator chains for clarity and performance.

6. **Error Handling**: The application throws rich domain and HTTP errors which are centrally handled by a global Hono error handler (`src/shared/middlewares/error-handler.ts`). This pattern is similar to NestJS exception filters: routes and services simply `throw`, and the middleware is responsible for mapping those exceptions to consistent JSON responses and HTTP status codes.

## 🔒 API Endpoints

### Accounts

- **POST** `/accounts` - Create a new account
  ```json
  { "name": "Cash", "direction": "debit" }
  ```
- **GET** `/accounts/:id` - Get account details & balance
- **GET** `/accounts` - List all accounts

### Transactions

- **POST** `/transactions` - Record a new transaction

  ```json
  {
    "name": "Sale",
    "entries": [
      { "account_id": "uuid-1", "direction": "debit", "amount": 100 },
      { "account_id": "uuid-2", "direction": "credit", "amount": 100 }
    ]
  }
  ```

  _Must be balanced (debits == credits)_

- **GET** `/transactions/:id` - Get transaction details
- **GET** `/transactions` - List all transactions

## 🖥️ Public HTML (for Local Testing Only)

There is a small `public/index.html` file that is served at the root route (`GET /`) when you run the app locally:

- It exists **purely for manual testing and demo purposes**.
- In a real production setup this would either be removed entirely, or replaced by a proper frontend (SPA, Next.js app, etc.) served by a different asset pipeline or reverse proxy.
- The backend itself does not depend on this HTML page for any core functionality.

## 🛡️ Idempotency

Transaction creation is idempotent. If you send the exact same transaction payload within **15 minutes**, the server will:

- Detect it as a duplicate
- Return `409 Conflict`
- Prevent double-counting in the ledger

## 🧪 Testing

We use **Vitest** for testing:

- Unit tests for Domain logic (Money, Balancing)
- Integration tests for API endpoints
- Database tests ensuring constraints and triggers work

Note: Since testing wasn't a requirement, I ended up adding some tests only on the more crucial elements of the application.

```bash
# Run all tests
pnpm test

# Run with UI
pnpm test:ui
```

## 🚧 Next Steps / Future Improvements

This project is intentionally small and focused, but there are a bunch of directions it could grow without losing its simplicity:

1. **Persistence & Migrations**

   - Add a tiny migration system (custom SQL files are fine) so the SQLite schema can evolve cleanly over time.
   - Maybe add simple backup/restore tooling and scheduled backups for `ledger_v3.db`.

2. **Observability & Operations**

   - Introduce structured logging (Pino, etc.) and include correlation/request IDs so you can trace individual operations.
   - Expose basic metrics—request counts, latency, DB issues—via `/metrics` for Prometheus.
   - Add standard health/readiness endpoints to play nicely with container orchestrators like Kubernetes or ECS.

3. **Richer Domain & Features**

   - Add multiple-currency support and clear currency conversion rules to the `Money` type.
   - Expand the domain a bit: journals, posting dates, accounting periods, parent/child account trees, etc.
   - Support pagination and filtering on listings (by dates, accounts, amounts, and so on).

4. **API & Contracts**

   - Publish an OpenAPI/Swagger spec and generate typed clients from it.
   - Add a real versioning approach (`/v1`, headers, whatever fits) so the API can evolve without breaking people.

5. **Performance & Scalability**

   - Benchmark real read/write workloads and tune SQLite pragmas (journal mode, cache size, etc.).
   - If needed, you could introduce simple read replicas (file copies) or even swap SQLite for Postgres while keeping the same domain and repository layers.

6. **Security & Hardening**

   - Add authentication/authorization (API keys, JWTs, etc.) and proper tenant isolation.
   - Implement rate limiting and tighten input validation across endpoints.

7. **Developer Experience**

   - Add more focused tests—especially around error handling, idempotency, and “big ledger” scenarios (thousands of entries).
   - Provide example scripts or a small CLI to seed demo data and inspect balances from the terminal.

---
