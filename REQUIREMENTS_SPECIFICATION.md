# IFS Data Synchronization Service - Simple Requirements

## 1. Project Overview

### Purpose
A simple Node.js/TypeScript service that receives IFS data via HTTP API and stores it in PostgreSQL database.

### Business Context
- **Data Flow**: IFS System → HTTP API → Database
- **Multi-Tenant**: JWT contains organization ID for data isolation
- **Operations**: Only Upsert and Delete operations

## 2. Simple Architecture

### 2.1 Components (NestJS/Angular Style)
```
index.ts                      # Express server setup + JSON repair middleware
├── ifs-sync.router.ts       # Dynamic route generation for 3 tables
├── ifs-sync.controller.ts   # Request handling + logging + response
├── ifs-sync.service.ts      # Prisma database operations
├── jwt.middleware.ts        # JWT validation + org extraction
├── json-repair.middleware.ts # JSON repair for malformed requests
├── sync-event.service.ts    # Event queue for database sync
├── supplier-sync.service.ts # Supplier sync logic (empty for now)
├── payment-sync.service.ts  # Payment sync logic (empty for now)
└── types.ts                 # TypeScript interfaces
```

### 2.2 API Endpoints

#### Primary Endpoints (Auto-generated)
- `POST /supplier_info_tab`
- `POST /payment_address_tab`
- `POST /supplier_document_tax_info_tab`

#### Request Format
```json
{
  "action": "upsert" | "delete",
  "data": { /* table-specific data */ }
}
```

#### Health Check
- `GET /health` → "ok"

### 2.3 Data Tables
1. **supplier_info_tab**: Supplier master data
2. **payment_address_tab**: Payment and banking information
3. **supplier_document_tax_info_tab**: Tax identification data

### 2.4 Operations (Simplified)

#### Upsert Operation
- Try `createMany` with `skipDuplicates: true`
- If count === 0, do `updateMany`
- Unique key: `organization_id + rowkey`

#### Delete Operation
- Simple `deleteMany` with `organization_id + rowkey`

## 3. Simple Requirements

### 3.1 HTTP Response Policy
- **Always HTTP 200**: Even for errors
- **JSON Response**: `{ status: number, message: string, success: boolean }`
- **No sensitive data**: Customer-safe error messages

### 3.2 JWT Authentication (Middleware)
- **Header**: `Authorization: Bearer <token>`
- **Extract**: `org.id` from JWT payload → `organizationId`
- **Apply to**: All endpoints except `/health`

### 3.3 Logging (One Log Per Request)
- **When**: Only at the end of each request in controller
- **Format**: JSON with full request + response data
- **Content**: `{ organizationId, table, request: {action, data, headers}, response, duration }`

### 3.4 Error Handling
- **Catch all errors** in controller
- **Map to safe messages** (no sensitive data)
- **Always return HTTP 200** with error in JSON

### 3.5 JSON Repair Middleware
- **Automatic repair** of malformed JSON requests
- **Multiple strategies**: trailing commas, unescaped quotes, single quotes
- **Fallback**: Return error if repair fails

### 3.6 No Validation Policy
- **Accept all actions**: No restriction on action types
- **Accept all data**: No schema validation
- **Process everything**: Let database handle constraints

## 4. Technical Stack

### 4.1 Technology
- **Node.js + TypeScript + Express.js**
- **PostgreSQL + Prisma ORM**
- **JWT for authentication**

### 4.2 Database Schema (Existing)
- **organization**: Tenant isolation table
- **ifs_supplier_info_tab**: Supplier data with `UNIQUE(organization_id, rowkey)`
- **ifs_payment_address_tab**: Payment data with `UNIQUE(organization_id, rowkey)`
- **ifs_supplier_document_tax_info_tab**: Tax data with `UNIQUE(organization_id, rowkey)`

### 4.3 Simple Architecture
```
HTTP Request
    ↓
JWT Middleware (extract organizationId)
    ↓
Router (dynamic routes for 3 tables)
    ↓
Controller (handle request + log + response)
    ↓
Service (Prisma operations)
    ↓
Database
```

## 5. Implementation Plan

### 5.1 File Structure
```
src/
├── index.ts                    # Express server setup + port listening
├── ifs-sync.router.ts         # Dynamic route generation for 3 tables
├── ifs-sync.controller.ts     # Request handling + single log + response
├── ifs-sync.service.ts        # Simple Prisma upsert/delete operations
├── jwt.middleware.ts          # JWT validation + organizationId extraction
└── types.ts                   # TypeScript interfaces
```

