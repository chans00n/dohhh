# DOHHH - Cookie Fundraising Platform

A modern e-commerce platform built with Medusa v2 for cookie fundraising campaigns.

## Project Structure

```
.
├── dohhh/                    # Backend (Medusa server)
└── dohhh-storefront/         # Frontend (Next.js storefront)
```

## Features

- **Fundraising Campaigns**: Create and manage fundraising campaigns with goals and progress tracking
- **Cookie Products**: Sell various cookie products with multiple pack size variants
- **Real-time Analytics**: Track campaign progress, contributions, and backers in real-time
- **Admin Dashboard**: Comprehensive admin interface for campaign and order management
- **Modern UI**: Dark mode support with responsive design

## Tech Stack

### Backend (dohhh/)
- Medusa v2.8.8
- PostgreSQL
- TypeScript
- MikroORM

### Frontend (dohhh-storefront/)
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Medusa JS SDK

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Yarn

### Backend Setup

```bash
cd dohhh
yarn install
cp .env.example .env
# Configure your database and other settings in .env
yarn medusa db:migrate
yarn seed
yarn dev
```

### Frontend Setup

```bash
cd dohhh-storefront
yarn install
cp .env.local.example .env.local
# Configure your backend URL in .env.local
yarn dev
```

## Deployment

### Vercel Deployment

Both the backend and frontend can be deployed to Vercel:

1. **Backend**: Deploy the `dohhh` directory as a Vercel Function
2. **Frontend**: Deploy the `dohhh-storefront` directory as a Next.js app

Make sure to set the appropriate environment variables in your Vercel projects.

## License

This project is proprietary and confidential.