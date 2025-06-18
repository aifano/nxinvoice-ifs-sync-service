# NXInvoice IFS Sync Service

## Project Overview
This is a Node.js/TypeScript microservice designed to synchronize data between the NXInvoice system and IFS (Industrial and Financial Systems) ERP. The service handles bidirectional data synchronization for supplier information, payment addresses, and document tax information between the two systems.

## Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Jest with ts-jest
- **Build**: TypeScript compiler (tsc)
- **Containerization**: Docker

## Architecture

### Core Components
1. **Express API Server** (`src/index.ts`)
   - Single endpoint service listening on configurable port (default: 13000)
   - JSON payload handling with error management
   - Centralized error handling for malformed JSON

2. **IFS Sync Router** (`src/routes/ifs-sync.ts`)
   - RESTful endpoint: `POST /ifs-sync/v1/:table`
   - Handles CRUD operations (insert, update, upsert, delete) for IFS tables
   - Dynamic table routing with validation

3. **Sync Service** (`src/services/ifs.ts`)
   - Core business logic for data synchronization
   - SQL statement generation and logging
   - Comprehensive Prisma error mapping
   - File-based SQL audit logging

### Database Schema
The service manages three main IFS-related tables:
- `__ifs_suppliers` - Supplier master data
- `__ifs_supplier_document_taxes` - Tax information for suppliers
- `__ifs_payment_addresses` - Payment address information

Each table uses a composite unique key (`rowkey`, `organization_id`) for conflict resolution.

### Data Flow
1. External IFS system sends HTTP POST requests
2. Service validates table name and action
3. Appropriate schema operations are executed via Prisma
4. SQL statements are logged to daily files (`logs/ifs-{date}.sql`)
5. Response status and message returned to caller

## Directory Structure
```
/root/nxinvoice-ifs-sync-service/
├── src/
│   ├── index.ts                     # Main application entry point
│   ├── routes/
│   │   └── ifs-sync.ts             # API route handlers
│   ├── services/
│   │   └── ifs.ts                  # Core sync business logic
│   ├── schema/                     # Table-specific operations
│   │   ├── supplierInfoTab.ts      # Supplier data operations
│   │   ├── supplierDocumentTaxInfoTab.ts # Tax info operations
│   │   └── paymentAddressTab.ts    # Payment address operations
│   └── utilities/
│       ├── config.ts               # Environment configuration
│       └── prisma.ts               # Prisma client instance
├── prisma/
│   ├── schema.prisma               # Database schema definition
│   └── views/
│       └── public/
│           └── user_notifications.sql # Database view
├── tests/                          # Test directory (currently empty)
├── dist/                          # Compiled JavaScript output
├── logs/                          # SQL audit logs (runtime generated)
├── Dockerfile                     # Container configuration
├── package.json                   # Node.js dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
└── jest.config.json              # Jest test configuration
```

## Available Scripts
```bash
npm run dev      # Start development server with ts-node and dotenv
npm run build    # Compile TypeScript to JavaScript
npm start        # Run compiled application
npm test         # Run Jest test suite
```

## Configuration
- **PORT**: Server port (default: 13000)
- **POSTGRES_PRISMA_URL**: PostgreSQL connection string for Prisma
- **POSTGRES_URL_NON_POOLING**: Direct PostgreSQL connection (non-pooled)

## Key Features
1. **Multi-table Support**: Handles three different IFS table types
2. **CRUD Operations**: Full support for insert, update, upsert, and delete
3. **Conflict Resolution**: Upsert operations with composite key handling
4. **Audit Logging**: All SQL operations logged with timestamps
5. **Error Handling**: Comprehensive Prisma error mapping to HTTP status codes
6. **Data Validation**: Schema-based validation through Prisma types

## Development Guidelines

### Code Organization
- **Schema Operations**: Each IFS table has its own operations file in `src/schema/`
- **Type Safety**: Full TypeScript with Prisma-generated types
- **Error Handling**: Centralized error mapping in `services/ifs.ts`
- **Configuration**: Environment-based configuration in `utilities/config.ts`

### Database Patterns
- **Naming Convention**: IFS tables prefixed with `__ifs_`
- **Unique Constraints**: Composite keys (`rowkey`, `organization_id`)
- **Soft Deletes**: Not implemented - hard deletes used
- **Relationships**: Foreign key relationships to main organization table

### API Design
- **RESTful**: Single POST endpoint with table parameter
- **Payload Format**: `{ action: string, data: object }`
- **Response Format**: `{ status: string }` with HTTP status codes
- **Validation**: Table name and action validation before processing

### Testing Setup
- **Framework**: Jest with ts-jest preset
- **Environment**: Node.js test environment
- **Pattern**: Test files in `tests/` directory with `.test.ts` extension
- **Configuration**: Isolated modules with disabled diagnostics for performance

### Docker Deployment
- **Base Image**: node:current-alpine
- **Build Process**: Multi-stage with dependency installation and TypeScript compilation
- **Port**: Exposes port 3000
- **Prisma**: Client generation included in build process

## Error Handling
The service includes comprehensive error handling:
- **P2025**: Record not found (404)
- **P2002**: Duplicate resource (409)
- **P2003**: Related resource missing (409)
- **Validation Errors**: Prisma validation failures (422)
- **Server Errors**: Database connection and internal errors (500)

## Logging
- **SQL Audit**: All operations logged to `logs/ifs-{date}.sql`
- **Format**: `/* timestamp */ SQL_STATEMENT -- result_message`
- **Console**: Error logging with request context

## Security Considerations
- No authentication/authorization implemented
- SQL injection protection through Prisma parameterized queries
- JSON payload validation and error handling
- Input validation through TypeScript types and Prisma schema

This service is designed as an internal microservice for data synchronization and should be deployed within a secure network environment with appropriate access controls.