#!/usr/bin/env node

/**
 * API Integration Test Script
 * Tests frontend-to-backend connectivity for MooseTickets
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test@mooseticket.com',
  password: 'TestPassword123!',
  fullName: 'Test User',
  phone: '+15551234567'
};

let authToken = null;

// Test utilities
const log = (message, ...args) => {
  console.log(`[${new Date().toISOString()}] ${message}`, ...args);
};

const logSuccess = (message, ...args) => {
  console.log(`✅ ${message}`, ...args);
};

const logError = (message, ...args) => {
  console.error(`❌ ${message}`, ...args);
};

const logInfo = (message, ...args) => {
  console.log(`ℹ️  ${message}`, ...args);
};

// API test functions
const testBackendHealth = async () => {
  try {
    log('Testing backend health...');
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 10000 });
    
    if (response.status === 200) {
      logSuccess('Backend health check passed');
      return true;
    } else {
      logError('Backend health check failed with status:', response.status);
      return false;
    }
  } catch (error) {
    logError('Backend health check failed:', error.message);
    return false;
  }
};

const testServiceHealth = async () => {
  try {
    log('Testing microservices health...');
    const response = await axios.get(`${API_BASE_URL}/health/services`, { timeout: 15000 });
    
    if (response.status === 200) {
      const services = response.data.data.services;
      const healthyCount = services.filter(s => s.status === 'healthy').length;
      
      logSuccess(`Services health check: ${healthyCount}/${services.length} services healthy`);
      
      services.forEach(service => {
        if (service.status === 'healthy') {
          logSuccess(`  ${service.service}: healthy`);
        } else {
          logError(`  ${service.service}: unhealthy - ${service.error}`);
        }
      });
      
      return healthyCount > 0;
    } else {
      logError('Services health check failed with status:', response.status);
      return false;
    }
  } catch (error) {
    logError('Services health check failed:', error.message);
    return false;
  }
};

const testUserRegistration = async () => {
  try {
    log('Testing user registration...');
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      ...TEST_USER,
      confirmPassword: TEST_USER.password,
      agreeToTerms: true,
      agreeToPrivacy: true
    }, { timeout: 10000 });
    
    if (response.status === 201 || response.status === 200) {
      logSuccess('User registration successful');
      return true;
    } else {
      logError('User registration failed with status:', response.status);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 409) {
      logInfo('User already exists (expected for repeated tests)');
      return true;
    }
    logError('User registration failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testUserLogin = async () => {
  try {
    log('Testing user login...');
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    }, { timeout: 10000 });
    
    if (response.status === 200 && response.data.success) {
      authToken = response.data.data.token;
      logSuccess('User login successful, token received');
      return true;
    } else {
      logError('User login failed with status:', response.status);
      return false;
    }
  } catch (error) {
    logError('User login failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testAuthenticatedRequest = async () => {
  if (!authToken) {
    logError('No auth token available for authenticated request test');
    return false;
  }
  
  try {
    log('Testing authenticated API request...');
    const response = await axios.get(`${API_BASE_URL}/api/users/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.status === 200) {
      logSuccess('Authenticated request successful');
      return true;
    } else {
      logError('Authenticated request failed with status:', response.status);
      return false;
    }
  } catch (error) {
    logError('Authenticated request failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testDashboardEndpoint = async () => {
  if (!authToken) {
    logError('No auth token available for dashboard test');
    return false;
  }
  
  try {
    log('Testing dashboard aggregation endpoint...');
    const response = await axios.get(`${API_BASE_URL}/api/dashboard`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    if (response.status === 200) {
      logSuccess('Dashboard endpoint successful');
      return true;
    } else {
      logError('Dashboard endpoint failed with status:', response.status);
      return false;
    }
  } catch (error) {
    logError('Dashboard endpoint failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testTicketsEndpoint = async () => {
  if (!authToken) {
    logError('No auth token available for tickets test');
    return false;
  }
  
  try {
    log('Testing tickets endpoint...');
    const response = await axios.get(`${API_BASE_URL}/api/tickets`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.status === 200) {
      logSuccess('Tickets endpoint successful');
      return true;
    } else {
      logError('Tickets endpoint failed with status:', response.status);
      return false;
    }
  } catch (error) {
    logError('Tickets endpoint failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testVehiclesEndpoint = async () => {
  if (!authToken) {
    logError('No auth token available for vehicles test');
    return false;
  }
  
  try {
    log('Testing vehicles endpoint...');
    const response = await axios.get(`${API_BASE_URL}/api/vehicles`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.status === 200) {
      logSuccess('Vehicles endpoint successful');
      return true;
    } else {
      logError('Vehicles endpoint failed with status:', response.status);
      return false;
    }
  } catch (error) {
    logError('Vehicles endpoint failed:', error.response?.data?.message || error.message);
    return false;
  }
};

// Main test runner
async function runTests() {
  console.log('🚀 Starting MooseTickets API Integration Tests\n');
  
  const tests = [
    { name: 'Backend Health', fn: testBackendHealth },
    { name: 'Services Health', fn: testServiceHealth },
    { name: 'User Registration', fn: testUserRegistration },
    { name: 'User Login', fn: testUserLogin },
    { name: 'Authenticated Request', fn: testAuthenticatedRequest },
    { name: 'Dashboard Endpoint', fn: testDashboardEndpoint },
    { name: 'Tickets Endpoint', fn: testTicketsEndpoint },
    { name: 'Vehicles Endpoint', fn: testVehiclesEndpoint },
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, success: result });
    } catch (error) {
      logError(`Test "${test.name}" threw an error:`, error.message);
      results.push({ name: test.name, success: false });
    }
    console.log(''); // Add spacing between tests
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
  });
  
  console.log('='.repeat(50));
  console.log(`Overall Result: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Frontend-backend integration is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the backend services and configuration.');
  }
  
  process.exit(passed === total ? 0 : 1);
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    logError('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };