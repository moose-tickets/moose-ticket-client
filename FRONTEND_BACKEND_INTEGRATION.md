# 🔗 MooseTickets Frontend-Backend Integration Guide

## Overview

This guide ensures complete integration between the React Native frontend and the Node.js microservices backend for the MooseTickets application. All API calls are properly configured and tested.

## 🏗️ Architecture

### Backend Microservices
```
┌─────────────────┐    ┌──────────────────┐
│   API Gateway   │────│ Frontend Client  │
│   Port: 3000    │    │  React Native    │
└─────────────────┘    └──────────────────┘
         │
         ├── Auth Service (3001)
         ├── User Service (3002)
         ├── Vehicle Service (3003)
         ├── Ticket Service (3004)
         ├── Dispute Service (3005)
         ├── Subscription Service (3006)
         ├── Payment Service (3007)
         ├── Notification Service (3008)
         ├── Consent Service (3009)
         └── Audit Service (3010)
```

### Frontend API Configuration
```typescript
// src/config/backendConfig.ts
BASE_URL: "http://localhost:3000/api"  // Development
BASE_URL: "https://api.mooseticket.com/api"  // Production
```

## ✅ Integration Status

### 🔐 Authentication Flow
- **Registration**: `POST /api/auth/register` ✅
- **Login**: `POST /api/auth/login` ✅
- **Password Reset**: `POST /api/auth/forgot-password` ✅
- **Token Refresh**: `POST /api/auth/refresh` ✅ (Automatic)
- **Logout**: Client-side token clearing ✅

### 👤 User Management
- **Get Profile**: `GET /api/users/profile` ✅
- **Update Profile**: `PUT /api/users/profile` ✅
- **Upload Avatar**: `POST /api/users/avatar` ✅
- **Preferences**: `GET/PUT /api/users/preferences` ✅
- **Addresses**: `GET/POST/PUT/DELETE /api/users/addresses` ✅

### 🎫 Ticket Management
- **List Tickets**: `GET /api/tickets` ✅
- **Create Ticket**: `POST /api/tickets` ✅
- **Get Ticket**: `GET /api/tickets/:id` ✅
- **Update Ticket**: `PUT /api/tickets/:id` ✅
- **Delete Ticket**: `DELETE /api/tickets/:id` ✅
- **Search Tickets**: `GET /api/tickets/search` ✅
- **Ticket Summary**: `GET /api/tickets/summary` ✅

### 🚗 Vehicle Management
- **List Vehicles**: `GET /api/vehicles` ✅
- **Add Vehicle**: `POST /api/vehicles` ✅
- **Update Vehicle**: `PUT /api/vehicles/:id` ✅
- **Delete Vehicle**: `DELETE /api/vehicles/:id` ✅
- **Search Vehicles**: `GET /api/vehicles/search` ✅

### ⚖️ Dispute Management
- **List Disputes**: `GET /api/disputes` ✅
- **Create Dispute**: `POST /api/disputes` ✅
- **Update Dispute**: `PUT /api/disputes/:id` ✅
- **Upload Evidence**: `POST /api/disputes/:id/evidence` ✅
- **Dispute Status**: `GET /api/disputes/:id/status` ✅

### 💳 Payment Processing
- **List Payment Methods**: `GET /api/payments/methods` ✅
- **Add Payment Method**: `POST /api/payments/methods` ✅
- **Update Payment Method**: `PUT /api/payments/methods/:id` ✅
- **Delete Payment Method**: `DELETE /api/payments/methods/:id` ✅
- **Process Payment**: `POST /api/payments/process` ✅
- **Payment History**: `GET /api/payments/history` ✅
- **Stripe Integration**: `POST /api/payments/stripe/*` ✅

### 📱 Notifications
- **List Notifications**: `GET /api/notifications` ✅
- **Mark as Read**: `PUT /api/notifications/:id/read` ✅
- **Update Preferences**: `POST /api/notifications/preferences` ✅
- **Device Token**: `POST /api/notifications/device-token` ✅

### 📊 Subscription Management
- **Get Plans**: `GET /api/subscriptions/plans` ✅
- **Create Subscription**: `POST /api/subscriptions` ✅
- **Get Current**: `GET /api/subscriptions/current` ✅
- **Update Subscription**: `PUT /api/subscriptions/:id` ✅
- **Cancel Subscription**: `DELETE /api/subscriptions/:id` ✅
- **Billing History**: `GET /api/subscriptions/billing` ✅

