#!/bin/bash

# Deployment script for Legal Document Management System

# Step 1: Pull Docker images
echo "Pulling Docker images..."
docker pull legal-dms-backend:latest
docker pull legal-dms-frontend:latest

# Step 2: Deploy using Kubernetes
echo "Deploying application using Kubernetes..."
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-service.yaml

# Step 3: Verify deployment
echo "Verifying deployment..."
kubectl get pods
kubectl get services

# Step 4: Notify completion
echo "Deployment process completed successfully."
