---
name: n8n-workflow-vibe-coding
description: Specialized guide for vibe coding n8n workflows with AI assistance. Ensures workflows import correctly, use proper node layouts, follow best practices for constants/variables, error handling, and testing. Includes n8n-specific patterns for modular design, sub-workflows, and AI agent integrations.
license: MIT
---

# N8N Workflow Vibe Coding

This skill provides specialized guidance for vibe coding n8n workflows—creating automation workflows through natural language descriptions while ensuring proper structure, importability, and maintainability.

## What is N8N Workflow Vibe Coding

N8N workflow vibe coding combines AI-assisted development with n8n's node-based automation platform. It enables rapid creation of complex workflows through conversational prompts while maintaining n8n's structural requirements and best practices.

**Core principles:**
- Generate valid, importable workflow JSON structures
- Maintain human-readable node layouts with proper positioning
- Use modular design with Config nodes for input decoupling
- ALWAYS use purpose-built nodes when available, only use HTTP Request/Code as last resort
- Follow n8n data structure patterns
- Implement proper error handling and testing

**When to use n8n vibe coding:**
- Rapid workflow prototyping and POCs
- Building AI agents and LangChain integrations
- Complex multi-step automations
- Integration between multiple services
- Data transformation pipelines
- Webhook-based automations

**When NOT to use n8n vibe coding:**
- Extremely simple single-node operations
- Workflows requiring custom node development
- Real-time streaming data processing (use dedicated tools)
- Workflows with >100 nodes (break into sub-workflows first)

## CRITICAL: Use Purpose-Built Nodes

**The Golden Rule:** ALWAYS use n8n's purpose-built nodes for services before resorting to HTTP Request or Code nodes.

### Why This Matters

Purpose-built nodes:
- Handle authentication automatically
- Provide proper error handling and retries
- Include rate limiting
- Have validated parameters
- Are maintained by n8n team
- Import cleanly without breaking

HTTP Request nodes:
- Require manual credential management
- Need custom error handling
- May have incorrect URLs or parameters
- Are harder to maintain
- Should ONLY be used when no dedicated node exists

### Common Mistakes to Avoid

**BAD - Using HTTP Request for Perplexity:**
```json
{
  "name": "Call Perplexity",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "https://api.perplexity.ai/chat/completions",
    "method": "POST"
  }
}
```

**GOOD - Using Perplexity Node:**
```json
{
  "name": "Call Perplexity",
  "type": "n8n-nodes-base.perplexity",
  "parameters": {
    "model": "sonar",
    "messages": {
      "message": [
        {
          "content": "={{ $json.query }}"
        }
      ]
    }
  },
  "credentials": {
    "perplexityApi": {
      "id": "perplexity_api",
      "name": "Perplexity API"
    }
  }
}
```

**BAD - Using HTTP Request to call another workflow:**
```json
{
  "name": "Trigger Processor",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "http://localhost:5678/webhook/processor",
    "method": "POST"
  }
}
```

**GOOD - Using Execute Workflow Node:**
```json
{
  "name": "Trigger Processor",
  "type": "n8n-nodes-base.executeWorkflow",
  "parameters": {
    "source": "database",
    "workflowId": {
      "__rl": true,
      "mode": "list",
      "value": "",
      "cachedResultName": "Processor Workflow"
    },
    "options": {
      "waitForCompletion": false
    }
  }
}
```

### Node Selection Decision Tree

1. **Check if dedicated node exists** for the service (Perplexity, OpenAI, PostgreSQL, etc.)
   - YES → Use the dedicated node
   - NO → Continue to step 2

2. **Check if it's a common database operation**
   - YES → Use PostgreSQL/MySQL/MongoDB node, NOT HTTP Request to REST API
   - NO → Continue to step 3

3. **Check if calling another n8n workflow**
   - YES → Use Execute Workflow node
   - NO → Continue to step 4

4. **Check if it's a standard REST API with no n8n node**
   - YES → Now you can use HTTP Request node
   - NO → Consider if this should be a custom node or different approach

## Config Node Pattern (CRITICAL)

**ALWAYS start workflows with a Config node immediately after the trigger.** This is one of the most important patterns for maintainable workflows.

### Why Config Nodes Matter

1. **Decouples input from logic** - Changes to trigger structure don't break the entire workflow
2. **Enables easy debugging** - Add Manual Trigger before Config for testing with sample data
3. **Single source of truth** - All constants and inputs defined in one place
4. **Improves maintainability** - Clear what data the workflow expects
5. **Makes testing faster** - No need to simulate webhooks or call parent workflows