### 5.2 Environment Variables
- `PORT`: Service port (default: 13000)
- `JWT_SECRET`: JWT signing secret
- `POSTGRES_PRISMA_URL`: Database connection

### 5.3 Event Queue & Sync Integration

#### Event Flow
```
HTTP Request → Controller → Service → Database
                    ↓
              Emit Sync Event → Event Queue → Database Sync
```

#### Event Registration
```typescript
// In controller constructor:
constructor(prisma?: PrismaClient) {
  this.service = new IfsSyncService(prisma);
  this.syncEventService = new SyncEventService();
}

// After successful operation:
if (result.success && data?.rowkey) {
  this.syncEventService.emitSyncEvent({
    organizationId,
    tableName: table,
    rowkey: data.rowkey,
    operation: action,
    timestamp: new Date(),
    data
  });
}
```

#### Prisma Dependency Injection
```typescript
// For production:
const prisma = new PrismaClient();
const controller = new IfsSyncController(prisma);

// For testing:
const mockPrisma = createMockPrismaClient();
const controller = new IfsSyncController(mockPrisma);
```

#### Database Mocking Strategy
```typescript
// Create mock Prisma client for tests
const mockPrisma = {
  iFS_Supplier: {
    createMany: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn()
  },
  // ... other models
} as jest.Mocked<PrismaClient>;
```

## 6. Detailed Implementation Guide

### 6.1 index.ts (Express Server)
```typescript
import express from 'express';
import { jwtMiddleware } from './jwt.middleware';
import { jsonRepairMiddleware } from './json-repair.middleware';
import { ifsSyncRouter } from './ifs-sync.router';

const app = express();

// JSON repair middleware (before express.json())
app.use(jsonRepairMiddleware);
app.use(express.json());

// Health check (no JWT required)
app.get('/health', (req, res) => res.send('ok'));

// Apply JWT middleware to all other routes
app.use(jwtMiddleware);

// Use dynamic router for table routes
app.use('/', ifsSyncRouter);

const PORT = process.env.PORT || 13000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### 6.2 jwt.middleware.ts (JWT Validation)
```typescript
import jwt from 'jsonwebtoken';

export function jwtMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(200).json({
      status: 401,
      message: 'JWT token missing',
      success: false
    });
  }

  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.org?.id) {
      return res.status(200).json({
        status: 403,
        message: 'Invalid token format',
        success: false
      });
    }

    req.organizationId = decoded.org.id;
    next();
  } catch (error) {
    res.status(200).json({
      status: 403,
      message: 'Invalid JWT token',
      success: false
    });
  }
}
```

### 6.3 ifs-sync.router.ts (Dynamic Routes)
```typescript
import { Router } from 'express';
import { IfsSyncController } from './ifs-sync.controller';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const controller = new IfsSyncController(prisma);

// Supported tables
const SUPPORTED_TABLES = [
  'supplier_info_tab',
  'payment_address_tab',
  'supplier_document_tax_info_tab'
];

// Create dynamic routes for each table
SUPPORTED_TABLES.forEach(table => {
  router.post(`/${table}`, (req, res) =>
    controller.handleRequest(req, res, table)
  );
});

export { router as ifsSyncRouter };
```

### 6.4 ifs-sync.controller.ts (Request Handler)
```typescript
import { IfsSyncService } from './ifs-sync.service';
import { SyncEventService } from './sync-event.service';
import { PrismaClient } from '@prisma/client';

export class IfsSyncController {
  private service: IfsSyncService;
  private syncEventService: SyncEventService;

  constructor(prisma?: PrismaClient) {
    this.service = new IfsSyncService(prisma);
    this.syncEventService = new SyncEventService();
  }

  async handleRequest(req, res, table: string) {
    const startTime = Date.now();
    const { action, data } = req.body;
    const { organizationId } = req;

    try {
      // No validation - process all requests
      const result = await this.service.processData(table, action, data, organizationId);

      // Emit sync event if successful
      if (result.success && data?.rowkey) {
        this.syncEventService.emitSyncEvent({
          organizationId,
          tableName: table,
          rowkey: data.rowkey,
          operation: action,
          timestamp: new Date(),
          data
        });
      }

      // Log and respond
      this.logRequest(req, result, startTime);
      res.status(200).json(result);

    } catch (error) {
      const result = {
        status: 500,
        message: 'Internal server error',
        success: false
      };
      this.logRequest(req, result, startTime);
      res.status(200).json(result);
    }
  }

