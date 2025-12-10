# Vow Set API Documentation

## Overview
API endpoints required for managing vow sets (סט נדרים) - collections of vows that can be created together.

---

## Base URL
```
http://localhost:8000/api/vow-sets
```

---

## Endpoints

### 1. Create Vow Set (POST)
**Endpoint:** `POST /api/vow-sets`

**Description:** Create a new vow set with multiple vows.

**Request Body:**
```json
{
  "description": "נדר שבת שובה",
  "gregorianDate": "15/08/2025",
  "hebrewDate": "כ"א באב תשפ\"ה",
  "vows": [
    {
      "memberId": "123",
      "aliyahType": "rishona",
      "amount": 540,
      "sendReminder": true
    },
    {
      "memberId": "456",
      "aliyahType": "shniya",
      "amount": 320,
      "sendReminder": true
    }
  ]
}
```

**Fields:**
- `description` (optional) - Overall description for the vow set
- `gregorianDate` (required) - Date in DD/MM/YYYY format
- `hebrewDate` (optional) - Hebrew date string
- `vows` (required, array) - Array of vow objects:
  - `memberId` (required) - ID of the member who owes the vow
  - `aliyahType` (optional) - Type of aliyah:
    - `"rishona"` - ראשונה
    - `"shniya"` - שנייה
    - `"shlishit"` - שלישית
    - `"reviit"` - רביעית
    - `"chamishit"` - חמישית
    - `"shishit"` - שישית
    - `"shviit"` - שביעית
    - `"maftir"` - מפטיר
    - `"hagbaha"` - הגבהה
    - `"glila"` - גלילה
    - `"petichta"` - פתיחה
    - `"other"` - אחר
  - `amount` (required) - Amount of the vow (numeric)
  - `sendReminder` (optional, default: false) - If `true`, sends reminder immediately upon creation

**Response:** 201 Created
```json
{
  "id": "1",
  "description": "נדר שבת שובה",
  "gregorianDate": "2025-08-15",
  "hebrewDate": "כ\"א באב תשפ\"ה",
  "vows": [
    {
      "id": "1",
      "memberId": "123",
      "memberName": "משה המנשה",
      "aliyahType": "rishona",
      "amount": "540.00",
      "sendReminder": true,
      "debtId": "101"
    }
  ],
  "createdAt": "2025-01-15T10:00:00.000000Z",
  "updatedAt": "2025-01-15T10:00:00.000000Z"
}
```

**Notes:**
- Each vow in the set should create a corresponding debt record
- If `sendReminder: true`, the debt's `lastReminderSentAt` should be set immediately
- The response should include the created debt IDs in each vow object

---

### 2. List All Vow Sets (GET)
**Endpoint:** `GET /api/vow-sets`

**Query Parameters:**
- `limit` - Items per page (default: 15)
- `page` - Page number (default: 1)
- `sort` - Sort column (e.g., `gregorianDate`, `-gregorianDate` for descending)

**Response:** 200 OK
```json
{
  "rows": [
    {
      "id": "1",
      "description": "נדר שבת שובה",
      "gregorianDate": "2025-08-15",
      "hebrewDate": "כ\"א באב תשפ\"ה",
      "vowsCount": 5,
      "totalAmount": "2870.00",
      "createdAt": "2025-01-15T10:00:00.000000Z"
    }
  ],
  "totalRows": 10,
  "currentPage": 1,
  "totalPages": 1
}
```

---

### 3. Get Single Vow Set (GET)
**Endpoint:** `GET /api/vow-sets/{id}`

**Response:** 200 OK
```json
{
  "id": "1",
  "description": "נדר שבת שובה",
  "gregorianDate": "2025-08-15",
  "hebrewDate": "כ\"א באב תשפ\"ה",
  "vows": [
    {
      "id": "1",
      "memberId": "123",
      "memberName": "משה המנשה",
      "aliyahType": "rishona",
      "amount": "540.00",
      "sendReminder": true,
      "debtId": "101",
      "debtStatus": "pending"
    }
  ],
  "createdAt": "2025-01-15T10:00:00.000000Z",
  "updatedAt": "2025-01-15T10:00:00.000000Z"
}
```

---

### 4. Update Vow Set (PUT/PATCH)
**Endpoint:** `PUT /api/vow-sets/{id}` or `PATCH /api/vow-sets/{id}`

**Request Body:** Same as Create, all fields optional

**Response:** 200 OK (same structure as Get Single)

**Notes:**
- Updating vows should update corresponding debt records
- Removing vows should handle debt records appropriately (mark as cancelled or delete)

---

### 5. Delete Vow Set (DELETE)
**Endpoint:** `DELETE /api/vow-sets/{id}`

**Response:** 204 No Content

**Notes:**
- Should handle associated debt records (mark as cancelled or delete based on business logic)

---

## Date Formats

### Input Format
- `DD/MM/YYYY` - e.g., "15/08/2025"

### Output Format
- ISO 8601: `"2025-08-15"`

---

## Aliyah Types Reference

| Code | Hebrew Name |
|------|-------------|
| `rishona` | ראשונה |
| `shniya` | שנייה |
| `shlishit` | שלישית |
| `reviit` | רביעית |
| `chamishit` | חמישית |
| `shishit` | שישית |
| `shviit` | שביעית |
| `maftir` | מפטיר |
| `hagbaha` | הגבהה |
| `glila` | גלילה |
| `petichta` | פתיחה |
| `other` | אחר |

---

## Common Use Cases

### Create vow set with reminders
```json
POST /api/vow-sets
{
  "description": "נדר שבת שובה",
  "gregorianDate": "15/08/2025",
  "vows": [
    {
      "memberId": "123",
      "aliyahType": "rishona",
      "amount": 540,
      "sendReminder": true
    }
  ]
}
```

### Create vow set without reminders
```json
POST /api/vow-sets
{
  "description": "נדר שבת שובה",
  "gregorianDate": "15/08/2025",
  "vows": [
    {
      "memberId": "123",
      "aliyahType": "rishona",
      "amount": 540,
      "sendReminder": false
    }
  ]
}
```

---

## Notes

- Each vow in a set creates a corresponding debt record
- Debt records should reference the vow set ID
- If `sendReminder: true`, set the debt's `lastReminderSentAt` immediately
- The `memberName` field in responses should be populated from the member data
- Debt status should default to "pending" for new vows
- All amounts should be stored and returned as strings with 2 decimal places