### Config Node Structure

```json
{
  "name": "Config",
  "type": "n8n-nodes-base.set",
  "position": [450, 300],
  "parameters": {
    "mode": "manual",
    "duplicateItem": false,
    "assignments": {
      "assignments": [
        {
          "id": "uuid-1",
          "name": "API_TIMEOUT",
          "type": "number",
          "value": 30000
        },
        {
          "id": "uuid-2",
          "name": "BATCH_SIZE",
          "type": "number",
          "value": 20
        },
        {
          "id": "uuid-3",
          "name": "brandId",
          "type": "string",
          "value": "={{ $('Webhook Trigger').item.json.body.brandId }}"
        },
        {
          "id": "uuid-4",
          "name": "brandName",
          "type": "string",
          "value": "={{ $('Webhook Trigger').item.json.body.brandName }}"
        },
        {
          "id": "uuid-5",
          "name": "topic",
          "type": "string",
          "value": "={{ $('Webhook Trigger').item.json.body.topic }}"
        }
      ]
    }
  }
}
```

### Using Config Node Throughout Workflow

**BAD - Direct trigger reference:**
```json
{
  "jsCode": "const brandId = $('Webhook Trigger').item.json.body.brandId;"
}
```

**GOOD - Config node reference:**
```json
{
  "jsCode": "const brandId = $('Config').first().json.brandId;"
}
```

**Why `.first()` instead of `.item`:**
- Config nodes produce exactly one item
- `.first()` is explicit and always gets that single item
- `.first()` works correctly inside loops (Split in Batches)
- `.item` is context-dependent and can fail in loop scenarios

### Config Node for Different Trigger Types

**Webhook Trigger:**
```json
{
  "name": "Config",
  "parameters": {
    "assignments": {
      "assignments": [
        {
          "name": "runId",
          "value": "={{ $('Webhook Trigger').item.json.body.runId }}"
        },
        {
          "name": "userId",
          "value": "={{ $('Webhook Trigger').item.json.body.userId }}"
        }
      ]
    }
  }
}
```

**Execute Workflow Trigger:**
```json
{
  "name": "Config",
  "parameters": {
    "assignments": {
      "assignments": [
        {
          "name": "runId",
          "value": "={{ $('When Called By Another Workflow').item.json.runId }}"
        },
        {
          "name": "brandName",
          "value": "={{ $('When Called By Another Workflow').item.json.brandName }}"
        }
      ]
    }
  }
}
```

### Debug Pattern with Manual Trigger

```json
{
  "nodes": [
    {
      "name": "Manual Trigger for Testing",
      "type": "n8n-nodes-base.manualTrigger",
      "position": [250, 100]
    },
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "name": "Config",
      "type": "n8n-nodes-base.set",
      "position": [450, 200],
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "name": "brandId",
              "value": "test-brand-123"
            },
            {
              "name": "topic",
              "value": "AI automation"
            }
          ]
        }
      }
    }
  ],
  "connections": {
    "Manual Trigger for Testing": {
      "main": [[{"node": "Config", "type": "main", "index": 0}]]
    },
    "Webhook Trigger": {
      "main": [[{"node": "Config", "type": "main", "index": 0}]]
    }
  }
}
```

## N8N Workflow Structure Fundamentals

### Core JSON Structure

Every n8n workflow must follow this structure for proper import:

```json
{
  "name": "Workflow Name",
  "nodes": [
    {
      "parameters": {},
      "id": "unique-node-id",
      "name": "Node Name",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300]
    }
  ],
  "connections": {
    "Node Name": {
      "main": [
        [
          {
            "node": "Target Node",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": false,
  "settings": {
    "executionOrder": "v1"
  },
  "versionId": "unique-version-id",
  "meta": {
    "templateCredsSetupCompleted": true
  }
}
```

### Node Positioning Rules

**Critical for readable workflows:**

```javascript
// Standard spacing between nodes
const HORIZONTAL_SPACING = 400;
const VERTICAL_SPACING = 200;

// Starting position
const START_X = 250;
const START_Y = 300;

// Position calculation for linear flow
position: [START_X + (nodeIndex * HORIZONTAL_SPACING), START_Y]

// Position for parallel branches
branchPosition: [START_X + (nodeIndex * HORIZONTAL_SPACING), START_Y + (branchIndex * VERTICAL_SPACING)]
```

