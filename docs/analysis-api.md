# GEORISE Analysis API

This API starts an AI-visibility analysis run for a given brand and topic.
It is **asynchronous**: it does NOT return the analysis result directly.
Instead, it returns a `runId`, and the frontend tracks progress/results via Supabase.

## Endpoint

`POST /api/analysis`

(Infrastructure: this is proxied to the n8n workflow `Analysis API`, webhook path `/webhook/analysis`.)

## Request body

```json
{
  "brandId": "string (UUID)",
  "brandName": "string",
  "topic": "string",
  "userId": "string (UUID)",
  "userPlan": "optional string – e.g. 'free', 'pro'"
}
