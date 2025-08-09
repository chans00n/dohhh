# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Medusa e-commerce project with two main components:

- **dohhh/**: Medusa backend server (v2)
- **dohhh-storefront/**: Next.js 15 storefront using App Router

## Development Commands

### Backend (dohhh/)
```bash
# Install dependencies
yarn

# Start development server (port 9000)
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Run database seed
yarn seed

# Run tests
yarn test:integration:http  # HTTP integration tests
yarn test:integration:modules  # Module integration tests
yarn test:unit  # Unit tests
```

### Frontend (dohhh-storefront/)
```bash
# Install dependencies
yarn

# Start development server with Turbopack (port 8000)
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Run linting
yarn lint

# Analyze bundle size
yarn analyze
```

## Architecture Overview

### Backend Architecture (dohhh/)
The backend uses Medusa v2 framework with modular architecture:

- **src/api/**: HTTP route handlers for admin and store endpoints
- **src/modules/**: Custom commerce modules extending Medusa functionality
- **src/workflows/**: Business logic workflows using Medusa's workflow engine
- **src/subscribers/**: Event subscribers for async operations
- **src/jobs/**: Background job processors
- **src/scripts/**: Utility scripts (e.g., database seeding)
- **medusa-config.ts**: Core configuration for database, CORS, and authentication

The backend uses PostgreSQL with MikroORM for database operations.

### Frontend Architecture (dohhh-storefront/)
Next.js 15 App Router structure with server components:

- **src/app/[countryCode]/**: Country-specific routing for internationalization
  - **(main)/**: Main store pages (products, cart, account)
  - **(checkout)/**: Checkout flow with separate layout
- **src/modules/**: Feature-specific UI modules
  - Each module contains components and templates
  - Follows container/presentation component pattern
- **src/lib/**: Core utilities and data fetching
  - **data/**: Server-side data fetching functions using Medusa SDK
  - **config.ts**: Medusa SDK configuration
  - **hooks/**: Custom React hooks
  - **util/**: Helper functions

Key architectural decisions:
- Server Components by default for better performance
- Server Actions for mutations
- Parallel data fetching using Next.js caching
- Tailwind CSS with Medusa UI preset for styling
- TypeScript throughout for type safety

## Environment Configuration

### Backend (.env)
```bash
DATABASE_URL=           # PostgreSQL connection string
STORE_CORS=            # Frontend URL (e.g., http://localhost:8000)
ADMIN_CORS=            # Admin dashboard URLs
AUTH_CORS=             # Authentication service URLs
JWT_SECRET=            # JWT signing secret
COOKIE_SECRET=         # Cookie encryption secret
```

### Frontend (.env.local)
```bash
MEDUSA_BACKEND_URL=    # Backend URL (default: http://localhost:9000)
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=  # Medusa publishable API key
NEXT_PUBLIC_STRIPE_KEY=              # Stripe publishable key for payments
```

## Testing Strategy

- Backend: Jest with separate test suites for HTTP endpoints, modules, and unit tests
- Frontend: Component testing with React Testing Library (when implemented)
- Integration tests run against a test database

## Key Integration Points

1. **Medusa JS SDK**: Frontend communicates with backend via @medusajs/js-sdk
2. **Payment Processing**: Stripe integration configured in both frontend and backend
3. **Image Handling**: Configured for local development and S3 in production
4. **CORS**: Properly configured for local development cross-origin requests