  private logRequest(req, result, startTime) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      organizationId: req.organizationId,
      table: req.params.table || req.url.split('/')[1],
      request: {
        action: req.body?.action,
        data: req.body?.data,
        headers: {
          'user-agent': req.headers['user-agent'],
          'content-type': req.headers['content-type']
        }
      },
      response: result,
      duration: Date.now() - startTime
    };
    console.log(JSON.stringify(logEntry));
  }
}
```

### 6.5 ifs-sync.service.ts (Database Operations)
```typescript
import { PrismaClient } from '@prisma/client';

export class IfsSyncService {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  async processData(table: string, action: string, data: any, organizationId: string) {
    try {
      if (action === 'delete') {
        return await this.deleteRecord(table, data, organizationId);
      } else {
        // All other actions (upsert, insert, update) use upsert logic
        return await this.upsertRecord(table, data, organizationId);
      }
    } catch (error) {
      return {
        status: 500,
        message: 'Database operation failed',
        success: false
      };
    }
  }

  private async upsertRecord(table: string, data: any, organizationId: string) {
    const recordData = { ...data, organization_id: organizationId };
    const model = this.getModel(table);

    // Try create first
    const createResult = await model.createMany({
      data: recordData,
      skipDuplicates: true
    });

    if (createResult.count > 0) {
      return {
        status: 200,
        message: `Record created successfully`,
        success: true
      };
    }

    // If not created, update existing
    const updateResult = await model.updateMany({
      where: {
        organization_id: organizationId,
        rowkey: data.rowkey || `fallback_${Date.now()}`
      },
      data: recordData
    });

    return {
      status: 200,
      message: `Record updated successfully`,
      success: true
    };
  }

  private async deleteRecord(table: string, data: any, organizationId: string) {
    const model = this.getModel(table);

    await model.deleteMany({
      where: {
        organization_id: organizationId,
        rowkey: data.rowkey || `fallback_${Date.now()}`
      }
    });

    return {
      status: 200,
      message: `Record deleted successfully`,
      success: true
    };
  }

  private getModel(table: string) {
    switch (table) {
      case 'supplier_info_tab':
        return this.prisma.iFS_Supplier;
      case 'payment_address_tab':
        return this.prisma.iFS_Payment_Address;
      case 'supplier_document_tax_info_tab':
        return this.prisma.iFS_Supplier_Document_Tax;
      default:
        throw new Error(`Unsupported table: ${table}`);
    }
  }
}
```

### 6.6 json-repair.middleware.ts (JSON Repair)
```typescript
export function jsonRepairMiddleware(req, res, next) {
  if (req.headers['content-type']?.includes('application/json')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        // First try normal JSON parsing
        req.body = JSON.parse(body);
        next();
      } catch (error) {
        // Try to repair and parse the JSON
        const repairResult = repairAndParseJSON(body);

        if (repairResult.success) {
          req.body = repairResult.data;
          next();
        } else {
          res.status(200).json({
            status: 400,
            message: 'Invalid JSON payload',
            success: false
          });
        }
      }
    });
  } else {
    next();
  }
}

function repairAndParseJSON(jsonString: string) {
  const repairStrategies = [
    // Fix trailing commas
    (json: string) => json.replace(/,(\s*[}\]])/g, '$1'),
    // Fix unescaped quotes in string values
    (json: string) => json.replace(/"([^"]*)"([^"]*)"([^"]*)"/g, '"$1\\"$2\\"$3"'),
    // Fix single quotes to double quotes
    (json: string) => json.replace(/'/g, '"'),
  ];

  for (const strategy of repairStrategies) {
    try {
      const repairedJson = strategy(jsonString);
      const parsed = JSON.parse(repairedJson);
      return { success: true, data: parsed };
    } catch (error) {
      continue;
    }
  }

  return { success: false, error: 'Unable to repair JSON' };
}
```

### 6.7 sync-event.service.ts (Event Queue)
```typescript
import { EventEmitter } from 'events';
import { SyncEvent } from './types';

export class SyncEventService {
  private eventEmitter = new EventEmitter();
  private eventQueue: SyncEvent[] = [];
  private processing = false;

  constructor() {
    // Register event handlers
    this.setupEventHandlers();
  }

  emitSyncEvent(event: SyncEvent) {
    this.eventQueue.push(event);
    this.eventEmitter.emit('syncEvent', event);

    // Process queue if not already processing
    if (!this.processing) {
      this.processQueue();
    }
  }

  onSyncEvent(handler: (event: SyncEvent) => Promise<void>) {
    this.eventEmitter.on('syncEvent', handler);
  }

