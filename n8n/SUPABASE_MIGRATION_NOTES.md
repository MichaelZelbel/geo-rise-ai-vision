# Supabase Node Configuration Guide

This document explains how to properly configure Supabase nodes in n8n workflows, based on working examples from the GEORISE repository.

## ✅ Properly Configured Examples

All configuration patterns below are verified working in:
- `Analysis Starter.json`
- `Fetch Engine Weights.json`
- `Analysis Processor Multi-Engine.json`
- `GEORISE_Scheduler - Supabase v2.json`

---

## 1. INSERT Operation (Create Row)

The default operation for Supabase node is INSERT.

### Configuration:
```json
{
  "parameters": {
    "tableId": "analysis_runs",
    "fieldsUi": {
      "fieldValues": [
        {
          "fieldId": "run_id",
          "fieldValue": "={{ $json.run_id }}"
        },
        {
          "fieldId": "status",
          "fieldValue": "pending"
        },
        {
          "fieldId": "created_at",
          "fieldValue": "={{ $now.toISO() }}"
        }
      ]
    }
  },
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 1,
  "alwaysOutputData": true,
  "retryOnFail": true,
  "maxTries": 2,
  "credentials": {
    "supabaseApi": {
      "id": "xSCCE5dL9poY7JFF",
      "name": "Supabase Lovable Georise"
    }
  },
  "continueOnFail": true,
  "onError": "continueErrorOutput"
}
```

### Key Points:
- **No `operation` parameter** - default is INSERT
- `tableId`: name of the table
- `fieldsUi.fieldValues`: array of objects with `fieldId` (column name) and `fieldValue` (value)
- Values can use expressions: `"={{ $json.field }}"`
- Static values are plain strings: `"pending"`

---

## 2. UPDATE Operation

### Configuration:
```json
{
  "parameters": {
    "operation": "update",
    "tableId": "analysis_runs",
    "filterType": "string",
    "filterString": "=run_id=eq.{{ $json.run_id }}",
    "fieldsUi": {
      "fieldValues": [
        {
          "fieldId": "status",
          "fieldValue": "completed"
        },
        {
          "fieldId": "updated_at",
          "fieldValue": "={{ $now.toISO() }}"
        }
      ]
    }
  },
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 1,
  "alwaysOutputData": true,
  "retryOnFail": true,
  "maxTries": 2,
  "credentials": {
    "supabaseApi": {
      "id": "xSCCE5dL9poY7JFF",
      "name": "Supabase Lovable Georise"
    }
  },
  "continueOnFail": true,
  "onError": "continueErrorOutput"
}
```

### Filter Format - IMPORTANT! ⚠️

The `filterString` uses PostgREST query syntax:

**Format:** `=column_name=operator.value`

**Examples:**
```
=id=eq.{{ $json.id }}                    // WHERE id = value
=status=eq.pending                       // WHERE status = 'pending'
=created_at=gt.{{ $json.timestamp }}     // WHERE created_at > value
=age=gte.18                              // WHERE age >= 18
=email=like.*@example.com                // WHERE email LIKE '%@example.com'
```

**Common Operators:**
- `eq` - equals
- `neq` - not equals
- `gt` - greater than
- `gte` - greater than or equal
- `lt` - less than
- `lte` - less than or equal
- `like` - pattern matching
- `is` - IS (for NULL checks)

### Alternative Filter Format (also works):

```json
{
  "operation": "update",
  "tableId": "analysis_runs",
  "filters": {
    "conditions": [
      {
        "keyName": "run_id",
        "condition": "eq",
        "keyValue": "=eq.{{ $json.run_id }}"
      }
    ]
  },
  "fieldsUi": { ... }
}
```

**Note:** The `keyValue` still needs the `=eq.` prefix!

---

## 3. SELECT Operation (GetAll)

### Configuration:
```json
{
  "parameters": {
    "operation": "getAll",
    "tableId": "monitoring_configs_due",
    "returnAll": true,
    "filterType": "string"
  },
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 1,
  "alwaysOutputData": true,
  "retryOnFail": true,
  "maxTries": 2,
  "credentials": {
    "supabaseApi": {
      "id": "xSCCE5dL9poY7JFF",
      "name": "Supabase Lovable Georise"
    }
  },
  "onError": "continueErrorOutput"
}
```

### With Filters:
```json
{
  "parameters": {
    "operation": "getAll",
    "tableId": "analysis_runs",
    "returnAll": true,
    "filterType": "string",
    "filterString": "=status=eq.pending&brand_id=eq.{{ $json.brand_id }}"
  }
}
```

### Key Points:
- `returnAll: true` - gets all matching rows (no pagination)
- `filterType: "string"` - enables filterString parameter
- Multiple filters joined with `&`: `filter1&filter2&filter3`
- Can query views (like `monitoring_configs_due`) the same way as tables

---

## 4. Retry & Error Handling

### Standard Configuration:
```json
{
  "alwaysOutputData": true,      // Output data even on error
  "retryOnFail": true,            // Retry on failure
  "maxTries": 2,                  // Total attempts (1 initial + 1 retry)
  "continueOnFail": true,         // Don't stop workflow on error
  "onError": "continueErrorOutput" // Pass error to error output path
}
```

### When to Use:
- **`alwaysOutputData: true`**: Always use for database operations
- **`retryOnFail: true`**: For INSERT/UPDATE operations (transient errors)
- **`maxTries: 2`**: Good default (1 retry)
- **`continueOnFail: true`**: When you have error handling nodes
- **`onError: "continueErrorOutput"`**: When node has error output path

---

## 5. Common Pitfalls & Solutions

### ❌ Wrong: Missing Filter Prefix
```json
"filterString": "run_id=eq.{{ $json.run_id }}"  // Missing leading =
```