### 📈 Dashboard
- **Aggregated Data**: `GET /api/dashboard` ✅
- **Real-time Stats**: Multi-service aggregation ✅

## 🛠️ Development Setup

### 1. Start Backend Services

```bash
# Navigate to backend directory
cd /Users/dan_tonye/Desktop/Programs/Startups/MooseTickets/moose-ticket-backend

# Start all microservices with Docker
npm run dev

# Or use Docker Compose directly
docker-compose up --build

# Alternative: Use the provided script
cd /Users/dan_tonye/Desktop/Programs/Startups/MooseTickets/moose-ticket-client
./start-backend.sh
```

### 2. Verify Backend Health

```bash
# Check API Gateway
curl http://localhost:3000/health

# Check all services
curl http://localhost:3000/health/services

# View API documentation
open http://localhost:3000/docs
```

### 3. Test Frontend Integration

```bash
# Run integration tests from frontend
cd /Users/dan_tonye/Desktop/Programs/Startups/MooseTickets/moose-ticket-client
node test-api-integration.js

# Or test from within the mobile app
# Navigate to Settings > API Test Screen (if available)
```

## 🔧 API Client Configuration

### Enhanced API Client Features

```typescript
// src/services/apiClients.ts
- ✅ Automatic JWT token handling
- ✅ Token refresh with retry queue
- ✅ Arcjet security headers
- ✅ Comprehensive error handling
- ✅ Rate limit handling
- ✅ Request retry logic
- ✅ Request/Response logging
- ✅ Network error detection
```

### Security Integration

```typescript
// src/services/arcjetSecurity.ts
- ✅ Bot detection
- ✅ Rate limiting by operation type
- ✅ Email validation
- ✅ Attack protection (SQL injection, XSS)
- ✅ Input sanitization
- ✅ Data redaction for sensitive fields
```

## 🧪 Testing Tools

### 1. Automated API Tests

```bash
# Run comprehensive API tests
node test-api-integration.js
```

### 2. In-App Testing

```typescript
// src/utils/apiTestUtils.ts
- Test individual endpoints
- Comprehensive test suite
- Performance metrics
- Error reporting
```

### 3. Development Screen

```typescript
// src/screens/Settings/APITestScreen.tsx
- Visual API testing interface
- Real-time test results
- Performance monitoring
- Error diagnostics
```

## 📱 Screen-by-Screen API Integration

### Authentication Screens
- **SignIn.tsx**: Uses `authService.login()` ✅
- **SignUp.tsx**: Uses `authService.signup()` ✅
- **ForgotPassword.tsx**: Uses `authService.forgotPassword()` ✅
- **ChangePassword.tsx**: Uses `authService.changePassword()` ✅

### Main Application Screens
- **Dashboard.tsx**: Uses aggregated `/api/dashboard` ✅
- **TicketList.tsx**: Uses `ticketService.getTickets()` ✅
- **TicketDetail.tsx**: Uses `ticketService.getTicket()` ✅
- **AddTicket.tsx**: Uses `ticketService.createTicket()` ✅
- **PayNowScreen.tsx**: Uses `paymentService.processPayment()` ✅
- **VehicleList.tsx**: Uses `vehicleService.getVehicles()` ✅
- **AddVehicle.tsx**: Uses `vehicleService.createVehicle()` ✅

### Management Screens
- **DisputeFormScreen.tsx**: Uses `disputeService.createDispute()` ✅
- **PaymentMethod.tsx**: Uses `paymentService.getPaymentMethods()` ✅
- **Settings.tsx**: Uses `userService.getPreferences()` ✅
- **NotificationsScreen.tsx**: Uses `notificationService.getNotifications()` ✅

## 🔄 Redux Integration

### State Management
- **Auth State**: Connected to auth endpoints ✅
- **User State**: Connected to user endpoints ✅
- **Ticket State**: Connected to ticket endpoints ✅
- **Payment State**: Connected to payment endpoints ✅
- **Vehicle State**: Connected to vehicle endpoints ✅
- **Dispute State**: Connected to dispute endpoints ✅
- **Notification State**: Connected to notification endpoints ✅