**Layout patterns:**
- **Linear flow:** Nodes at Y=300, X incrementing by 400
- **Parallel branches:** Different Y levels (300, 500, 700)
- **Merge points:** Center Y position between branches
- **Sub-workflow groups:** Contained in visual boxes (Y offsets)

### Data Structure Requirements

N8N expects data in this format:

```javascript
// Each item must be wrapped in json key
[
  {
    "json": {
      "field1": "value1",
      "field2": "value2"
    }
  },
  {
    "json": {
      "field1": "value3",
      "field2": "value4"
    }
  }
]
```

## Database Operations

**CRITICAL:** For database operations, ALWAYS use the proper database node (PostgreSQL, MySQL, MongoDB, etc.) instead of HTTP Request to a REST API.

### Why Database Nodes Matter

**BAD - Using HTTP Request to Supabase REST API:**
```json
{
  "name": "Save to Database",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "https://project.supabase.co/rest/v1/table",
    "method": "POST",
    "authentication": "genericCredentialType"
  }
}
```

**GOOD - Using PostgreSQL Node with Supabase:**
```json
{
  "name": "Save to Database",
  "type": "n8n-nodes-base.postgres",
  "typeVersion": 2.5,
  "parameters": {
    "operation": "insert",
    "schema": {
          "__rl": true,
          "value": "public",
          "mode": "list"
    },
    "table": {
      "__rl": true,
      "value": "analysis_runs",
      "mode": "list"
    },
    "columns": {
      "mappingMode": "defineBelow",
      "value": {
        "run_id": "={{ $('Config').item.json.runId }}",
        "brand_name": "={{ $('Config').item.json.brandName }}",
        "status": "pending"
      }
    }
  },
  "credentials": {
    "postgres": {
      "id": "supabase_postgres",
      "name": "Supabase PostgreSQL"
    }
  }
}
```

### Database Credential Setup

For Supabase via PostgreSQL node:
- Host: `db.xxx.supabase.co` (from Supabase database settings)
- Port: 5432
- Database: `postgres`
- User: `postgres`
- Password: Database password (not API key)

**NOT** the Supabase API URL or API keys - those are for REST API, not direct database connections.

## Calling Other Workflows

### Execute Workflow Node

**Use Execute Workflow node to call other n8n workflows:**

```json
{
  "name": "Call Processor Workflow",
  "type": "n8n-nodes-base.executeWorkflow",
  "typeVersion": 1.2,
  "parameters": {
    "source": "database",
    "workflowId": {
      "__rl": true,
      "mode": "list",
      "value": "",
      "cachedResultName": "Processor Workflow Name"
    },
    "options": {
      "waitForCompletion": false
    }
  }
}
```

### Execute Workflow Trigger (Modern Pattern)

**CRITICAL: Define Parameters in the Sub-Workflow Trigger**

The Execute Workflow Trigger should **define its expected parameters** using "Input Data Mode: Define using fields below". This creates a contract that auto-populates in the calling workflow's Execute Workflow node.

**In the called workflow:**

```json
{
  "name": "When Called By Another Workflow",
  "type": "n8n-nodes-base.executeWorkflowTrigger",
  "typeVersion": 1,
  "position": [250, 300],
  "parameters": {
    "triggerMode": "manual",
    "inputDataMode": "define",
    "inputDataFields": {
      "values": [
        {
          "fieldName": "run_id",
          "fieldType": "string",
          "required": true
        },
        {
          "fieldName": "brand_id",
          "fieldType": "string",
          "required": true
        },
        {
          "fieldName": "brand_name",
          "fieldType": "string",
          "required": true
        },
        {
          "fieldName": "topic",
          "fieldType": "string",
          "required": true
        },
        {
          "fieldName": "ai_engine",
          "fieldType": "string",
          "required": false
        }
      ]
    }
  }
}
```

**Benefits of defining parameters:**
- Auto-populates fields in the calling workflow's Execute Workflow node
- Clear documentation of what the sub-workflow expects
- Type validation at design time
- Better error messages when parameters are missing

### Data Flow Between Workflows

**In the calling workflow (Execute Workflow node):**

After selecting the sub-workflow, n8n automatically shows the defined input fields. Fill them in:

