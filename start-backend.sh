#!/bin/bash

# MooseTickets Backend Starter Script
# This script helps start the backend services for development

echo "🚀 MooseTickets Backend Starter"
echo "================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Navigate to backend directory
BACKEND_DIR="../moose-ticket-backend"

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found at: $BACKEND_DIR"
    echo "   Please ensure the backend is in the correct location."
    exit 1
fi

echo "📁 Found backend directory: $BACKEND_DIR"
cd "$BACKEND_DIR"

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found in backend directory"
    exit 1
fi

echo "📋 Found docker-compose.yml"

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker."
    exit 1
fi

echo "✅ Docker daemon is running"

# Start the services
echo ""
echo "🏗️  Starting MooseTickets backend services..."
echo "   This may take a few minutes for the first run..."
echo ""

# Use docker compose if available, fallback to docker-compose
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Start services with build flag
if $COMPOSE_CMD up --build -d; then
    echo ""
    echo "✅ Backend services started successfully!"
    echo ""
    echo "📊 Service Status:"
    echo "=================="
    
    # Wait a moment for services to start
    sleep 5
    
    # Check service health
    services=(
        "API Gateway:http://localhost:3000/health"
        "Auth Service:http://localhost:3001/health"
        "User Service:http://localhost:3002/health"
        "Vehicle Service:http://localhost:3003/health"
        "Ticket Service:http://localhost:3004/health"
        "Dispute Service:http://localhost:3005/health"
        "Subscription Service:http://localhost:3006/health"
        "Payment Service:http://localhost:3007/health"
        "Notification Service:http://localhost:3008/health"
        "Consent Service:http://localhost:3009/health"
        "Audit Service:http://localhost:3010/health"
    )
    
    for service in "${services[@]}"; do
        name=$(echo $service | cut -d: -f1)
        url=$(echo $service | cut -d: -f2-)
        
        if curl -f -s "$url" > /dev/null 2>&1; then
            echo "✅ $name - Running"
        else
            echo "⏳ $name - Starting..."
        fi
    done
    
    echo ""
    echo "🔗 Important URLs:"
    echo "=================="
    echo "• API Gateway: http://localhost:3000"
    echo "• API Documentation: http://localhost:3000/docs"
    echo "• Health Check: http://localhost:3000/health"
    echo "• Services Health: http://localhost:3000/health/services"
    echo ""
    echo "💾 Database URLs:"
    echo "=================="
    echo "• MongoDB: mongodb://admin:password123@localhost:27017/mooseticket"
    echo "• Redis: redis://localhost:6379 (password: redispassword123)"
    echo "• RabbitMQ Management: http://localhost:15672 (admin/password123)"
    echo ""
    echo "🧪 To test the API integration:"
    echo "==============================="
    echo "1. Open the MooseTickets mobile app"
    echo "2. Navigate to Settings > API Test (if available)"
    echo "3. Or run: cd moose-ticket-client && node test-api-integration.js"
    echo ""
    echo "🛑 To stop the backend:"
    echo "======================"
    echo "   cd $BACKEND_DIR && $COMPOSE_CMD down"
    echo ""
    echo "📊 To view logs:"
    echo "==============="
    echo "   cd $BACKEND_DIR && $COMPOSE_CMD logs -f [service-name]"
    echo ""
    echo "🎉 Backend is ready for development!"
    
else
    echo "❌ Failed to start backend services"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "==================="
    echo "1. Check Docker daemon is running: docker info"
    echo "2. Check for port conflicts: lsof -i :3000-3010"
    echo "3. View detailed logs: $COMPOSE_CMD logs"
    echo "4. Clean start: $COMPOSE_CMD down && $COMPOSE_CMD up --build"
    exit 1
fi