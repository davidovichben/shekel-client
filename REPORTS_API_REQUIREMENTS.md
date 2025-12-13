# Reports Feature - API Requirements

## Overview
This document specifies the API endpoints and data structures required for the Reports feature to function properly.

---

## 1. Get Report Categories and Types

### Endpoint
`GET /api/reports/categories`

### Response Structure
```typescript
{
  categories: Array<{
    id: string;
    label: string;
    reports: Array<{
      id: string;
      label: string;
      category: string;
    }>;
  }>;
}
```

### Notes
- Returns all available report categories and their associated report types
- Used to populate the right column menu

---

## 2. Get Report Configuration Options

### Endpoint
`GET /api/reports/{reportTypeId}/config`

### Path Parameters
- `reportTypeId` (string) - The ID of the selected report type

### Response Structure
```typescript
{
  reportName: string;
  columns: Array<{
    id: string;
    label: string;
    required: boolean;  // If true, column cannot be removed (shows lock icon)
  }>;
  sortOptions: Array<{
    value: string;
    label: string;
  }>;
  filters: Array<{
    key: string;
    label: string;
    options: Array<{
      value: string;
      label: string;
    }>;
  }>;
  supportsDateRange: boolean;
  supportsResultLimit: boolean;
}
```

### Notes
- Returns configuration options specific to the selected report type
- `columns` array contains all available columns for this report type
- `required: true` columns must always be included in the report
- `filters` array contains filter definitions with their available options

---

## 3. Generate Report

### Endpoint
`POST /api/reports/{reportTypeId}/generate`

### Path Parameters
- `reportTypeId` (string) - The ID of the selected report type

### Request Body
```typescript
{
  dateFrom: string | null;  // ISO date string (YYYY-MM-DD) or null
  dateTo: string | null;    // ISO date string (YYYY-MM-DD) or null
  sortBy: string;            // Sort field identifier
  sortOrder: 'asc' | 'desc';
  filters: Record<string, string>;  // Key-value pairs for filter values
  resultLimit: string;      // 'unlimited' or number as string ('10', '25', '50', '100')
  columns: string[];        // Array of column IDs in the desired order
}
```

### Response
- **Content-Type:** `application/pdf`
- **Body:** PDF file binary data

### Notes
- Generates a PDF report based on the provided configuration
- `columns` array order determines the column order in the generated report
- Only columns included in `columns` array should appear in the report

---

## 4. Export to Hashavshevet

### Endpoint
`POST /api/reports/{reportTypeId}/export/hashavshevet`

### Path Parameters
- `reportTypeId` (string) - The ID of the selected report type

### Request Body
```typescript
{
  dateFrom: string | null;  // ISO date string (YYYY-MM-DD) or null
  dateTo: string | null;    // ISO date string (YYYY-MM-DD) or null
  sortBy: string;            // Sort field identifier
  sortOrder: 'asc' | 'desc';
  filters: Record<string, string>;  // Key-value pairs for filter values
  resultLimit: string;      // 'unlimited' or number as string ('10', '25', '50', '100')
  columns: string[];        // Array of column IDs in the desired order
}
```

### Response
- **Content-Type:** `application/octet-stream` or appropriate file type
- **Body:** Export file binary data (format determined by Hashavshevet requirements)

### Notes
- Exports report data in a format compatible with Hashavshevet accounting software
- Uses the same configuration structure as report generation

---

## Data Type Definitions

### Report Categories
- **id:** Unique identifier for the category (e.g., 'income', 'expenses', 'debts')
- **label:** Display name in Hebrew (e.g., 'דוחות הכנסות')
- **reports:** Array of report types belonging to this category

### Report Types
- **id:** Unique identifier for the report type (e.g., 'income_monthly', 'debts_open')
- **label:** Display name in Hebrew (e.g., 'דוח הכנסות חודשיות')
- **category:** Category ID this report belongs to

### Columns
- **id:** Unique identifier for the column (e.g., 'amount', 'hebrew_date', 'payer_name')
- **label:** Display name in Hebrew (e.g., 'סכום', 'תאריך עברי')
- **required:** Boolean indicating if column is mandatory (cannot be removed from report)

### Filters
- **key:** Filter identifier (e.g., 'income_type', 'payer_type')
- **label:** Display name in Hebrew (e.g., 'סוג הכנסה')
- **options:** Array of selectable filter values with their labels

---

## Expected Report Types

Based on the UI, the following report types should be available:

### Income Reports (דוחות הכנסות)
- `income_monthly` - דוח הכנסות חודשיות

### Expense Reports (דוחות הוצאות)
- `expenses_monthly` - דוח הוצאות חודשיות
- `expenses_high` - דוח הוצאות גבוהות (מעל 1000₪)

### Donation Reports (דוחות תרומות לפי תקופה / סוג תרומה)
- `donations_community` - תרומות מהקהילה
- `donations_external` - תרומות מחוץ לקהילה

### Debt and Collection Reports (דוחות חובות וגבייה)
- `debts_open` - דוח חובות פתוחים
- `debts_by_type` - דוח חובות לפי סוג חוב
- `debts_by_debtor` - דוח חובות לפי חייב

### Community Management Reports (דוחות מתפללים וניהול קהילה)
- `members_active` - דוח חברים פעילים
- `members_recent` - דוח חברים שהצטרפו בשלושת החודשים האחרונים
- `members_no_donation` - דוח מתפללים שלא תרמו בשלושת החודשים האחרונים
- `members_no_auto_payment` - דוח חברי קהילה ללא תשלום אוטומטי

---

## Error Handling

All endpoints should return appropriate HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Report type not found
- `500` - Server error

Error response format:
```typescript
{
  error: string;
  message: string;
  details?: any;
}
```

---

## Notes

1. All dates should be in ISO format (YYYY-MM-DD) or null
2. All text labels should be in Hebrew
3. Column IDs in the `columns` array should match the IDs returned in the config endpoint
4. The order of columns in the `columns` array determines their order in the generated report
5. Required columns (with `required: true`) must always be included in the `columns` array when generating reports
6. Filter values should match the option values provided in the config endpoint

