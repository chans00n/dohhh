#!/bin/bash

# Run Medusa migrations with explicit database URL
# This script helps initialize the Supabase database

echo "Running Medusa database migrations..."

# Export the database URL
export DATABASE_URL="postgresql://postgres:B00bies0980!@db.whycrwrascteduazhmyu.supabase.co:5432/postgres?sslmode=require"

# Run migrations
yarn medusa db:migrate

echo "Migrations complete!"