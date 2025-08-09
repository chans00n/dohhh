#!/bin/bash

echo "Building Medusa for Vercel..."

# Build the application
yarn build

# Ensure the output directory exists
mkdir -p .medusa/server

echo "Build completed!"