# AAVAaz API Conventions & Specification

All AAVAaz backend services adhere to a standardized REST API specification versioned at `/api/v1`.

---

## 1. Response Envelope Format

All responses return standard JSON envelopes.

### Success Envelope
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": {
    "timestamp": "2026-09-26T13:20:00.000Z",
    "requestId": "req_c7b89e3a1f"
  }
}
```

For paginated collections:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Items retrieved successfully",
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 142,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false,
    "timestamp": "2026-09-26T13:20:00.000Z"
  }
}
```

### Error Envelope
```json
{
  "success": false,
  "statusCode": 400,
  "errorCode": "VALIDATION_FAILED",
  "message": "Request validation failed",
  "details": [
    {
      "field": "code",
      "issue": "Department code must be uppercase alphanumeric"
    }
  ],
  "meta": {
    "timestamp": "2026-09-26T13:20:00.000Z",
    "requestId": "req_c7b89e3a1f"
  }
}
```

---

## 2. Standard Error Codes

| Error Code | HTTP Status | Meaning |
|---|---|---|
| `VALIDATION_FAILED` | 400 Bad Request | Payload schema or parameters failed Zod validation |
| `UNAUTHORIZED` | 401 Unauthorized | Missing, invalid, or expired authentication token |
| `FORBIDDEN` | 403 Forbidden | Authenticated user lacks required permission or tenant scope |
| `NOT_FOUND` | 404 Not Found | Requested entity or route does not exist |
| `CONFLICT` | 409 Conflict | Unique constraint violation (e.g. duplicate email/code within tenant) |
| `TENANT_INACTIVE` | 403 Forbidden | Tenant institution is suspended or inactive |
| `INTERNAL_ERROR` | 500 Internal Server Error | Unhandled server error (details redacted in production) |

---

## 3. Headers and Context

- `Authorization`: `Bearer <token>` contains the authenticated identity token.
- `X-Institution-Id`: *(Optional requested context)* May be passed by clients who belong to multiple institutions to select the active operational context. The server **verifies** that the authenticated user is an authorized member of this institution before granting any access.
- `X-Request-Id`: Unique client- or gateway-supplied request correlation ID. If absent, the backend assigns one automatically.
