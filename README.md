# FAINANCE - Virtual Financial Advisor (POC)

`FAINANCE` is a mobile-first personal finance product concept built for **WebDev Adventure 2026**.  
The project targets Problem Domain #5 (Finance): making financial guidance more accessible through smart expense tracking, visual analytics, and an AI advisor experience.

This repository is the implementation aligned with the POC document:
- Core finance management screens
- Smart input experience (UI flow for voice/OCR/manual)
- AI advisor chat interface
- Reports and budgeting visuals
- Tracker backend APIs for finance data management

---

## 1) POC Scope vs Current Implementation

### POC scope in the document
- Smart transaction capture (manual + OCR + ASR)
- Budget and savings-goal management
- AI financial advisor with RAG architecture
- Market-aware suggestions (interest rate, gold price, FX)
- Mobile-first UX

### What is implemented in this repo right now
- **Frontend mobile web app (React + Vite)** with:
  - Dashboard
  - Transactions
  - Budget
  - Goals
  - Calendar
  - Smart Input page (UX flow)
  - AI Advisor page (chat UX)
  - Reports & statistics (charts)
- **Backend finance tracker API (FastAPI)** with:
  - Categories API
  - Transactions CRUD API
  - Budgets API
  - Goals API
  - Dashboard summary API
  - Calendar API
  - Reports API
  - Smart Input draft/confirm API
  - Health check API

### Not fully implemented yet (planned from POC)
- Production AI pipeline (RAG, vector DB, layered knowledge store)
- OCR/ASR inference backend
- Financial market API ingestion pipeline
- Full authentication + user account system
- Production deployment, observability, and scaling

---

## 2) Repository Structure