### ✅ Correct:
```json
"filterString": "=run_id=eq.{{ $json.run_id }}"  // Has = prefix
```

---

### ❌ Wrong: Using PostgreSQL Operations
```json
{
  "operation": "executeQuery",  // Not supported in Supabase node!
  "query": "UPDATE ..."
}
```

### ✅ Correct:
```json
{
  "operation": "update",  // Use Supabase's built-in operations
  "tableId": "...",
  "filterString": "...",
  "fieldsUi": { ... }
}
```

---

### ❌ Wrong: Complex Queries as Supabase Node
```sql
SELECT mc.*, b.name, p.plan
FROM monitoring_configs mc
JOIN brands b ON b.id = mc.brand_id
JOIN profiles p ON p.id = mc.user_id
WHERE mc.active = true AND mc.next_run_at <= NOW()
```

### ✅ Correct: Use Database View + Simple GetAll
```sql
-- In database migration:
CREATE VIEW monitoring_configs_due AS
SELECT mc.*, b.name as brand_name, p.plan as user_plan
FROM monitoring_configs mc
JOIN brands b ON b.id = mc.brand_id
JOIN profiles p ON p.id = mc.user_id
WHERE mc.active = true AND mc.next_run_at <= NOW();
```

```json
// In n8n:
{
  "operation": "getAll",
  "tableId": "monitoring_configs_due",
  "returnAll": true
}
```

---

### ❌ Wrong: UPSERT with ON CONFLICT
Supabase node doesn't have built-in UPSERT support matching PostgreSQL's `ON CONFLICT`

### ✅ Solution Option 1: Try INSERT, Ignore Error
```json
{
  "tableId": "table_name",
  "fieldsUi": { ... },
  "continueOnFail": true,
  "onError": "continueErrorOutput"
}
```

### ✅ Solution Option 2: Check + Update or Insert
Use If node to check existence first, then branch to UPDATE or INSERT

### ✅ Solution Option 3: Use HTTP Request Node
```json
{
  "method": "POST",
  "url": "https://your-project.supabase.co/rest/v1/table",
  "headers": {
    "Prefer": "resolution=merge-duplicates"
  }
}
```

---

## 6. Complete Working Example

Here's a complete UPDATE node from `GEORISE_Scheduler - Supabase v2.json`:

```json
{
  "parameters": {
    "operation": "update",
    "tableId": "monitoring_configs",
    "filterType": "string",
    "filterString": "=id=eq.{{ $('Expand Engines').item.json.config_id }}",
    "fieldsUi": {
      "fieldValues": [
        {
          "fieldId": "last_run_at",
          "fieldValue": "={{ $now.toISO() }}"
        },
        {
          "fieldId": "next_run_at",
          "fieldValue": "={{ $now.plus({ days: $('Expand Engines').item.json.user_plan === 'free' ? 7 : 1 }).toISO() }}"
        },
        {
          "fieldId": "updated_at",
          "fieldValue": "={{ $now.toISO() }}"
        }
      ]
    }
  },
  "id": "8e1e2da2-2fde-4aa7-a591-dfa0ffa5dcea",
  "name": "Update Next Run Time",
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 1,
  "position": [416, -16],
  "alwaysOutputData": true,
  "retryOnFail": true,
  "maxTries": 2,
  "credentials": {
    "supabaseApi": {
      "id": "xSCCE5dL9poY7JFF",
      "name": "Supabase Lovable Georise"
    }
  },
  "continueOnFail": true,
  "onError": "continueErrorOutput"
}
```

---

## 7. Migration Checklist

When converting PostgreSQL nodes to Supabase nodes:

- [ ] Change `type` from `"n8n-nodes-base.postgres"` to `"n8n-nodes-base.supabase"`
- [ ] Remove `operation: "executeQuery"` and `query` parameters
- [ ] Add appropriate operation: `"update"`, `"getAll"`, or nothing for INSERT
- [ ] Convert SQL to `tableId` + `filterString` + `fieldsUi`
- [ ] Use PostgREST filter format: `=column=operator.value`
- [ ] Add retry settings: `retryOnFail: true`, `maxTries: 2`
- [ ] Add error handling: `continueOnFail: true`, `onError: "continueErrorOutput"`
- [ ] Update credentials reference to Supabase credentials
- [ ] Test in n8n UI to verify filters show up correctly
- [ ] For complex queries, create database views first

---

## 8. Supported Operations

The Supabase node supports:
- ✅ **INSERT** (default, no operation parameter)
- ✅ **UPDATE** (`operation: "update"`)
- ✅ **DELETE** (`operation: "delete"`)
- ✅ **SELECT** (`operation: "getAll"` or `"get"`)
- ❌ **UPSERT with ON CONFLICT** (not directly - use workarounds)
- ❌ **Raw SQL execution** (use PostgreSQL node or HTTP Request)
- ❌ **Stored procedures** (use PostgreSQL node or HTTP Request)
- ❌ **Transactions** (use PostgreSQL node)

---

## 9. Credentials Configuration

Supabase API credentials need:
- **Host**: `https://your-project.supabase.co`
- **Service Role Key** (for backend operations) OR **Anon Key** (for frontend)

In n8n workflows, always use **Service Role Key** for:
- Bypassing RLS policies
- Performing admin operations
- Scheduler workflows

---

## Resources

- [Supabase PostgREST Filters](https://postgrest.org/en/stable/api.html#horizontal-filtering-rows)
- [n8n Supabase Node Docs](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.supabase/)
- Working Examples in this repo:
  - `Analysis Starter.json` - Complex multi-step workflow
  - `Fetch Engine Weights.json` - Simple INSERT operations
  - `GEORISE_Scheduler - Supabase v2.json` - All operation types
