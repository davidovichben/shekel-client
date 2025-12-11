# API Changes Required for Client-Side PDF Receipt Generation

## Overview
The client now generates PDF receipts on the frontend and uploads them to the API. The API needs to be updated to accept PDF file uploads when processing charges.

## Changes to POST `/api/billing/charge`

### Current Behavior
- Accepts JSON with `createReceipt: boolean`
- Server generates PDF if `createReceipt` is true

### New Behavior
- Accepts **multipart/form-data** when PDF is provided
- Accepts **application/json** when PDF is not provided (backward compatible)

### Request Format (when PDF is provided)

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `credit_card_id` (number, required)
- `amount` (number, required)
- `description` (string, optional)
- `type` (string, optional) - Receipt type: vows, community_donations, external_donations, ascensions, online_donations, membership_fees, other
- `receipt_pdf` (file, required when PDF is provided) - PDF file blob

**Example:**
```
POST /api/billing/charge
Content-Type: multipart/form-data

credit_card_id: 1
amount: 150.50
description: Monthly membership fee
type: membership_fees
receipt_pdf: [PDF file blob]
```

### Request Format (when PDF is NOT provided - backward compatible)

**Content-Type:** `application/json`

```json
{
  "credit_card_id": 1,
  "amount": 150.50,
  "description": "Monthly membership fee",
  "type": "membership_fees"
}
```

### Response Format

**Success Response (200 OK):**
```json
{
  "success": true,
  "transaction": {
    "id": "TXN_abc123xyz4567890",
    "amount": "150.50",
    "credit_card_id": 1,
    "last_digits": "1234",
    "description": "Monthly membership fee",
    "status": "completed"
  },
  "receipt": {
    "id": 1,
    "receipt_number": "TXN_abc123xyz4567890",
    "total_amount": "150.50",
    "status": "paid",
    "type": "membership_fees",
    "pdf_file": "receipts/receipt_1_1234567890.pdf"
  }
}
```

### Implementation Notes

1. **File Upload Handling:**
   - When `receipt_pdf` file is provided, save it to `storage/app/public/receipts/`
   - Filename format: `receipt_{receipt_id}_{timestamp}.pdf`
   - Create receipt record with the PDF file path

2. **Error Handling:**
   - If PDF upload fails, still create the receipt but set `pdf_file` to `null`
   - Return appropriate error messages for file upload failures

3. **Receipt Creation:**
   - Receipt should be linked to the transaction
   - Receipt ID must be returned in the response
   - Receipt status should be set to "paid"

4. **Backward Compatibility:**
   - Continue to support JSON requests without PDF
   - If `createReceipt: true` is sent in JSON (old format), you can either:
     - Ignore it (client now sends PDF directly)
     - Or generate PDF server-side as before (if you want to keep that option)

## GET `/api/receipts/{id}/pdf`

**No changes needed** - This endpoint should already work for downloading receipts.

**Expected Behavior:**
- Returns PDF file with `Content-Type: application/pdf`
- Returns 404 if PDF file doesn't exist
- Returns 404 if receipt doesn't exist

## Summary

The main change is that the API needs to:
1. Detect if the request is `multipart/form-data` or `application/json`
2. If multipart, extract the `receipt_pdf` file and save it
3. Create the receipt record with the PDF file path
4. Return the receipt ID in the response

The client will:
- Generate PDF on the frontend
- Upload it as part of the charge request
- Only show download button if receipt was created successfully

