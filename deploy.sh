#!/bin/bash

# Exit on error
set -e

# Install Railway CLI
echo "Installing Railway CLI..."
npm i -g @railway/cli

# Login to Railway
echo "Logging in to Railway..."
railway login

# Link the project to Railway
echo "Linking the project to Railway..."
railway link

# Deploy the project
echo "Deploying the project..."
railway up