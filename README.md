# Auth Accessibility Library

Acessibility-focused authentication demo with an ASL passphrases.

This project includes:

- `app`: Rust + Actix backend (enrollment/login APIs)
- `frontend`: React UI for signup/login sequence selection
- `mongodb`: credential and lexicon storage

## Core ASL Flow

- Signup: user selects exactly 5 ASL items in order.
- Login: user replays the same 5-item sequence in the exact same order.

## Tech Stack

- Rust + Actix Web
- MongoDB
- React + TypeScript (Create React App)
- Docker Compose

## Run With Docker

From repository root:

```bash
docker compose up -d
```

Endpoints:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- MongoDB: `mongodb://localhost:27020`

Stop services:

```bash
docker compose down
```

## Environment Variables

The backend loads values from `.env` (mounted into `/app/.env` in Docker). See base.env for a base env file.

Minimum required variable:

- `WEBAPP_SESSION_SECRET_KEY` (must be at least 32 characters)

Common variables:

- `WEBAPP_HOST` (default `0.0.0.0`)
- `WEBAPP_PORT` (default `8080`)
- `WEBAPP_MONGO_URL`
- `WEBAPP_MONGO_DATABASE`
- `WEBAPP_ASL_REQUIRED_SELECTION_SIZE` (default `5`)

In Docker Compose, backend Mongo URL is set to `mongodb://mongodb:27017` for container-to-container networking.

## API Endpoints

- `POST /api/auth/asl/enroll/start`
- `POST /api/auth/asl/enroll/finish`
- `POST /api/auth/asl/login/start`
- `POST /api/auth/asl/login/verify`

## Frontend Notes

- The frontend uses a dev-server proxy for `/api` requests.
- Sequence order is shown in the UI (`Step 1`, `Step 2`, etc.) to reduce login mismatch errors.
- If login fails, verify both:
   - User ID matches the enrolled user.
   - Item order matches signup exactly.

## Local Development (Without Docker)

Backend:

```bash
cargo run -- --env-file .env
```

Frontend:

```bash
cd frontend
npm install
npm start
```
