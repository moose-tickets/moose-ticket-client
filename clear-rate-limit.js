#!/usr/bin/env node

/**
 * Rate Limit Cache Clearer - Development Tool
 * 
 * This script provides information about clearing rate limit cache
 * and shows current rate limiting configuration.
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Rate Limit Cache Clearer - Development Tool');
console.log('===============================================');

// Check current rate limiting configuration
const securityServicePath = path.join(__dirname, 'src/services/mobileSecurityService.ts');

if (fs.existsSync(securityServicePath)) {
  const content = fs.readFileSync(securityServicePath, 'utf8');
  
  console.log('\n📊 Current Rate Limiting Configuration:');
  console.log('=========================================');
  
  // Extract all rate limit configurations
  const configs = {
    'AUTH_LOGIN': { name: 'Login', pattern: /AUTH_LOGIN.*?maxAttempts:\s*(\d+).*?windowMs:\s*(\d+)\s*\*\s*(\d+)\s*\*\s*(\d+).*?blockDurationMs:\s*(\d+)\s*\*\s*(\d+)\s*\*\s*(\d+)/ },
    'AUTH_REGISTER': { name: 'Signup', pattern: /AUTH_REGISTER.*?maxAttempts:\s*(\d+).*?windowMs:\s*(\d+)\s*\*\s*(\d+)\s*\*\s*(\d+).*?blockDurationMs:\s*(\d+)\s*\*\s*(\d+)\s*\*\s*(\d+)/ },
    'PASSWORD_RESET': { name: 'Password Reset', pattern: /PASSWORD_RESET.*?maxAttempts:\s*(\d+).*?windowMs:\s*(\d+)\s*\*\s*(\d+)\s*\*\s*(\d+).*?blockDurationMs:\s*(\d+)\s*\*\s*(\d+)\s*\*\s*(\d+)/ },
    'API_REQUEST': { name: 'API Requests', pattern: /API_REQUEST.*?maxAttempts:\s*(\d+).*?windowMs:\s*(\d+)\s*\*\s*(\d+)/ }
  };
  
  Object.entries(configs).forEach(([key, config]) => {
    const match = content.match(config.pattern);
    if (match) {
      if (key === 'API_REQUEST') {
        const [, maxAttempts, windowNum, windowUnit] = match;
        const windowMs = parseInt(windowNum) * parseInt(windowUnit);
        const windowMinutes = windowMs / (60 * 1000);
        console.log(`   📱 ${config.name}: ${maxAttempts} attempts per ${windowMinutes} minute(s) - No block`);
      } else {
        const [, maxAttempts, windowNum1, windowNum2, windowNum3, blockNum1, blockNum2, blockNum3] = match;
        const windowMs = parseInt(windowNum1) * parseInt(windowNum2) * parseInt(windowNum3);
        const blockMs = parseInt(blockNum1) * parseInt(blockNum2) * parseInt(blockNum3);
        const windowMinutes = windowMs / (60 * 1000);
        const blockMinutes = blockMs / (60 * 1000);
        console.log(`   🔒 ${config.name}: ${maxAttempts} attempts per ${windowMinutes} minute(s) → Block for ${blockMinutes} minute(s)`);
      }
    }
  });
} else {
  console.log('   ❌ Could not find mobileSecurityService.ts file');
}

console.log('\n🧹 Ways to Clear Rate Limit Cache:');
console.log('==================================');
console.log('1. 📱 In-App Debug Button:');
console.log('   • Open your React Native app');
console.log('   • Navigate to SignUp screen');
console.log('   • When rate limited, tap "🧹 Clear Rate Limit (Debug)" button');
console.log('');
console.log('2. 🔧 Debug Console Method:');
console.log('   • Open React Native debugger/console');
console.log('   • Type: clearRateLimits()');
console.log('   • Press Enter');
console.log('');
console.log('3. 🛠️ Programmatic Method:');
console.log('   • import mobileSecurityService from "./src/services/mobileSecurityService"');
console.log('   • await mobileSecurityService.clearAllCachedData()');

console.log('\n📱 AsyncStorage Keys That Get Cleared:');
console.log('=====================================');
const storageKeys = [
  'rate_limit_data - All rate limiting attempt counts and timers',
  'device_fingerprint - Device identification for security',
  'behavior_* - User behavior tracking data'
];

storageKeys.forEach(key => {
  console.log(`   🗂️  ${key}`);
});

console.log('\n✨ Benefits of Clearing Cache:');
console.log('=============================');
console.log('   ✅ Reset all attempt counters to 0');
console.log('   ✅ Remove all block timers');
console.log('   ✅ Clear suspicious behavior tracking');
console.log('   ✅ Start fresh with full rate limit allowance');

console.log('\n🎯 This tool is available in development mode only!');
console.log('Production builds will not include these debug features.');