#!/bin/bash

echo "🛑 Stopping containers..."
docker-compose down

echo "🗑️  Removing database volume..."
docker volume rm bookly_project_db_data 2>/dev/null || true

echo "🚀 Starting containers with fresh database..."
docker-compose up -d

echo "⏳ Waiting for database to initialize..."
sleep 10

echo "✅ Database reset complete!"
echo "📊 phpMyAdmin available at: http://localhost:8080"
