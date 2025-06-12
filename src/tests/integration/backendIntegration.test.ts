// src/tests/integration/backendIntegration.test.ts
/**
 * Integration Tests for Mobile App <-> Backend API
 * 
 * This test suite verifies that the mobile app services can successfully
 * communicate with the backend microservices through the API Gateway.
 */

import authService from '../../services/authService';
import userService from '../../services/userService';
import vehicleService from '../../services/vehicleService';
import ticketService from '../../services/ticketService';
import paymentService from '../../services/paymentService';
import notificationService from '../../services/notificationService';
import disputeService from '../../services/disputeService';
import subscriptionService from '../../services/subscriptionService';
import consentService from '../../services/consentService';

// Test configuration
const TEST_CONFIG = {
  apiUrl: __DEV__ ? 'http://localhost:3000/api' : 'https://api.mooseticket.com/api',
  timeout: 30000,
  retries: 3,
};

// Test user data
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  fullName: 'Test User',
  phone: '+15551234567',
  licenseNumber: 'ABC123',
};

const TEST_VEHICLE = {
  licensePlate: 'TEST123',
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  color: 'Blue',
  state: 'ON',
};

// Test utilities
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = TEST_CONFIG.retries
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries) {
        console.log(`Attempt ${i + 1} failed, retrying...`);
        await delay(1000 * Math.pow(2, i)); // Exponential backoff
      }
    }
  }
  
  throw lastError!;
};

