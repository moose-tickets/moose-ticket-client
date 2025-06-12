#!/usr/bin/env node

/**
 * Backend Integration Test Runner
 * 
 * This script runs comprehensive integration tests to verify that the mobile app
 * can successfully communicate with all backend microservices.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  testFiles: [
    'src/tests/integration/backendIntegration.test.ts'
  ],
  jestConfig: {
    preset: 'jest-expo',
    testEnvironment: 'node',
    testTimeout: 60000,
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapping: {
      '^@/(.*)$': '<rootDir>/src/$1',
    },
    testMatch: [
      '<rootDir>/src/tests/integration/**/*.test.ts',
      '<rootDir>/src/tests/integration/**/*.test.tsx'
    ],
    collectCoverageFrom: [
      'src/services/**/*.ts',
      '!src/services/**/*.test.ts',
    ],
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70
      }
    }
  },
  reportDir: 'test-reports/integration',
  maxRetries: 3,
  environments: {
    development: {
      apiUrl: 'http://localhost:3000',
      description: 'Local development environment'
    },
    staging: {
      apiUrl: 'https://staging-api.mooseticket.com',
      description: 'Staging environment'
    },
    production: {
      apiUrl: 'https://api.mooseticket.com',
      description: 'Production environment (read-only tests)'
    }
  }
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📘',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    debug: '🐛'
  }[type] || '📘';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const createReportDir = () => {
  const reportPath = path.join(process.cwd(), CONFIG.reportDir);
  if (!fs.existsSync(reportPath)) {
    fs.mkdirSync(reportPath, { recursive: true });
    log(`Created report directory: ${reportPath}`);
  }
  return reportPath;
};

const checkBackendHealth = async (environment) => {
  const { apiUrl } = CONFIG.environments[environment];
  
  try {
    log(`Checking backend health at ${apiUrl}...`);
    
    // Check API Gateway health
    const healthResponse = await fetch(`${apiUrl}/health`);
    if (!healthResponse.ok) {
      throw new Error(`Health check failed with status: ${healthResponse.status}`);
    }
    
    const healthData = await healthResponse.json();
    log(`API Gateway health: ${healthData.success ? 'OK' : 'Failed'}`, 
        healthData.success ? 'success' : 'error');
    
    // Check individual services health
    const servicesResponse = await fetch(`${apiUrl}/health/services`);
    if (servicesResponse.ok) {
      const servicesData = await servicesResponse.json();
      log(`Services health: ${servicesData.data.summary}`, 
          servicesData.success ? 'success' : 'warning');
      
      // Log individual service status
      if (servicesData.data.services) {
        servicesData.data.services.forEach(service => {
          log(`  ${service.service}: ${service.status}`, 
              service.status === 'healthy' ? 'success' : 'warning');
        });
      }
    }
    
    return true;
  } catch (error) {
    log(`Backend health check failed: ${error.message}`, 'error');
    return false;
  }
};

