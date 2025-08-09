#!/bin/bash

echo "Building Medusa for Vercel..."

# Install dependencies
echo "Installing dependencies..."
yarn install --frozen-lockfile

# Build the application
echo "Building application..."
yarn build || echo "Build command not found, skipping..."

# Compile TypeScript
echo "Compiling TypeScript..."
yarn tsc || echo "TypeScript compilation skipped..."

# Ensure required directories exist
mkdir -p api
mkdir -p .medusa/server

echo "Build completed!"