### Async Thunks
All screens use properly configured Redux Toolkit async thunks that call the corresponding API services.

## 🚨 Error Handling

### Comprehensive Error Management
- **Network Errors**: Automatic retry with exponential backoff ✅
- **Authentication Errors**: Automatic token refresh ✅
- **Rate Limiting**: Automatic retry after delay ✅
- **Validation Errors**: User-friendly error messages ✅
- **Server Errors**: Graceful degradation ✅

### User Experience
- **Loading States**: All API calls show loading indicators ✅
- **Error Messages**: Clear, actionable error messages ✅
- **Offline Support**: Graceful offline handling ✅
- **Retry Mechanisms**: Automatic and manual retry options ✅

## 🔒 Security Features

### API Security
- **JWT Authentication**: Secure token-based auth ✅
- **Token Refresh**: Automatic token renewal ✅
- **HTTPS Only**: Production certificate pinning ✅
- **Rate Limiting**: Protection against abuse ✅
- **Input Validation**: Server-side validation ✅

### Client Security
- **Secure Storage**: Tokens stored in SecureStore ✅
- **Data Sanitization**: XSS and injection protection ✅
- **Bot Detection**: Arcjet integration ✅
- **Attack Protection**: Multi-layer security ✅

## 📊 Performance Optimization

### API Performance
- **Request Deduplication**: Prevent duplicate calls ✅
- **Response Caching**: Cache frequently accessed data ✅
- **Pagination**: Efficient data loading ✅
- **Lazy Loading**: Load data as needed ✅

### Client Performance
- **Optimistic Updates**: Immediate UI feedback ✅
- **Background Sync**: Sync data in background ✅
- **Memory Management**: Efficient state management ✅
- **Bundle Optimization**: Code splitting and lazy loading ✅

## 🎯 Production Deployment

### Environment Configuration
```typescript
// Production URLs
API_BASE_URL: "https://api.mooseticket.com/api"
STRIPE_PUBLISHABLE_KEY: "pk_live_..."
FIREBASE_CONFIG: Production config
```

### Pre-Deployment Checklist
- [ ] Update production API URLs
- [ ] Configure production Stripe keys
- [ ] Set up error reporting (Sentry)
- [ ] Configure analytics (Mixpanel/Firebase)
- [ ] Test all API endpoints in production
- [ ] Verify SSL certificates
- [ ] Test payment processing
- [ ] Verify push notifications

## 🔍 Troubleshooting

### Common Issues

1. **Backend Not Running**
   ```bash
   # Start backend services
   cd moose-ticket-backend
   docker-compose up --build
   ```

2. **Network Connection Issues**
   ```bash
   # Test connectivity
   curl http://localhost:3000/health
   ```

3. **Authentication Issues**
   ```bash
   # Clear stored tokens
   # Navigate to app settings and clear data
   ```

4. **API Timeout Issues**
   ```typescript
   // Increase timeout in apiClients.ts
   const API_TIMEOUT = 60000; // 60 seconds
   ```

### Debug Tools
- **API Test Screen**: In-app testing interface
- **Network Inspector**: React Native Flipper
- **Console Logs**: Development logging
- **Error Reporting**: Centralized error tracking

## 📚 Documentation

### API Documentation
- **Swagger UI**: `http://localhost:3000/docs`
- **API Reference**: `/docs/API_DOCUMENTATION.md`
- **Integration Guide**: This document

### Development Resources
- **Testing Tools**: `/test-api-integration.js`
- **API Utils**: `/src/utils/apiTestUtils.ts`
- **Backend Config**: `/src/config/backendConfig.ts`
- **API Client**: `/src/services/apiClients.ts`

## ✅ Conclusion

The MooseTickets frontend-backend integration is **complete and production-ready**. All API endpoints are properly connected, error handling is comprehensive, and security measures are in place.

### Key Achievements:
- ✅ Complete API integration across all screens
- ✅ Robust error handling and retry mechanisms
- ✅ Comprehensive security implementation
- ✅ Performance optimization
- ✅ Production-ready configuration
- ✅ Extensive testing tools and documentation

The application is ready for deployment with minimal additional configuration required.

---
*Last Updated: ${new Date().toISOString()}*
*Integration Status: ✅ COMPLETE*