const runJestTests = (environment, jestConfigOverrides = {}) => {
  const reportPath = createReportDir();
  const configPath = path.join(process.cwd(), 'jest.integration.config.js');
  
  // Create Jest configuration file
  const jestConfig = {
    ...CONFIG.jestConfig,
    ...jestConfigOverrides,
    reporters: [
      'default',
      ['jest-html-reporters', {
        publicPath: reportPath,
        filename: `integration-test-report-${environment}.html`,
        expand: true,
        pageTitle: `MooseTicket Integration Tests - ${environment}`,
      }],
      ['jest-junit', {
        outputDirectory: reportPath,
        outputName: `integration-test-results-${environment}.xml`,
      }]
    ],
    globals: {
      'ts-jest': {
        useESM: true
      },
      '__TEST_ENVIRONMENT__': environment,
      '__API_URL__': CONFIG.environments[environment].apiUrl
    }
  };
  
  fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(jestConfig, null, 2)};`);
  
  try {
    log(`Running integration tests for ${environment} environment...`);
    
    const jestCommand = [
      'npx jest',
      `--config=${configPath}`,
      '--verbose',
      '--detectOpenHandles',
      '--forceExit',
      CONFIG.testFiles.join(' ')
    ].join(' ');
    
    execSync(jestCommand, { 
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: environment === 'production' ? 'production' : 'development',
        TEST_ENVIRONMENT: environment,
        API_BASE_URL: CONFIG.environments[environment].apiUrl
      }
    });
    
    log(`Integration tests completed successfully for ${environment}`, 'success');
    return true;
  } catch (error) {
    log(`Integration tests failed for ${environment}: ${error.message}`, 'error');
    return false;
  } finally {
    // Clean up temporary config file
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  }
};

const generateSummaryReport = (results) => {
  const reportPath = createReportDir();
  const summaryPath = path.join(reportPath, 'integration-test-summary.json');
  
  const summary = {
    timestamp: new Date().toISOString(),
    totalEnvironments: Object.keys(results).length,
    passedEnvironments: Object.values(results).filter(r => r.success).length,
    failedEnvironments: Object.values(results).filter(r => !r.success).length,
    results: results,
    recommendations: []
  };
  
  // Add recommendations based on results
  if (summary.failedEnvironments > 0) {
    summary.recommendations.push('Review failed tests and check backend service connectivity');
  }
  
  if (results.production && !results.production.success) {
    summary.recommendations.push('Production issues detected - immediate attention required');
  }
  
  if (results.development && results.development.success && results.production && !results.production.success) {
    summary.recommendations.push('Development works but production fails - check deployment configuration');
  }
  
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  log(`Summary report generated: ${summaryPath}`);
  
  return summary;
};

const printSummary = (summary) => {
  console.log('\n' + '='.repeat(60));
  console.log('INTEGRATION TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Environments Tested: ${summary.totalEnvironments}`);
  console.log(`Passed: ${summary.passedEnvironments}`);
  console.log(`Failed: ${summary.failedEnvironments}`);
  console.log('');
  
  Object.entries(summary.results).forEach(([env, result]) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${env.toUpperCase()}: ${status}`);
    if (result.healthCheck !== undefined) {
      console.log(`  Health Check: ${result.healthCheck ? '✅' : '❌'}`);
    }
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });
  
  if (summary.recommendations.length > 0) {
    console.log('\nRECOMMENDATIONS:');
    summary.recommendations.forEach(rec => {
      console.log(`• ${rec}`);
    });
  }
  
  console.log('='.repeat(60));
};

// Main execution function
const main = async () => {
  const args = process.argv.slice(2);
  const environment = args[0] || 'development';
  const skipHealthCheck = args.includes('--skip-health-check');
  const allEnvironments = args.includes('--all-environments');
  
  log('Starting MooseTicket Backend Integration Tests...');
  log(`Target environment: ${environment}`);
  
  if (!CONFIG.environments[environment] && !allEnvironments) {
    log(`Unknown environment: ${environment}`, 'error');
    log(`Available environments: ${Object.keys(CONFIG.environments).join(', ')}`);
    process.exit(1);
  }
  
  const results = {};
  const environments = allEnvironments ? Object.keys(CONFIG.environments) : [environment];
  
  for (const env of environments) {
    log(`\nTesting environment: ${env}`);
    log(`Description: ${CONFIG.environments[env].description}`);
    
    const result = { success: false };
    
    // Check backend health first
    if (!skipHealthCheck) {
      result.healthCheck = await checkBackendHealth(env);
      if (!result.healthCheck) {
        log(`Skipping tests for ${env} due to health check failure`, 'warning');
        result.error = 'Backend health check failed';
        results[env] = result;
        continue;
      }
    }
    
    // Run integration tests
    try {
      result.success = runJestTests(env);
    } catch (error) {
      result.error = error.message;
      log(`Test execution failed for ${env}: ${error.message}`, 'error');
    }
    
    results[env] = result;
    
    // Brief pause between environments
    if (environments.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Generate and display summary
  const summary = generateSummaryReport(results);
  printSummary(summary);
  
  // Exit with error code if any tests failed
  const hasFailures = summary.failedEnvironments > 0;
  process.exit(hasFailures ? 1 : 0);
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, 'error');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection at: ${promise}, reason: ${reason}`, 'error');
  process.exit(1);
});

// Show usage information
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
MooseTicket Backend Integration Test Runner

Usage:
  node scripts/test-backend-integration.js [environment] [options]

Environments:
  development     Test against local development backend (default)
  staging         Test against staging environment
  production      Test against production environment (read-only)

Options:
  --all-environments    Test against all environments
  --skip-health-check   Skip backend health check before tests
  --help, -h           Show this help message

Examples:
  node scripts/test-backend-integration.js development
  node scripts/test-backend-integration.js staging --skip-health-check
  node scripts/test-backend-integration.js --all-environments
`);
  process.exit(0);
}

// Run the main function
main().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});