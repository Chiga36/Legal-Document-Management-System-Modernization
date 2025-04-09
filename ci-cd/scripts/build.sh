#!/bin/bash

# Build script for Legal Document Management System

# Step 1: Build Docker images
echo "Building Docker images..."
docker build -t legal-dms-backend ./backend

docker build -t legal-dms-frontend ./frontend

# Step 2: Tag images with version
echo "Tagging images with version..."
VERSION=$(date +%Y%m%d%H%M%S)
docker tag legal-dms-backend:latest legal-dms-backend:$VERSION
docker tag legal-dms-frontend:latest legal-dms-frontend:$VERSION

# Step 3: Push images to Docker registry
echo "Pushing images to Docker registry..."
docker push legal-dms-backend:$VERSION
docker push legal-dms-frontend:$VERSION

# Step 4: Notify completion
echo "Build process completed successfully."