```text
FinancialAdvisor/
├─ frontend/                              # React + Vite + Tailwind UI application
├─ backend/                               # FastAPI backend for finance tracker
│  ├─ api/                                # HTTP API layer
│  │  ├─ __init__.py                      # Package marker for api
│  │  └─ v1/                              # Version 1 API namespace
│  │     ├─ __init__.py                   # Package marker for api.v1
│  │     ├─ api.py                        # Root router that mounts all v1 endpoints
│  │     └─ endpoints/                    # Endpoint modules grouped by feature
│  │        ├─ __init__.py                # Package marker for endpoint modules
│  │        ├─ health.py                  # App health check + database health check
│  │        ├─ categories.py              # Category listing endpoints
│  │        ├─ transactions.py            # Transactions CRUD endpoints
│  │        ├─ budgets.py                 # Monthly budget endpoints
│  │        ├─ goals.py                   # Savings goals endpoints
│  │        ├─ dashboard.py               # Dashboard summary endpoint
│  │        ├─ calendar.py                # Calendar month/day endpoints
│  │        ├─ reports.py                 # Reports and analytics endpoints
│  │        └─ smart_input.py             # Voice/OCR draft + confirm endpoints
│  ├─ core/                               # Shared core config and enums
│  │  ├─ __init__.py                      # Package marker for core
│  │  ├─ config.py                        # Loads settings from .env
│  │  ├─ enums.py                         # Shared enums: transaction type, source, status, report period
│  │  ├─ exceptions.py                    # Reusable HTTP exception helpers
│  │  └─ security.py                      # Auth/security stub for current POC stage
│  ├─ db/                                 # Database bootstrap and session management
│  │  ├─ __init__.py                      # Exports Base, engine, session, and db dependency
│  │  ├─ base.py                          # SQLAlchemy Base + imports all models for metadata registration
│  │  ├─ session.py                       # Creates engine, SessionLocal, and get_db()
│  │  └─ init_db.py                       # Minimal DB init helper for current development stage
│  ├─ models/                             # SQLAlchemy ORM models mapped to PostgreSQL tables
│  │  ├─ __init__.py                      # Exports all model classes
│  │  ├─ user.py                          # User model; currently used mainly as data owner
│  │  ├─ category.py                      # Category model for income and expense groups
│  │  ├─ transaction.py                   # Transaction model; source of truth for tracker data
│  │  ├─ budget.py                        # Budget model by month and category
│  │  ├─ goal.py                          # Savings goal model
│  │  └─ smart_input_draft.py             # Draft model before smart input becomes a real transaction
│  ├─ repositories/                       # Data-access layer; DB queries only
│  │  ├─ __init__.py                      # Exports repository classes
│  │  ├─ category_repository.py           # Category lookup and list queries
│  │  ├─ transaction_repository.py        # Transaction queries, filters, pagination, CRUD persistence
│  │  ├─ budget_repository.py             # Budget queries and monthly spent aggregation
│  │  ├─ goal_repository.py               # Goal queries and persistence
│  │  └─ smart_input_repository.py        # Smart-input draft retrieval and persistence
│  ├─ schemas/                            # Pydantic request/response schemas
│  │  ├─ __init__.py                      # Exports main schema classes
│  │  ├─ common.py                        # Small shared response schemas
│  │  ├─ category.py                      # Category response schemas
│  │  ├─ transaction.py                   # Transaction create/update/list/detail schemas
│  │  ├─ budget.py                        # Budget create/update/list schemas
│  │  ├─ goal.py                          # Goal create/update/top-up/list schemas
│  │  ├─ dashboard.py                     # Dashboard summary response schemas
│  │  ├─ calendar.py                      # Calendar month/day response schemas
│  │  ├─ reports.py                       # Reports overview response schemas
│  │  └─ smart_input.py                   # Smart-input draft/update/confirm schemas
│  ├─ services/                           # Business logic layer
│  │  ├─ __init__.py                      # Exports service classes
│  │  ├─ category_service.py              # Category-related filtering logic
│  │  ├─ transaction_service.py           # Transaction validation and CRUD logic
│  │  ├─ budget_service.py                # Budget rules + computes spent from transactions
│  │  ├─ goal_service.py                  # Goal logic, progress, completion, top-up handling
│  │  ├─ dashboard_service.py             # Aggregates transactions/budgets/goals for dashboard
│  │  ├─ calendar_service.py              # Aggregates month/day calendar finance data
│  │  ├─ reports_service.py               # Builds expense breakdown, trends, and cash flow
│  │  └─ smart_input_service.py           # Creates voice/OCR drafts and confirms them into transactions
│  ├─ utils/                              # Reusable helper functions
│  │  ├─ __init__.py                      # Exports utility helpers
│  │  ├─ dates.py                         # Parse YYYY-MM, format month, get month ranges
│  │  ├─ demo_user.py                     # Demo-user helper while auth is not implemented
│  │  ├─ money.py                         # Money formatting helper
│  │  └─ pagination.py                    # Pagination math helper
│  ├─ sql/                                # Raw SQL files for schema and seed data
│  │  ├─ 001_init_schema.sql              # Creates enums, tables, constraints, indexes, triggers
│  │  └─ 002_seed_categories.sql          # Seeds default system categories
│  ├─ .env                                # Local backend environment variables
│  ├─ .env.example                        # Example environment file template
│  ├─ .gitignore                          # Ignore venv, cache, and local secret files
│  ├─ requirements.txt                    # Python dependencies for backend
│  ├─ main.py                             # FastAPI application entry point
│  ├─ test_models_import.py               # Quick script to verify models import and metadata load correctly
│  └─ test_db_connection.py               # Quick script to verify PostgreSQL connection
├─ docker-compose.yml                     # Local PostgreSQL container orchestration
└─ README.md                              # Project documentation
```

---

## 3) Tech Stack (Current Codebase)

### Frontend
- React 18
- Vite
- React Router
- Tailwind CSS
- Recharts
- Radix UI primitives + custom UI components

### Backend
- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Docker Compose (for local database)
- Pydantic / Pydantic Settings

---

## 4) Run the Project

### Prerequisites
- Node.js 18+ (recommended)
- npm
- Python 3.12+
- Docker + Docker Compose
- PostgreSQL client tool optional (for example: TablePlus)

### Install dependencies

#### Frontend
From repo root:
```bash
npm --prefix frontend i
```