describe('Backend Integration Tests', () => {
  let authToken: string;
  let testUserId: string;
  let testVehicleId: string;
  let testTicketId: string;
  let testDisputeId: string;

  beforeAll(async () => {
    // Increase timeout for integration tests
    jest.setTimeout(TEST_CONFIG.timeout);
  });

  describe('Authentication Service Integration', () => {
    test('should connect to auth service and get OAuth status', async () => {
      const result = await withRetry(() => authService.getOAuthStatus());
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.oauth).toBeDefined();
    });

    test('should register a new user account', async () => {
      const signUpData = {
        ...TEST_USER,
        confirmPassword: TEST_USER.password,
      };

      const result = await withRetry(() => authService.signup(signUpData));
      
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data?.user).toBeDefined();
        expect(result.data?.token).toBeDefined();
        
        authToken = result.data!.token;
        testUserId = result.data!.user.id;
      } else {
        // If user already exists, try to login
        if (result.message?.includes('already exists')) {
          const loginResult = await withRetry(() => authService.login({
            email: TEST_USER.email,
            password: TEST_USER.password,
          }));
          
          expect(loginResult.success).toBe(true);
          authToken = loginResult.data!.token;
          testUserId = loginResult.data!.user.id;
        } else {
          throw new Error(`Signup failed: ${result.message}`);
        }
      }
    });

    test('should authenticate user with valid credentials', async () => {
      const result = await withRetry(() => authService.login({
        email: TEST_USER.email,
        password: TEST_USER.password,
      }));
      
      expect(result.success).toBe(true);
      expect(result.data?.token).toBeDefined();
      expect(result.data?.user).toBeDefined();
      
      authToken = result.data!.token;
      testUserId = result.data!.user.id;
    });

    test('should get current user profile', async () => {
      const result = await withRetry(() => authService.getCurrentUser());
      
      expect(result.success).toBe(true);
      expect(result.data?.email).toBe(TEST_USER.email);
    });
  });

  describe('User Service Integration', () => {
    test('should get user profile', async () => {
      const result = await withRetry(() => userService.getProfile());
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should update user profile', async () => {
      const updateData = {
        fullName: 'Updated Test User',
        phone: '+15559876543',
      };

      const result = await withRetry(() => userService.updateProfile(updateData));
      
      expect(result.success).toBe(true);
      expect(result.data?.fullName).toBe(updateData.fullName);
    });

    test('should get user preferences', async () => {
      const result = await withRetry(() => userService.getPreferences());
      
      // May return empty preferences for new user
      expect(result.success).toBe(true);
    });
  });

  describe('Vehicle Service Integration', () => {
    test('should create a new vehicle', async () => {
      const result = await withRetry(() => vehicleService.createVehicle(TEST_VEHICLE));
      
      expect(result.success).toBe(true);
      expect(result.data?.licensePlate).toBe(TEST_VEHICLE.licensePlate);
      
      testVehicleId = result.data!.id;
    });

    test('should get user vehicles', async () => {
      const result = await withRetry(() => vehicleService.getVehicles());
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    test('should validate license plate format', async () => {
      const result = await withRetry(() => 
        vehicleService.validateCanadianPlate('ABC123', 'ON')
      );
      
      expect(result.success).toBe(true);
    });

    test('should decode VIN number', async () => {
      const testVIN = 'JHMCM56557C404453'; // Sample Honda VIN
      
      const result = await withRetry(() => vehicleService.decodeVIN(testVIN));
      
      // VIN decoding may fail if external service is unavailable
      if (result.success) {
        expect(result.data).toBeDefined();
      }
    });
  });

  describe('Ticket Service Integration', () => {
    test('should create a new ticket', async () => {
      const ticketData = {
        licensePlate: TEST_VEHICLE.licensePlate,
        violationType: 'Parking',
        violationCode: 'P001',
        issueDate: new Date().toISOString(),
        location: '123 Test Street',
        city: 'Toronto',
        state: 'ON',
        postalCode: 'M5V 3A8',
        fineAmount: 50.00,
        notes: 'Test ticket for integration testing',
      };

      const result = await withRetry(() => ticketService.createTicket(ticketData));
      
      expect(result.success).toBe(true);
      expect(result.data?.licensePlate).toBe(ticketData.licensePlate);
      
      testTicketId = result.data!.id;
    });

    test('should get user tickets', async () => {
      const result = await withRetry(() => ticketService.getTickets());
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    test('should get ticket statistics', async () => {
      const result = await withRetry(() => ticketService.getTicketStats());
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should export tickets', async () => {
      const result = await withRetry(() => ticketService.exportTickets('json'));
      
      expect(result.success).toBe(true);
    });
  });

  describe('Payment Service Integration', () => {
    test('should get available payment plans', async () => {
      const result = await withRetry(() => paymentService.getAvailablePaymentPlans());
      
      expect(result.success).toBe(true);
    });

    test('should create payment intent', async () => {
      const result = await withRetry(() => 
        paymentService.createPaymentIntent(50.00, 'CAD')
      );
      
      expect(result.success).toBe(true);
      expect(result.data?.amount).toBe(5000); // Amount in cents
    });

    test('should get payment methods', async () => {
      const result = await withRetry(() => paymentService.getPaymentMethods());
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    test('should get payment analytics', async () => {
      const result = await withRetry(() => paymentService.getPaymentAnalytics());
      
      expect(result.success).toBe(true);
    });
  });

  describe('Notification Service Integration', () => {
    test('should get user notifications', async () => {
      const result = await withRetry(() => notificationService.getNotifications());
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    test('should get unread notification count', async () => {
      const result = await withRetry(() => notificationService.getUnreadCount());
      
      expect(result.success).toBe(true);
      expect(typeof result.data?.count).toBe('number');
    });

    test('should get notification settings', async () => {
      const result = await withRetry(() => notificationService.getNotificationSettings());
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should get notification templates', async () => {
      const result = await withRetry(() => notificationService.getNotificationTemplates());
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Dispute Service Integration', () => {
    test('should create a new dispute', async () => {
      if (!testTicketId) {
        console.log('Skipping dispute test - no test ticket available');
        return;
      }

      const disputeData = {
        ticketId: testTicketId,
        reason: 'Incorrect information',
        reasonCode: 'INFO_ERROR',
        description: 'The ticket contains incorrect vehicle information. This is a test dispute for integration testing.',
        contactEmail: TEST_USER.email,
      };

      const result = await withRetry(() => disputeService.createDispute(disputeData));
      
      expect(result.success).toBe(true);
      expect(result.data?.ticketId).toBe(testTicketId);
      
      testDisputeId = result.data!.id;
    });

    test('should get user disputes', async () => {
      const result = await withRetry(() => disputeService.getDisputes());
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    test('should get dispute statistics', async () => {
      const result = await withRetry(() => disputeService.getDisputeStats());
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('Subscription Service Integration', () => {
    test('should get subscription plans', async () => {
      const result = await withRetry(() => subscriptionService.getSubscriptionPlans());
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    test('should get current subscription', async () => {
      const result = await withRetry(() => subscriptionService.getCurrentSubscription());
      
      // User may not have a subscription
      if (result.success) {
        expect(result.data).toBeDefined();
      }
    });

    test('should validate promo code', async () => {
      const result = await withRetry(() => 
        subscriptionService.validatePromoCode('INVALID_CODE')
      );
      
      // Should handle invalid promo codes gracefully
      expect(typeof result.success).toBe('boolean');
    });

    test('should get usage analytics', async () => {
      const result = await withRetry(() => subscriptionService.getUsageAnalytics());
      
      expect(result.success).toBe(true);
    });
  });

  describe('Consent Service Integration', () => {
    test('should get current policies', async () => {
      const result = await withRetry(() => consentService.getCurrentPolicies());
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    test('should get consent status', async () => {
      const result = await withRetry(() => consentService.getConsentStatus());
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should give consent for privacy policy', async () => {
      const consentData = {
        policyType: 'privacy_policy',
        policyVersion: '1.0',
        consentGiven: true,
        metadata: {
          source: 'integration_test',
          userAgent: 'Jest Test Runner',
        },
      };

      const result = await withRetry(() => consentService.giveConsent(consentData));
      
      expect(result.success).toBe(true);
      expect(result.data?.consentGiven).toBe(true);
    });

    test('should get consent history', async () => {
      const result = await withRetry(() => consentService.getConsentHistory());
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Dashboard Aggregation', () => {
    test('should get dashboard data', async () => {
      // Test the API Gateway dashboard aggregation endpoint
      const result = await withRetry(async () => {
        const response = await fetch(`${TEST_CONFIG.apiUrl.replace('/api', '')}/api/dashboard`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        return response.json();
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.tickets).toBeDefined();
      expect(result.data.vehicles).toBeDefined();
      expect(result.data.disputes).toBeDefined();
      expect(result.data.subscription).toBeDefined();
    });
  });

  // Cleanup after tests
  afterAll(async () => {
    console.log('Cleaning up test data...');
    
    try {
      // Delete test dispute if created
      if (testDisputeId) {
        await disputeService.deleteDispute(testDisputeId);
      }
      
      // Delete test ticket if created
      if (testTicketId) {
        await ticketService.deleteTicket(testTicketId);
      }
      
      // Delete test vehicle if created
      if (testVehicleId) {
        await vehicleService.deleteVehicle(testVehicleId);
      }
      
      console.log('Test cleanup completed');
    } catch (error) {
      console.warn('Some cleanup operations failed:', error);
    }
  });
});

// Test environment health check
describe('Backend Health Check', () => {
  test('should verify API Gateway is running', async () => {
    const result = await withRetry(async () => {
      const response = await fetch(`${TEST_CONFIG.apiUrl.replace('/api', '')}/health`);
      return response.json();
    });
    
    expect(result.success).toBe(true);
  });

  test('should verify all microservices are healthy', async () => {
    const result = await withRetry(async () => {
      const response = await fetch(`${TEST_CONFIG.apiUrl.replace('/api', '')}/health/services`);
      return response.json();
    });
    
    expect(result.success).toBe(true);
    expect(result.data.overall).toBe('healthy');
  });
});

export default {};