```json
{
  "type": "n8n-nodes-base.executeWorkflow",
  "parameters": {
    "source": "database",
    "workflowId": {
      "__rl": true,
      "mode": "list",
      "value": "workflow-id",
      "cachedResultName": "Processor Workflow"
    },
    "inputData": {
      "run_id": "={{ $json.run_id }}",
      "brand_id": "={{ $json.brand_id }}",
      "brand_name": "={{ $json.brand_name }}",
      "topic": "={{ $json.topic }}",
      "ai_engine": "perplexity"
    }
  }
}
```

**In the sub-workflow - access via trigger:**

```javascript
// Access the parameters passed from parent workflow
const data = $('When Called By Another Workflow').item.json;
const runId = data.run_id;
const brandId = data.brand_id;
const brandName = data.brand_name;
const topic = data.topic;
const aiEngine = data.ai_engine;
```

**Best Practice - Use Config Node Pattern:**

```json
{
  "name": "Config",
  "type": "n8n-nodes-base.set",
  "parameters": {
    "assignments": {
      "assignments": [
        {
          "name": "runId",
          "value": "={{ $('When Called By Another Workflow').item.json.run_id || 'test_run' }}"
        },
        {
          "name": "brandId",
          "value": "={{ $('When Called By Another Workflow').item.json.brand_id || 'test-brand' }}"
        },
        {
          "name": "aiEngine",
          "value": "={{ $('When Called By Another Workflow').item.json.ai_engine || 'perplexity' }}"
        }
      ]
    }
  }
}
```

## Data Referencing Best Practices

### Referencing Previous Node Data

**ALWAYS use explicit node references:**

```javascript
// GOOD - Explicit reference with .first() for single-item nodes
const brandName = $('Config').first().json.brandName;
const runId = $('Config').first().json.runId;

// BAD - Implicit reference (fragile)
const brandName = $json.brandName;
```

### Common Data Access Patterns

**Access single-item nodes (Config, Set, etc.):**
```javascript
// Use .first() for nodes that produce one item
$('Config').first().json.fieldName
$('Set Variables').first().json.fieldName
```

**Access current item in a loop:**
```javascript
// Use .item when processing the current loop item
$('Split Batches').item.json.fieldName
```

**Access all items from node:**
```javascript
$('Node Name').all()
```

**Best Practice - Use `.first()` by default:**
- For Config nodes, Set nodes, and any node producing a single item
- More explicit and works in all contexts (inside/outside loops)
- Use `.item` only when you specifically need the current loop item

**Check if node has data:**
```javascript
if ($('Node Name').item !== undefined) {
  // Node has data
}
```

### Webhook Data Access

**Webhook body data:**
```javascript
// Immediate next node
$json.body.fieldName

// Later nodes - reference webhook
$('Webhook Trigger').item.json.body.fieldName
```

**Better - Use Config node:**
```javascript
// In Config node (directly connected to webhook)
{
  "name": "userId",
  "value": "={{ $json.body.userId }}"
}

// Everywhere else (use .first() for stability)
$('Config').first().json.userId
```

## Configuration Management

### Config Node Pattern (Already Covered Above)

Always start workflows with Config node containing:
1. Constants (API timeouts, batch sizes, etc.)
2. Input values extracted from trigger
3. Any computed values needed throughout workflow

### Environment Variables

For credentials and secrets, use n8n's credential system, NOT environment variables in code:

**BAD:**
```javascript
const apiKey = process.env.PERPLEXITY_API_KEY;
```

**GOOD:**
Use credential configuration in node:
```json
{
  "credentials": {
    "perplexityApi": {
      "id": "perplexity_api",
      "name": "Perplexity API"
    }
  }
}
```

## Best Practices for N8N Workflow Creation

### 1. Node Naming Conventions

Use descriptive, action-oriented names:
- **GOOD:** "Update Status Processing", "Generate Queries", "Calculate Scores"
- **BAD:** "Node1", "Process", "Do Stuff"

**NEVER use emojis in node names** - they cause encoding issues and make referencing difficult:
- **BAD:** "🔧 Configuration", "📊 Calculate"
- **GOOD:** "Configuration", "Calculate Scores"

### 2. Workflow Structure

Standard workflow pattern:
```
1. Trigger (webhook, schedule, manual, executeWorkflowTrigger)
2. Config Node (extract inputs, define constants)
3. Processing Logic
4. Database Operations
5. Response/Completion
```

### 3. Error Handling Patterns

