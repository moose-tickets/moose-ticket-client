// src/utils/apiTestUtils.ts
/**
 * API Integration Test Utilities
 * 
 * This utility provides methods to test API integration
 * from within the React Native app for debugging purposes
 */

import apiClient from '../services/apiClients';
import authService from '../services/authService';
import ticketService from '../services/ticketService';
import paymentService from '../services/paymentService';
import userService from '../services/userService';
import vehicleService from '../services/vehicleService';

export interface APITestResult {
  endpoint: string;
  method: string;
  success: boolean;
  status?: number;
  error?: string;
  responseTime: number;
}

class APITestUtils {
  private results: APITestResult[] = [];

  /**
   * Test a single API endpoint
   */
  private async testEndpoint(
    endpoint: string,
    method: string,
    testFunction: () => Promise<any>
  ): Promise<APITestResult> {
    const startTime = Date.now();
    
    try {
      const response = await testFunction();
      const responseTime = Date.now() - startTime;
      
      const result: APITestResult = {
        endpoint,
        method,
        success: true,
        status: response?.status || 200,
        responseTime
      };
      
      this.results.push(result);
      return result;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      const result: APITestResult = {
        endpoint,
        method,
        success: false,
        status: error.response?.status,
        error: error.message || 'Unknown error',
        responseTime
      };
      
      this.results.push(result);
      return result;
    }
  }

  /**
   * Test authentication endpoints
   */
  async testAuthEndpoints(): Promise<APITestResult[]> {
    console.log('🔐 Testing Authentication Endpoints...');
    
    const testCredentials = {
      email: 'test@mooseticket.com',
      password: 'TestPassword123!',
      fullName: 'Test User',
      phone: '+15551234567'
    };

    const authTests = [
      {
        endpoint: '/api/auth/register',
        method: 'POST',
        test: () => authService.signup({
          ...testCredentials,
          confirmPassword: testCredentials.password,
          agreeToTerms: true,
          agreeToPrivacy: true
        })
      },
      {
        endpoint: '/api/auth/login',
        method: 'POST',
        test: () => authService.login({
          email: testCredentials.email,
          password: testCredentials.password
        })
      }
    ];

    const results = [];
    for (const test of authTests) {
      const result = await this.testEndpoint(test.endpoint, test.method, test.test);
      results.push(result);
    }

    return results;
  }

  /**
   * Test user profile endpoints
   */
  async testUserEndpoints(): Promise<APITestResult[]> {
    console.log('👤 Testing User Endpoints...');
    
    const userTests = [
      {
        endpoint: '/api/users/profile',
        method: 'GET',
        test: () => userService.getProfile()
      },
      {
        endpoint: '/api/users/preferences',
        method: 'GET',
        test: () => userService.getPreferences()
      }
    ];

    const results = [];
    for (const test of userTests) {
      const result = await this.testEndpoint(test.endpoint, test.method, test.test);
      results.push(result);
    }

    return results;
  }

  /**
   * Test ticket endpoints
   */
  async testTicketEndpoints(): Promise<APITestResult[]> {
    console.log('🎫 Testing Ticket Endpoints...');
    
    const ticketTests = [
      {
        endpoint: '/api/tickets',
        method: 'GET',
        test: () => ticketService.getTickets()
      },
      {
        endpoint: '/api/tickets/summary',
        method: 'GET',
        test: () => ticketService.getTicketSummary()
      }
    ];

    const results = [];
    for (const test of ticketTests) {
      const result = await this.testEndpoint(test.endpoint, test.method, test.test);
      results.push(result);
    }

    return results;
  }

  /**
   * Test vehicle endpoints
   */
  async testVehicleEndpoints(): Promise<APITestResult[]> {
    console.log('🚗 Testing Vehicle Endpoints...');
    
    const vehicleTests = [
      {
        endpoint: '/api/vehicles',
        method: 'GET',
        test: () => vehicleService.getVehicles()
      }
    ];

    const results = [];
    for (const test of vehicleTests) {
      const result = await this.testEndpoint(test.endpoint, test.method, test.test);
      results.push(result);
    }

    return results;
  }

  /**
   * Test payment endpoints
   */
  async testPaymentEndpoints(): Promise<APITestResult[]> {
    console.log('💳 Testing Payment Endpoints...');
    
    const paymentTests = [
      {
        endpoint: '/api/payments/methods',
        method: 'GET',
        test: () => paymentService.getPaymentMethods()
      }
    ];

    const results = [];
    for (const test of paymentTests) {
      const result = await this.testEndpoint(test.endpoint, test.method, test.test);
      results.push(result);
    }

    return results;
  }

  /**
   * Test dashboard endpoint
   */
  async testDashboardEndpoint(): Promise<APITestResult> {
    console.log('📊 Testing Dashboard Endpoint...');
    
    return await this.testEndpoint(
      '/api/dashboard',
      'GET',
      () => apiClient.get('/dashboard')
    );
  }

  /**
   * Test basic connectivity
   */
  async testConnectivity(): Promise<APITestResult> {
    console.log('🌐 Testing Basic Connectivity...');
    
    return await this.testEndpoint(
      '/api',
      'GET',
      () => apiClient.get('/')
    );
  }

  /**
   * Run comprehensive API tests
   */
  async runAllTests(): Promise<{
    summary: {
      total: number;
      passed: number;
      failed: number;
      avgResponseTime: number;
    };
    results: APITestResult[];
  }> {
    console.log('🚀 Starting Comprehensive API Integration Tests...\n');
    
    this.results = [];

    // Test basic connectivity first
    await this.testConnectivity();

    // Test auth endpoints (these don't require authentication)
    await this.testAuthEndpoints();

    // Test authenticated endpoints (these will fail if not logged in)
    await this.testUserEndpoints();
    await this.testTicketEndpoints();
    await this.testVehicleEndpoints();
    await this.testPaymentEndpoints();
    await this.testDashboardEndpoint();

    // Calculate summary
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / total;

    const summary = {
      total,
      passed,
      failed,
      avgResponseTime: Math.round(avgResponseTime)
    };

    console.log('\n📊 Test Summary:');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Average Response Time: ${summary.avgResponseTime}ms`);

    return {
      summary,
      results: this.results
    };
  }

  /**
   * Get all test results
   */
  getResults(): APITestResult[] {
    return this.results;
  }

  /**
   * Clear test results
   */
  clearResults(): void {
    this.results = [];
  }

  /**
   * Print detailed results
   */
  printDetailedResults(): void {
    console.log('\n📋 Detailed Test Results:');
    console.log('='.repeat(80));
    
    this.results.forEach((result, index) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const timing = `${result.responseTime}ms`;
      
      console.log(`${index + 1}. ${status} ${result.method} ${result.endpoint} (${timing})`);
      
      if (!result.success) {
        console.log(`   Error: ${result.error}`);
        if (result.status) {
          console.log(`   Status: ${result.status}`);
        }
      }
    });
    
    console.log('='.repeat(80));
  }
}

// Export singleton instance
export default new APITestUtils();

// Export for use in development screens
export const testAPIIntegration = async () => {
  const apiTestUtils = new APITestUtils();
  const results = await apiTestUtils.runAllTests();
  apiTestUtils.printDetailedResults();
  return results;
};