#### Backend
From repo root:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Run database (Docker)
From repo root:
```bash
docker compose up -d
```

### Run frontend (dev)
From repo root:
```bash
npm run dev:frontend
```

### Run backend (dev)
From `backend/`:
```bash
source .venv/bin/activate
uvicorn main:app --reload
```

### Backend URLs
Base URL:
```text
http://127.0.0.1:8000
```

Swagger docs:
```text
http://127.0.0.1:8000/docs
```

Health checks:
```text
GET http://127.0.0.1:8000/api/v1/health
GET http://127.0.0.1:8000/api/v1/health/db
```

---

## 5) Product Features in Current UI

- **Dashboard**: overview of balance, spending calendar, quick finance summary
- **Transactions**: add/edit/delete transactions, category and type filtering
- **Budget**: category budget tracking with progress and warnings
- **Goals**: savings goals and progress contributions
- **Reports**: category structure, trends, and cashflow charts
- **AI Advisor**: conversational advisory UX with quick prompts and history-style drawer
- **Smart Input**: entry flow for manual/voice/OCR-oriented interaction design

---

## 6) Backend Module Responsibilities

### API Modules
- **health**: verify app and database are alive
- **categories**: provide category lists for filters, dropdowns, and smart input suggestions
- **transactions**: handle transaction CRUD
- **budgets**: manage category budgets by month
- **goals**: manage savings goals and goal top-ups
- **dashboard**: aggregate summary data for the home screen
- **calendar**: provide daily/monthly transaction summaries
- **reports**: generate analytics and trend datasets
- **smart_input**: handle draft creation from voice/OCR and confirm draft into real transaction

### Core Modules
- **config**: centralize environment-based configuration
- **enums**: define shared enum values across models, services, and schemas
- **exceptions**: standardize reusable HTTP errors
- **security**: placeholder for future real authentication

### Database Modules
- **base**: register all models with SQLAlchemy metadata
- **session**: create DB engine and session lifecycle
- **init_db**: run simple init logic for development

### Models
- **user**: owner of application data
- **category**: income/expense category master data
- **transaction**: raw finance records
- **budget**: monthly budget targets
- **goal**: savings goal records
- **smart_input_draft**: temporary parsed input before user confirmation

### Repositories
- Encapsulate SQLAlchemy queries and persistence logic for each domain.

### Services
- Encapsulate business rules and orchestration across repositories.

### Schemas
- Define FastAPI input/output contracts through Pydantic models.

### Utils
- Reusable helpers for date parsing, demo user creation, money formatting, and pagination.

### SQL
- Raw SQL scripts for initializing and seeding PostgreSQL.

---

## 7) Alignment with POC Document

This implementation is the **POC UI-first stage** for the FAINANCE concept in the submission document.

- It validates the UX and feature surface for the core modules.
- It adds a practical tracker backend to replace mock data with real APIs.
- It prepares the product structure for the planned AI/data architecture.
- It keeps advanced AI and market integrations intentionally postponed while core finance tracking matures.

---

## 8) Current Backend Scope

The backend currently focuses on the **tracker module**:
- Categories
- Transactions
- Budgets
- Goals
- Dashboard summary
- Calendar
- Reports
- Smart input draft flow

The following POC components are still planned and not fully implemented:
- Production AI advisor service
- RAG pipeline and vector retrieval
- OCR/ASR production inference
- Market data ingestion
- Full authentication and multi-user account system

---

## 9) Next Development Milestones

1. Replace demo-user flow with real authentication
2. Add Alembic migrations for schema versioning
3. Add backend test coverage for key tracker modules
4. Integrate OCR + ASR processing services
5. Add RAG-based advisor services with structured knowledge sources
6. Integrate market data APIs (gold/FX/interest rates)
7. Add deployment pipeline and production configuration

---

## 10) Notes

- Project name appears as `fainance` in some metadata and legacy naming, but the product concept is **FAINANCE**.
- Current backend is intentionally focused on the finance tracker layer first.
- Advanced AI capabilities are planned after the tracker flow is stable end-to-end.