  private setupEventHandlers() {
    this.onSyncEvent(async (event) => {
      try {
        console.log(`Processing sync event: ${event.tableName}/${event.rowkey}`);
        // Here you can add your database sync logic
        await this.performDatabaseSync(event);
      } catch (error) {
        console.error(`Sync event failed: ${event.tableName}/${event.rowkey}`, error);
      }
    });
  }

  private async processQueue() {
    this.processing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        try {
          await this.performDatabaseSync(event);
        } catch (error) {
          console.error('Queue processing error:', error);
        }
      }
    }

    this.processing = false;
  }

  private async performDatabaseSync(event: SyncEvent) {
    // Placeholder for actual sync logic
    // This is where you would implement the SQL transfer to target database
    console.log(`Syncing ${event.tableName} record ${event.rowkey} for org ${event.organizationId}`);

    // Example: Execute SQL to transfer data to target database
    // await targetDb.query('INSERT INTO target_table ... SELECT ... FROM source_table WHERE ...');
  }
}
```

### 6.8 types.ts (TypeScript Interfaces)
```typescript
export interface IfsRequest {
  action: string; // No restriction - accept any action
  data: Record<string, any>;
}

export interface IfsResponse {
  status: number;
  message: string;
  success: boolean;
}

export interface LogEntry {
  timestamp: string;
  organizationId: string;
  table: string;
  request: {
    action: string;
    data: Record<string, any>;
    headers: Record<string, string>;
  };
  response: IfsResponse;
  duration: number;
}

export interface SyncEvent {
  organizationId: string;
  tableName: string;
  rowkey: string;
  operation: string; // Any operation
  timestamp: Date;
  data?: Record<string, any>;
}
```

## 7. Best Practices Analysis

### 7.1 ✅ Current Best Practices Fulfilled
- **Single Responsibility**: Each file has one clear purpose
- **Dependency Injection**: Service injected into controller
- **Error Handling**: Consistent error responses
- **Type Safety**: Full TypeScript with interfaces
- **Security**: JWT validation + organization isolation
- **Logging**: Structured JSON logging
- **Separation of Concerns**: Clear layer separation

### 7.2 ✅ Testing-Friendly Architecture
- **Dependency Injection**: Prisma injected into service and controller
- **Mockable Database**: Easy to mock Prisma for testing
- **Pure Functions**: Service methods are easily testable
- **Clear Interfaces**: Well-defined input/output types
- **Isolated Components**: Each layer can be tested independently

### 7.3 🎯 Simplified Requirements (No Validation/Limits)
- **No input validation**: Process all requests as-is
- **No request timeouts**: Let requests run naturally
- **No rate limiting**: Accept all incoming requests
- **JSON repair**: Automatic fixing of malformed JSON
- **Event queue**: Simple in-memory event processing

## 8. Testing Strategy

### 8.1 Unit Tests (Jest + TypeScript)
```typescript
// ifs-sync.service.test.ts
describe('IfsSyncService', () => {
  let service: IfsSyncService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = {
      iFS_Supplier: {
        createMany: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn()
      }
    } as any;
    service = new IfsSyncService(mockPrisma);
  });

  it('should upsert record successfully', async () => {
    mockPrisma.iFS_Supplier.createMany.mockResolvedValue({ count: 1 });

    const result = await service.processData(
      'supplier_info_tab',
      'upsert',
      { rowkey: 'test', name: 'Test Supplier' },
      'org123'
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain('created');
  });
});
```

### 8.2 Integration Tests (Supertest + Mocked Prisma)
```typescript
// ifs-sync.integration.test.ts
import { IfsSyncController } from '../src/ifs-sync.controller';
import { PrismaClient } from '@prisma/client';

describe('IFS Sync API', () => {
  let controller: IfsSyncController;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    // Mock Prisma client
    mockPrisma = {
      iFS_Supplier: {
        createMany: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn()
      },
      iFS_Payment_Address: {
        createMany: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn()
      },
      iFS_Supplier_Document_Tax: {
        createMany: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn()
      }
    } as any;

    // Inject mocked Prisma into controller
    controller = new IfsSyncController(mockPrisma);
  });

  it('should handle upsert request with mocked database', async () => {
    mockPrisma.iFS_Supplier.createMany.mockResolvedValue({ count: 1 });

    const mockReq = {
      body: { action: 'upsert', data: { rowkey: 'test123', name: 'Test Supplier' } },
      organizationId: 'org123',
      params: { table: 'supplier_info_tab' },
      headers: { 'user-agent': 'test', 'content-type': 'application/json' }
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await controller.handleRequest(mockReq as any, mockRes as any, 'supplier_info_tab');

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });
});
```

### 8.3 E2E Tests (Real Database)
```typescript
// e2e/ifs-sync.e2e.test.ts
describe('IFS Sync E2E', () => {
  it('should complete full upsert workflow', async () => {
    // 1. Send upsert request
    // 2. Verify database record created
    // 3. Send update request
    // 4. Verify database record updated
    // 5. Send delete request
    // 6. Verify database record deleted
  });
});
```

## 9. Database Sync Extension

### 9.1 Simple Sync Services
```typescript
// supplier-sync.service.ts
export class SupplierSyncService {
  constructor() {
    // TODO: Add database connections or other dependencies
  }