**Implement Try-Catch patterns:**

```json
{
  "name": "Try",
  "type": "n8n-nodes-base.noOp",
  "position": [450, 200],
  "continueOnFail": false
},
{
  "name": "Error Handler",
  "type": "n8n-nodes-base.code",
  "position": [450, 400],
  "parameters": {
    "mode": "runOnceForEachItem",
    "jsCode": "const error = $input.item.error;\nconsole.error('Workflow error:', error);\nreturn {json: {error: error.message, timestamp: new Date().toISOString()}};"
  }
}
```

**IMPORTANT: Avoid Unnecessary Merge Nodes**

When you have multiple error paths (validation errors, database errors, etc.) that return different error responses, **don't use a Merge node**. Only ONE path will execute, so merging is unnecessary.

**BAD Pattern - Unnecessary Merge:**
```
Set Success Response ──┐
Set Database Error ────┤──> Merge All Paths ──> Return Response
Set Validation Error ──┘
```

**GOOD Pattern - Direct Connections:**
```
Set Success Response ──┐
Set Database Error ────┤──> Return Response
Set Validation Error ──┘
```

**Why this matters:**
- Only one path executes in error handling scenarios
- Merge nodes can cause unexpected behavior or force execution of nodes that shouldn't run
- Simpler workflow is easier to debug
- Multiple nodes can connect to the same target without a merge

**When DO you need Merge nodes:**
- Parallel branches that ALL execute and need to be combined
- Collecting results from multiple simultaneous API calls
- Aggregating data from different sources that execute in parallel

**When DON'T you need Merge nodes:**
- Multiple conditional paths where only ONE executes (if/else, switch cases)
- Error handling paths (success vs error paths)
- Different response formats based on validation results

### 4. Retry Configuration

For external API calls, implement retry logic:

```json
{
  "parameters": {
    "retry": {
      "maxRetries": 3,
      "retryInterval": 2000,
      "retryOnStatusCodes": "429,500,502,503,504"
    }
  }
}
```

### 5. Rate Limiting

Use Wait node for rate limiting:

```json
{
  "name": "Rate Limit Delay",
  "type": "n8n-nodes-base.wait",
  "typeVersion": 1.1,
  "parameters": {
    "amount": 2000,
    "unit": "milliseconds"
  },
  "webhookId": "rate-limit-delay"
}
```

## Modular Design with Sub-Workflows

### When to Use Sub-Workflows

- Reusable logic across multiple workflows
- Complex operations >10 nodes
- Different execution contexts (error isolation)
- Team collaboration (separate ownership)
- Testing individual components

### Calling Sub-Workflows

```json
{
  "name": "Process User Data",
  "type": "n8n-nodes-base.executeWorkflow",
  "typeVersion": 1.2,
  "parameters": {
    "source": "database",
    "workflowId": {
      "__rl": true,
      "mode": "list",
      "value": "",
      "cachedResultName": "User Data Processor"
    },
    "options": {
      "waitForCompletion": true
    }
  }
}
```

### Sub-Workflow Pattern

```json
{
  "name": "Sub-Workflow Name",
  "nodes": [
    {
      "name": "When Called By Another Workflow",
      "type": "n8n-nodes-base.executeWorkflowTrigger"
    },
    {
      "name": "Config",
      "type": "n8n-nodes-base.set"
    },
    {
      "name": "Processing Logic"
    }
  ]
}
```

## Loop Patterns

### Split In Batches

For processing items sequentially:

```json
{
  "name": "Split Batches",
  "type": "n8n-nodes-base.splitInBatches",
  "typeVersion": 3,
  "parameters": {
    "batchSize": 1,
    "options": {}
  }
}
```

Connect back to itself for looping:
```json
{
  "connections": {
    "Split Batches": {
      "main": [
        [{"node": "Process Item", "type": "main", "index": 0}],
        [{"node": "After Loop", "type": "main", "index": 0}]
      ]
    },
    "Process Item": {
      "main": [[{"node": "Split Batches", "type": "main", "index": 0}]]
    }
  }
}
```

## Common Pitfalls and Solutions

### Pitfall 1: Using HTTP Request Instead of Purpose-Built Nodes

**Problem:** Workflow breaks on import, credentials don't work
**Solution:** Always check for dedicated n8n node first

### Pitfall 2: Direct Trigger References Throughout Workflow

**Problem:** Workflow breaks when trigger structure changes
**Solution:** Use Config node pattern

