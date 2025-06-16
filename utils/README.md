
# 🧰 utils/
````markdown
This folder contains general-purpose utility classes used across the backend application for standardized error handling and API responses.

---

## 📄 Files

### `ApiError.js`

A custom error class used to throw structured HTTP errors within controller and service logic.

#### Features:

- Extends the native `Error` class
- Includes a `status` property for use in API responses

```js
throw new ApiError("Invalid input", 400);
````

---

### `ApiResponse.js`

Centralized helper for formatting consistent JSON responses from your backend.

#### Methods:

| Method              | Description                                               |
| ------------------- | --------------------------------------------------------- |
| `success(data)`     | Returns `{ status: 'ok', data, error: null }`             |
| `error(msg, code)`  | Returns `{ status: 'error', data: null, error: {…} }`     |
| `messageResponse()` | Shortcut to send `{ message }` under a success wrapper    |
| `stateResponse()`   | Shortcut to wrap a full `state` object                    |
| `successResponse()` | Wraps common chess state attributes into a success object |

#### Example:

```js
res.json(ApiResponse.success({ gameId: 'abc123' }));
res.status(403).json(ApiResponse.error("Unauthorized", 403));
```

---

## 🧠 Design Notes

* All utilities in this folder are **framework-agnostic** — they don’t rely on Express, only plain JS.
* These abstractions keep controller logic clean and consistent.
* More utilities (e.g., `Logger`, `DateUtils`, etc.) can be added here as your project grows.

---