  async syncSupplier(organizationId: string, rowkey: string, data?: any) {
    try {
      console.log(`Syncing supplier: ${organizationId}/${rowkey}`);

      // TODO: Implement supplier sync logic
      // This is where you would:
      // 1. Read supplier data from source
      // 2. Transform data if needed
      // 3. Write to target database

      console.log(`Supplier sync completed: ${organizationId}/${rowkey}`);
    } catch (error) {
      console.error(`Supplier sync failed: ${organizationId}/${rowkey}`, error);
    }
  }
}

// payment-sync.service.ts
export class PaymentSyncService {
  constructor() {
    // TODO: Add database connections or other dependencies
  }

  async syncPayment(organizationId: string, rowkey: string, data?: any) {
    try {
      console.log(`Syncing payment: ${organizationId}/${rowkey}`);

      // TODO: Implement payment sync logic
      // This is where you would:
      // 1. Read payment data from source
      // 2. Transform data if needed
      // 3. Write to target database

      console.log(`Payment sync completed: ${organizationId}/${rowkey}`);
    } catch (error) {
      console.error(`Payment sync failed: ${organizationId}/${rowkey}`, error);
    }
  }
}
```

### 9.2 Updated sync-event.service.ts (Integration with Sync Services)
```typescript
// sync-event.service.ts
import { EventEmitter } from 'events';
import { SyncEvent } from './types';
import { SupplierSyncService } from './supplier-sync.service';
import { PaymentSyncService } from './payment-sync.service';

export class SyncEventService {
  private eventEmitter = new EventEmitter();
  private eventQueue: SyncEvent[] = [];
  private processing = false;
  private supplierSyncService = new SupplierSyncService();
  private paymentSyncService = new PaymentSyncService();

  constructor() {
    // Register event handlers
    this.setupEventHandlers();
  }

  emitSyncEvent(event: SyncEvent) {
    this.eventQueue.push(event);
    this.eventEmitter.emit('syncEvent', event);

    // Process queue if not already processing
    if (!this.processing) {
      this.processQueue();
    }
  }

  onSyncEvent(handler: (event: SyncEvent) => Promise<void>) {
    this.eventEmitter.on('syncEvent', handler);
  }

  private setupEventHandlers() {
    this.onSyncEvent(async (event) => {
      try {
        console.log(`Processing sync event: ${event.tableName}/${event.rowkey}`);
        await this.performDatabaseSync(event);
      } catch (error) {
        console.error(`Sync event failed: ${event.tableName}/${event.rowkey}`, error);
      }
    });
  }

  private async processQueue() {
    this.processing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        try {
          await this.performDatabaseSync(event);
        } catch (error) {
          console.error('Queue processing error:', error);
        }
      }
    }

    this.processing = false;
  }

  private async performDatabaseSync(event: SyncEvent) {
    switch (event.tableName) {
      case 'supplier_info_tab':
        await this.supplierSyncService.syncSupplier(
          event.organizationId,
          event.rowkey,
          event.data
        );
        break;

      case 'payment_address_tab':
        await this.paymentSyncService.syncPayment(
          event.organizationId,
          event.rowkey,
          event.data
        );
        break;

      case 'supplier_document_tax_info_tab':
        // Tax sync can be handled by supplier sync or separate service
        console.log(`Tax sync not implemented yet: ${event.rowkey}`);
        break;

      default:
        console.log(`No sync handler for table: ${event.tableName}`);
    }
  }
}
```



## 10. Implementation Priority

### 10.1 Phase 1: Core Service (Current)
- ✅ Basic HTTP API with JWT
- ✅ Upsert/Delete operations
- ✅ Logging and error handling
- ✅ JSON repair middleware

### 10.2 Phase 2: Testing & Quality
- 🧪 Implement unit tests
- 🧪 Implement integration tests
- 📊 Add health checks

### 10.3 Phase 3: Sync Extension
- 🔄 Add event-driven sync service
- 🔄 Implement supplier sync logic
- 🔄 Implement payment sync logic
