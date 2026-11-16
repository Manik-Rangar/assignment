# Session Booking API

REST API for a platform where users book sessions with teachers. Teachers create available sessions, users book them, and completed sessions appear in the user's history.

**Stack:** Node.js · TypeScript · Express.js · MongoDB · Mongoose · Zod (validation) · Swagger (OpenAPI 3)

---

## Getting started

### Prerequisites
- Node.js **18+**
- MongoDB **5+** (local or Atlas)

### Setup

```bash
git clone <repo-url>
cd session-booking-api
npm install
cp .env.example .env      # then edit values if needed
```

### Environment variables

| Variable    | Description                 | Default / example                              |
|-------------|-----------------------------|------------------------------------------------|
| `PORT`      | HTTP port                   | `3000`                                         |
| `MONGO_URI` | MongoDB connection string   | `mongodb://127.0.0.1:27017/session-booking`    |
| `NODE_ENV`  | `development` / `production`| `development` (stack traces hidden in production) |

### Run

```bash
npm run dev     # development with auto-reload
npm run build   # compile TypeScript to dist/
npm start       # run compiled build
```

- API: `http://localhost:3000`
- **Swagger UI:** `http://localhost:3000/api-docs`
- OpenAPI JSON: `http://localhost:3000/api-docs.json`
- Health check: `GET /health`

---

## API overview

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 1 | POST  | `/users` | Create user (email unique) |
| – | POST  | `/teachers` | Create teacher (helper so sessions can be created) |
| 2 | POST  | `/sessions` | Create session for a teacher (default `AVAILABLE`) |
| 3 | GET   | `/sessions/available?dateTimestamp={ms}` | AVAILABLE sessions on that date — **aggregation pipeline** |
| 4 | POST  | `/sessions/:id/book` | Book a session. Body: `{ "userId": "..." }` |
| 5 | PATCH | `/sessions/:id/complete` | Mark a BOOKED session as COMPLETED |
| 6 | GET   | `/users/:id/sessions` | User sessions split into upcoming / completed — **aggregation pipeline** |

Full request/response schemas are in Swagger UI.

### Behaviour notes
- **Dates:** `startTime` / `endTime` accept ISO 8601 strings or millisecond timestamps. `dateTimestamp` is a Unix timestamp in **milliseconds**; the API returns sessions whose `startTime` falls in the **UTC calendar day** containing it.
- **Booking is atomic:** a conditional `findOneAndUpdate({ status: 'AVAILABLE' })` means two concurrent requests can't double-book a session.
- **Upcoming sessions** = the user's `BOOKED` sessions (sorted by `startTime` asc); **completed sessions** = `COMPLETED` ones (sorted by `completedAt` desc). Both include the teacher's details via `$lookup`, split with `$facet`.

### Status codes

| Code | When |
|------|------|
| 200 | Successful read / update |
| 201 | Resource created |
| 400 | Validation error, invalid ObjectId, malformed JSON, `endTime <= startTime` |
| 404 | User / teacher / session / route not found |
| 409 | Duplicate email; session not in the required state (already booked, not booked, etc.) |
| 500 | Unexpected server error |

Error response shape:
```json
{ "success": false, "message": "Validation failed", "details": [{ "field": "email", "message": "Invalid email" }] }
```

---

## Postman

Import `postman/Session-Booking-API.postman_collection.json`. Set the `baseUrl` collection variable if you're not on `http://localhost:3000`. Requests save `userId`, `teacherId` and `sessionId` automatically, so the collection can be run top-to-bottom with the Collection Runner (use a fresh database, since the sample emails must be unique).

CLI alternative:
```bash
npx newman run postman/Session-Booking-API.postman_collection.json
```

---

## Project structure

```
src/
├── config/        # env loading & DB connection
├── controllers/   # HTTP layer: read request, send response
├── docs/          # OpenAPI/Swagger spec
├── middlewares/   # validation & centralized error handling
├── models/        # Mongoose schemas (User, Teacher, Session)
├── routes/        # Express routers
├── services/      # business logic & aggregation pipelines
├── utils/         # ApiError, asyncHandler
├── validators/    # Zod request schemas
├── app.ts         # Express app
└── server.ts      # bootstrap (DB connect, listen, graceful shutdown)
```