### Pitfall 3: Incorrect Data Referencing

**Problem:** `$json.field` doesn't work in later nodes
**Solution:** Use explicit node references: `$('Node Name').item.json.field`

### Pitfall 4: Set Node Loses Previous Data

**Problem:** Data from previous node disappears after Set node
**Solution:** Set nodes create new data by default. Reference previous nodes explicitly when needed.

### Pitfall 5: Webhook Import Failures

**Problem:** Webhook node missing required parameters
**Solution:** Always include `responseMode` and `webhookId` in webhook nodes

## Workflow Import Checklist

Before finalizing any n8n workflow JSON:

### Structure Validation

- [ ] Valid JSON syntax
- [ ] All nodes have unique IDs
- [ ] Node types use correct typeVersion
- [ ] Connections object properly structured
- [ ] Position arrays have [x, y] coordinates

### Best Practices

- [ ] Config node immediately after trigger
- [ ] Purpose-built nodes used (not HTTP Request)
- [ ] Execute Workflow node used for calling other workflows
- [ ] Database operations use database nodes (not HTTP)
- [ ] Error handling on external calls
- [ ] Consistent node naming (no emojis)
- [ ] Proper node spacing (400px horizontal)
- [ ] Explicit node references in code

### Testing Preparation

- [ ] Manual trigger included for debugging
- [ ] Test data can be configured in Config node
- [ ] All credentials use proper node credential system

## Quick Reference: Node Selection

| Task | Use This Node | NOT This |
|------|---------------|----------|
| Call Perplexity | `n8n-nodes-base.perplexity` | HTTP Request |
| Call OpenAI | `@n8n/n8n-nodes-langchain.lmChatOpenAi` | HTTP Request |
| Database operations | `n8n-nodes-base.postgres` | HTTP Request to REST API |
| Call another workflow | `n8n-nodes-base.executeWorkflow` | HTTP Request to webhook |
| Configuration | Config Set node after trigger | Scattered throughout |
| Constants | Config Set node | Environment variables |

## Complete Example: GEORISE Pattern

```json
{
  "name": "GEORISE Analysis Starter",
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300],
      "parameters": {
        "path": "analysis-start",
        "responseMode": "responseNode"
      }
    },
    {
      "name": "Config",
      "type": "n8n-nodes-base.set",
      "position": [450, 300],
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "name": "brandId",
              "value": "={{ $('Webhook Trigger').item.json.body.brandId }}"
            },
            {
              "name": "brandName",
              "value": "={{ $('Webhook Trigger').item.json.body.brandName }}"
            },
            {
              "name": "topic",
              "value": "={{ $('Webhook Trigger').item.json.body.topic }}"
            }
          ]
        }
      }
    },
    {
      "name": "Create Run Record",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.5,
      "position": [650, 300],
      "parameters": {
        "operation": "insert",
        "table": {
          "__rl": true,
          "value": "analysis_runs",
          "mode": "list"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "brand_id": "={{ $('Config').item.json.brandId }}",
            "brand_name": "={{ $('Config').item.json.brandName }}",
            "status": "pending"
          }
        }
      },
      "credentials": {
        "postgres": {
          "id": "supabase_postgres"
        }
      }
    },
    {
      "name": "Trigger Processor",
      "type": "n8n-nodes-base.executeWorkflow",
      "typeVersion": 1.2,
      "position": [850, 300],
      "parameters": {
        "source": "database",
        "workflowId": {
          "__rl": true,
          "mode": "list",
          "cachedResultName": "Analysis Processor"
        },
        "options": {
          "waitForCompletion": false
        }
      }
    }
  ]
}
```

## Resources and Core Principles Summary

1. **ALWAYS use purpose-built nodes** - Check for dedicated nodes before HTTP Request
2. **Config node pattern** - Decouple inputs immediately after trigger
3. **Execute Workflow for sub-workflows** - Never use HTTP Request to call workflows
4. **PostgreSQL node for databases** - Never use HTTP Request for database operations
5. **Explicit node references** - Always use `$('Node Name').item.json.field`
6. **No emojis in names** - ASCII only for proper referencing
7. **Manual trigger for debugging** - Include for easy testing
8. **Credentials in nodes** - Use n8n credential system, not environment variables
9. **Validate imports** - Test in clean instance before production
10. **Monitor and iterate** - Start simple, add complexity incrementally
