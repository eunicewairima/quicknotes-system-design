# QuickNotes REST API

This document describes the production API for QuickNotes. It is separate from the browser exercise, which uses JSONPlaceholder as a practice service.

## Conventions

- Base URL: `https://api.quicknotes.example/v1`
- JSON request and response bodies use UTF-8 and `application/json`.
- Authenticated requests use `Authorization: Bearer <access-token>`.
- Note and tag IDs are UUIDs. Timestamps are ISO 8601 UTC.
- The API returns consistent error objects and never exposes internal exception details.

## Endpoints

| Method | Path | Description | Success status |
|---|---|---|---:|
| POST | `/auth/register` | Create a user account. | 201 Created |
| POST | `/auth/login` | Authenticate and issue access and refresh tokens. | 200 OK |
| GET | `/notes` | List the authenticated user's notes; supports `limit`, `cursor`, `q` and `tag`. | 200 OK |
| POST | `/notes` | Create a note and optionally associate existing tags. | 201 Created |
| GET | `/notes/{noteId}` | Retrieve one note owned by the authenticated user. | 200 OK |
| PATCH | `/notes/{noteId}` | Update one or more fields on a note. | 200 OK |
| DELETE | `/notes/{noteId}` | Delete a note and its tag associations. | 204 No Content |
| GET | `/tags` | List the authenticated user's tags. | 200 OK |

## Create a note

`POST /v1/notes` requires authentication. `title` is required and limited to 100 characters; `body` and `tagIds` are optional.

Request:

```json
{
  "title": "Project outline",
  "body": "Capture the first release milestones.",
  "tagIds": ["9c6f32cb-e06b-4811-9f3c-28afca5d9901"]
}
```

Response (`201 Created`):

```json
{
  "data": {
    "id": "61bf2e24-9e0c-4d86-b856-4b8d80f7a61e",
    "title": "Project outline",
    "body": "Capture the first release milestones.",
    "createdAt": "2026-10-18T15:30:00Z",
    "updatedAt": "2026-10-18T15:30:00Z",
    "tags": [
      {
        "id": "9c6f32cb-e06b-4811-9f3c-28afca5d9901",
        "name": "work"
      }
    ]
  }
}
```

## List notes

`GET /v1/notes?limit=2` returns notes in reverse chronological order. The opaque `nextCursor` is `null` when there are no more results.

Response (`200 OK`):

```json
{
  "data": [
    {
      "id": "61bf2e24-9e0c-4d86-b856-4b8d80f7a61e",
      "title": "Project outline",
      "body": "Capture the first release milestones.",
      "createdAt": "2026-10-18T15:30:00Z",
      "updatedAt": "2026-10-18T15:30:00Z",
      "tags": []
    },
    {
      "id": "a4b7190f-0c09-4e04-a80f-85420415d40c",
      "title": "Reading list",
      "body": "Add the database book.",
      "createdAt": "2026-10-17T12:10:00Z",
      "updatedAt": "2026-10-17T12:10:00Z",
      "tags": []
    }
  ],
  "page": {
    "limit": 2,
    "nextCursor": null
  }
}
```

## Error responses

All errors use this structure; `requestId` is included to help support trace a request.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required and must be 100 characters or fewer.",
    "requestId": "req_01JAA0Q7X40YK5D5CVW7NE3RXV"
  }
}
```

| Status | Meaning | Example code |
|---:|---|---|
| 400 Bad Request | Malformed JSON or invalid query parameter. | `BAD_REQUEST` |
| 401 Unauthorized | Missing, invalid or expired credentials. | `UNAUTHENTICATED` |
| 403 Forbidden | Authenticated user lacks permission for the resource. | `FORBIDDEN` |
| 404 Not Found | Requested note or tag does not exist or is not visible to this user. | `NOT_FOUND` |
| 409 Conflict | Resource conflicts with a uniqueness or state constraint. | `CONFLICT` |
| 422 Unprocessable Entity | Well-formed input fails field validation. | `VALIDATION_ERROR` |
| 429 Too Many Requests | Client exceeded a rate limit; response includes `Retry-After`. | `RATE_LIMITED` |
| 500 Internal Server Error | Unexpected server failure. | `INTERNAL_ERROR` |

The API should distinguish client-correctable errors from server failures, validate ownership on every resource operation, and avoid returning another user's records.
