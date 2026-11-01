# Auth Portal REST API

> Knowledge Test for Software Engineer – **PT Widya Informasi Nusantara**

A production-ready, clean-architecture RESTful API for user authentication and profile management built with Node.js, Express, raw PostgreSQL queries, and JWT authentication.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture & Design](#architecture--design)
- [Assumptions](#assumptions)
- [Design Decisions](#design-decisions)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started with Docker (Recommended)](#getting-started-with-docker-recommended)
- [Getting Started Locally (Without Docker)](#getting-started-locally-without-docker)
- [Running Tests](#running-tests)
- [API Documentation & Curl Examples](#api-documentation--curl-examples)
- [VPS Deployment Guide](#vps-deployment-guide)
- [Future Improvements](#future-improvements)

---

## Overview

This project provides core authentication capabilities adhering strictly to clean code, layered architectural boundaries, and enterprise security practices:

- **User Registration**: Register with `name`, `email`, `gender` (`male` | `female`), and `password`.
- **User Authentication**: Secure login verifying bcrypt password hashes, issuing stateless signed JWT access tokens.
- **Protected Profile**: JWT-guarded profile endpoint returning sanitized user information (never exposing password hashes).
- **Interactive Documentation**: Swagger UI documentation interactive at `/api/docs`.
- **High Test Coverage**: Unit tests with mocked dependencies and end-to-end integration tests using an isolated test database.

---

## Tech Stack

| Component | Technology | Rationale |
|---|---|---|
| **Runtime** | Node.js (v22 LTS) | Fast, non-blocking asynchronous I/O |
| **Framework** | Express 5 | Minimalist and mature HTTP web framework |
| **Database** | PostgreSQL 16 | ACID-compliant relational storage |
| **Database Driver** | `pg` (Raw SQL) | Zero ORM bloat, predictable query plans, explicit projection |
| **Database Migrations**| `node-pg-migrate` | Version-controlled, idempotent schema management |
| **Request Validation** | `zod` | Declarative, schema validation with strong typing |
| **Password Hashing** | `bcrypt` (10 rounds) | Adaptive, salted cryptographic hash function |
| **Token Management** | `jsonwebtoken` (HS256) | Stateless authentication standard |
| **Security Middleware**| `helmet`, `cors`, `express-rate-limit` | HTTP header protection, CORS policy, and brute-force mitigation |
| **Testing** | `jest`, `supertest` | Fast in-memory unit tests and integration tests |
| **API Docs** | Swagger UI (`yamljs`, OpenAPI 3.0) | Interactive, self-documenting API portal |
| **Containerization** | Docker, Docker Compose | Reproducible environments across local and production |
| **Reverse Proxy** | Nginx | Production reverse proxy, gzip compression, SSL termination |

---

## Architecture & Design

The application follows a strict **Layered Architecture**. Each layer encapsulates a distinct responsibility and communicates unidirectionally with the layer immediately beneath it:

```
HTTP Request
     │
     ▼
┌──────────────┐
│    Routes    │  -> Maps HTTP path and method to controller; mounts middleware
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Middlewares │  -> Authentication (JWT), request validation (Zod), error catching
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Controllers  │  -> HTTP layer only: parses request data, invokes service, formats response
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Services   │  -> Pure business logic: password hashing, duplicate checks, JWT signing
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Repositories │  -> SQL execution only: parameterized queries, row-to-entity mapping
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │  -> Relational persistence with ENUMs, unique constraints, and indexes
└──────────────┘
```

### Layer Responsibilities Matrix

| Layer | Responsibility | What It Must NOT Do |
|---|---|---|
| **Route** | Wire URL paths and HTTP verbs to middlewares and controllers | Execute business logic or query the database |
| **Middleware**| Validate input schemas, verify JWT tokens, catch & format errors | Direct database mutations |
| **Controller**| Parse `req.body` / `req.user`, invoke service, return HTTP status | Hash passwords, execute SQL, or contain business rules |
| **Service** | Orchestrate business operations, verify business invariants | Handle `req` or `res` objects or send HTTP status codes |
| **Repository** | Execute parameterized SQL, sanitize database rows into plain objects | Enforce business rules or handle authentication logic |

---

## Assumptions

1. **`password` Field**: The test prompt required registering `name`, `email`, and `gender`, followed by logging in. Since authentication requires a secret credential, a `password` field was introduced. It is validated for strength (minimum 8 characters with at least one letter and one number) and securely stored as an adaptive bcrypt hash.
2. **`email` as Identifier & Lowercase Normalization**: Email is treated as the primary user identity. All emails are trimmed and normalized to lowercase at validation time. Uniqueness is guaranteed both at the database constraint level (`UNIQUE`) and guarded against race conditions in the service layer (`SQLSTATE 23505`).
3. **`gender` Constraint**: Stored using a PostgreSQL native ENUM (`gender_enum`), restricted strictly to `'male'` or `'female'`.
4. **No Token on Registration**: Per the prompt requirement ("login after the account is created"), `POST /api/v1/auth/register` responds with `201 Created` and the created user profile without an authentication token. The client must explicitly call `POST /api/v1/auth/login`.
5. **Stateless Access Token**: Authentication uses a stateless JWT bearer token (HS256) with configurable expiration (default 1 hour).

---

## Design Decisions

- **Why Raw SQL over ORM (Prisma/TypeORM/Sequelize)**:
  - Zero ORM overhead and faster startup time.
  - Complete transparency: every query executed against PostgreSQL is visible and tunable.
  - Granular security: `findById` queries explicitly omit `password_hash` from the `SELECT` list, ensuring sensitive hashes never enter application memory unless explicitly querying for authentication credentials in `findByEmail`.
  - Immune to SQL injection via native parameterized queries (`$1`, `$2`).
- **Why Single Generic Login Error (`401 INVALID_CREDENTIALS`)**:
  - Distinguishing between "User not found" and "Incorrect password" enables user enumeration attacks. Both failure cases deliberately return the same generic message: `"Invalid email or password"`.
- **Decoupled Server and Application (`app.js` vs `server.js`)**:
  - `src/app.js` constructs the Express application without binding to a network port (`listen()`). This allows Supertest to run fast integration tests in memory without port conflicts, while `src/server.js` handles port binding and graceful process shutdown (`SIGTERM`, `SIGINT`).
- **Centralized Error Handling via `AppError`**:
  - All errors are typed with status code, machine-readable error code, and optional field-level validation details. A single global error handler normalizes responses to `{ success: false, error: { code, message, details } }`.

---

## Project Structure

```
.
├── deploy/
│   └── nginx.conf              # Production Nginx reverse proxy configuration
├── docker/
│   └── init-test-db.sql        # Database initialization for test database in Postgres container
├── docs/
│   └── openapi.yaml            # OpenAPI 3.0 specification for all endpoints
├── migrations/
│   └── 1730000000000_create-users-table.js # Database migration (up/down)
├── src/
│   ├── config/
│   │   ├── db.js               # PostgreSQL connection pool configuration
│   │   └── env.js              # Environment variable parsing and validation
│   ├── controllers/
│   │   ├── auth.controller.js  # Controller for register and login
│   │   └── user.controller.js  # Controller for user profile
│   ├── middlewares/
│   │   ├── authenticate.js     # JWT Bearer token authentication middleware
│   │   ├── errorHandler.js     # Centralized error handler
│   │   ├── notFound.js         # 404 handler
│   │   └── validate.js         # Generic Zod validation middleware
│   ├── repositories/
│   │   └── user.repository.js  # Parameterized SQL database queries
│   ├── routes/
│   │   ├── auth.routes.js      # Auth route definitions
│   │   ├── index.js            # API v1 router aggregator
│   │   └── user.routes.js      # User route definitions
│   ├── services/
│   │   ├── auth.service.js     # Authentication business logic
│   │   └── user.service.js     # User business logic
│   ├── utils/
│   │   ├── AppError.js         # Custom operational error class
│   │   ├── jwt.js              # Token signing and verification helpers
│   │   └── response.js         # Standard JSON response formatting helpers
│   ├── validators/
│   │   └── auth.validator.js   # Zod validation schemas
│   ├── app.js                  # Express app initialization & middleware wiring
│   └── server.js               # Server startup and graceful shutdown lifecycle
├── tests/
│   ├── helpers/
│   │   └── db.js               # Migration and database cleaning utilities for tests
│   ├── integration/
│   │   ├── auth.test.js        # Register and login API integration tests
│   │   ├── health.test.js      # Health check integration tests
│   │   └── user.test.js        # Protected profile integration tests
│   ├── unit/
│   │   ├── auth.service.test.js# Auth service unit tests (mocked repository)
│   │   └── user.service.test.js# User service unit tests (mocked repository)
│   └── setupEnv.js             # Test environment variable defaults
├── .dockerignore
├── .env.example
├── .gitignore
├── .prettierrc
├── docker-compose.yml          # Local containerized development stack
├── docker-compose.prod.yml     # Production overrides (internal DB ports, restart policies)
├── Dockerfile                  # Multi-stage Docker build (dependencies, test, runner)
├── eslint.config.js
├── jest.config.js
└── package.json
```

---

## Environment Variables

Copy `.env.example` to `.env` before running the project:

```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
|---|---|---|
| `NODE_ENV` | Application environment (`development`, `production`, `test`) | `development` |
| `PORT` | HTTP port the Express server listens on | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:postgres@localhost:5432/auth_portal` |
| `POSTGRES_USER` | PostgreSQL user for Docker Compose | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password for Docker Compose | `postgres` |
| `POSTGRES_DB` | PostgreSQL default database name | `auth_portal` |
| `POSTGRES_PORT` | PostgreSQL host exposed port | `5432` |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens (min 32 chars) | `change-me-to-a-long-random-string-at-least-32-chars` |
| `JWT_EXPIRES_IN` | Access token lifespan | `1h` |
| `BCRYPT_ROUNDS` | Salt rounds for hashing passwords | `10` |
| `CORS_ORIGIN` | Allowed CORS origins (`*` or comma-separated origins) | `*` |

---

## Getting Started with Docker (Recommended)

Running with Docker Compose starts both PostgreSQL and the API service in isolated containers with automatic health-checks and database migrations.

### 1. Configure Environment

```bash
cp .env.example .env
```

### 2. Start Services

```bash
docker compose up --build
```

The database container will initialize and execute automatic migrations. Once started:
- **API URL**: `http://localhost:3000`
- **Health Check**: `http://localhost:3000/health`
- **Swagger Documentation**: `http://localhost:3000/api/docs`

### 3. Stop Services

```bash
docker compose down
# Or to wipe the database volume:
docker compose down -v
```

---

## Getting Started Locally (Without Docker)

### Prerequisites

- Node.js 20+ LTS
- PostgreSQL 14+ installed and running locally

### 1. Install Dependencies

```bash
npm install
```

### 2. Prepare Database

Ensure your local PostgreSQL service is running and create the database:

```sql
CREATE DATABASE auth_portal;
CREATE DATABASE auth_portal_test;
```

### 3. Run Migrations

```bash
npm run migrate:up
```

### 4. Start the Application

```bash
# Development mode with hot-reload:
npm run dev

# Production mode:
npm start
```

---

## Running Tests

The test suite covers:
- **Unit Tests**: Business logic in isolation with mocked repositories.
- **Integration Tests**: Supertest HTTP requests with real database transactions, migration verification, and automatic table truncating between test cases.

### Run Tests via Docker (Zero local dependency)

```bash
npm run test:docker
# Alternatively:
docker compose --profile test run --rm test
```

### Run Tests Locally

```bash
# Run all test suites
npm test

# Run tests with code coverage analysis
npm run test:coverage
```

### Code Quality & Formatting

```bash
# Check code style with ESLint
npm run lint

# Format code with Prettier
npm run format
```

---

## API Documentation & Curl Examples

Interactive Swagger UI documentation is available at:
👉 **`http://localhost:3000/api/docs`**

Below are practical `curl` examples to test the full authentication flow:

### 1. Health Check

```bash
curl -i http://localhost:3000/health
```

**Response (`200 OK`)**:
```json
{"status":"ok"}
```

---

### 2. Register Account

```bash
curl -i -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Connor",
    "email": "sarah.connor@example.com",
    "gender": "female",
    "password": "Password123"
  }'
```

**Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "id": "e4b2d3c1-7f8a-4c2a-9e12-8d7b6a5c4e3f",
    "name": "Sarah Connor",
    "email": "sarah.connor@example.com",
    "gender": "female",
    "created_at": "2026-11-01T12:00:00.000Z"
  }
}
```

---

### 3. Login

```bash
curl -i -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah.connor@example.com",
    "password": "Password123"
  }'
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

---

### 4. Get User Profile (Protected Endpoint)

Replace `<YOUR_TOKEN>` with the token received from the login endpoint:

```bash
curl -i -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": "e4b2d3c1-7f8a-4c2a-9e12-8d7b6a5c4e3f",
    "name": "Sarah Connor",
    "email": "sarah.connor@example.com",
    "gender": "female",
    "created_at": "2026-11-01T12:00:00.000Z",
    "updated_at": "2026-11-01T12:00:00.000Z"
  }
}
```

---

### 5. Error Handling Examples

#### Validation Error (`400 Bad Request`):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "email",
        "message": "Invalid email address"
      }
    ]
  }
}
```

#### Duplicate Email (`409 Conflict`):
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_USED",
    "message": "Email is already registered"
  }
}
```

#### Invalid Credentials (`401 Unauthorized`):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

#### Unauthorized Token (`401 Unauthorized`):
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

---

## VPS Deployment Guide

To deploy this application to a remote VPS (e.g., Ubuntu 22.04 / 24.04):

### 1. Server Prerequisites & Hardening

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Configure basic firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Install Docker & Docker Compose plugin
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. Clone Repository & Configure Environment

```bash
git clone https://github.com/<your-username>/<repo-name>.git /opt/auth-portal
cd /opt/auth-portal

cp .env.example .env
# Edit .env with strong production credentials
nano .env
```

Generate a secure 64-character JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Start Production Containers

Run using production compose overrides (which keeps the database port private to the Docker internal network):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### 4. Configure Nginx Reverse Proxy

```bash
sudo apt install -y nginx

# Copy nginx config template
sudo cp deploy/nginx.conf /etc/nginx/sites-available/auth-portal.conf
sudo ln -s /etc/nginx/sites-available/auth-portal.conf /etc/nginx/sites-enabled/

# Remove default site and reload nginx
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Obtain Free SSL via Let's Encrypt (Certbot)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Certbot will automatically configure HTTPS certificates and set up automatic renewal cron jobs.

---

## Future Improvements

1. **Refresh Token Rotation**: Implement long-lived refresh tokens stored in HTTP-only cookies paired with Redis for token revocation and blacklisting.
2. **Rate Limiting**: Integrate distributed rate limiting (e.g., `rate-limiter-flexible` with Redis store) on `/auth/*` endpoints to defend against brute-force attacks across clustered instances.
3. **Email Verification**: Implement tokenized email verification links sent via SMTP upon registration.
4. **Password Reset Flow**: Implement time-limited password reset tokens and secure reset endpoints.

