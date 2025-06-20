// src/screens/Settings/APITestScreen.tsx
import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { ThemedView, ThemedText, ThemedButton } from '../../components/ThemedComponents';
import GoBackHeader from '../../components/GoBackHeader';
import AppLayout from '../../wrappers/layout';
import APITestUtils, { APITestResult } from '../../utils/apiTestUtils';

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  avgResponseTime: number;
}

export default function APITestScreen() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<APITestResult[]>([]);
  const [summary, setSummary] = useState<TestSummary | null>(null);

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    setSummary(null);

    try {
      const testResults = await APITestUtils.runAllTests();
      setResults(testResults.results);
      setSummary(testResults.summary);
      
      Alert.alert(
        'API Tests Complete',
        `${testResults.summary.passed}/${testResults.summary.total} tests passed\nAvg Response Time: ${testResults.summary.avgResponseTime}ms`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Test Error', `Failed to run tests: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setSummary(null);
    APITestUtils.clearResults();
  };

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌';
  };

  const getStatusColor = (success: boolean) => {
    return success ? '#22c55e' : '#ef4444';
  };

  return (
    <AppLayout scrollable={false}>
      <GoBackHeader screenTitle="API Integration Test" />
      
      <ScrollView className="flex-1 px-4">
        <ThemedView className="mb-6">
          <ThemedText size="lg" weight="bold" className="mb-2">
            Backend API Integration Test
          </ThemedText>
          <ThemedText variant="tertiary" className="mb-4">
            Test the connection and functionality of all API endpoints
          </ThemedText>
          
          <View className="flex-row gap-3 mb-4">
            <ThemedButton
              variant="primary"
              onPress={runTests}
              disabled={testing}
              className="flex-1"
            >
              {testing ? 'Running Tests...' : 'Run All Tests'}
            </ThemedButton>
            
            <ThemedButton
              variant="outline"
              onPress={clearResults}
              disabled={testing || results.length === 0}
              className="flex-1"
            >
              Clear Results
            </ThemedButton>
          </View>
        </ThemedView>

        {summary && (
          <ThemedView className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <ThemedText size="lg" weight="semibold" className="mb-3">
              Test Summary
            </ThemedText>
            
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <ThemedText>Total Tests:</ThemedText>
                <ThemedText weight="semibold">{summary.total}</ThemedText>
              </View>
              
              <View className="flex-row justify-between">
                <ThemedText>Passed:</ThemedText>
                <ThemedText weight="semibold" style={{ color: '#22c55e' }}>
                  {summary.passed}
                </ThemedText>
              </View>
              
              <View className="flex-row justify-between">
                <ThemedText>Failed:</ThemedText>
                <ThemedText weight="semibold" style={{ color: '#ef4444' }}>
                  {summary.failed}
                </ThemedText>
              </View>
              
              <View className="flex-row justify-between">
                <ThemedText>Avg Response Time:</ThemedText>
                <ThemedText weight="semibold">{summary.avgResponseTime}ms</ThemedText>
              </View>
              
              <View className="flex-row justify-between">
                <ThemedText>Success Rate:</ThemedText>
                <ThemedText weight="semibold">
                  {Math.round((summary.passed / summary.total) * 100)}%
                </ThemedText>
              </View>
            </View>
          </ThemedView>
        )}

        {results.length > 0 && (
          <ThemedView className="mb-6">
            <ThemedText size="lg" weight="semibold" className="mb-3">
              Detailed Results
            </ThemedText>
            
            {results.map((result, index) => (
              <View
                key={index}
                className="p-3 mb-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-1">
                    <ThemedText style={{ fontSize: 16, marginRight: 8 }}>
                      {getStatusIcon(result.success)}
                    </ThemedText>
                    <ThemedText weight="semibold" className="flex-1">
                      {result.method} {result.endpoint}
                    </ThemedText>
                  </View>
                  
                  <ThemedText variant="tertiary" size="sm">
                    {result.responseTime}ms
                  </ThemedText>
                </View>
                
                {result.status && (
                  <ThemedText
                    variant="tertiary"
                    size="sm"
                    style={{ color: getStatusColor(result.success) }}
                  >
                    Status: {result.status}
                  </ThemedText>
                )}
                
                {result.error && (
                  <ThemedText
                    variant="tertiary"
                    size="sm"
                    style={{ color: '#ef4444' }}
                    className="mt-1"
                  >
                    Error: {result.error}
                  </ThemedText>
                )}
              </View>
            ))}
          </ThemedView>
        )}

        <ThemedView className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <ThemedText size="sm" variant="tertiary">
            <ThemedText weight="semibold">Note:</ThemedText> This test screen is for development purposes. 
            Some tests may fail if the backend is not running or if you're not authenticated. 
            Authentication endpoints should work without being logged in.
          </ThemedText>
        </ThemedView>

        <ThemedView className="mb-8">
          <ThemedText size="lg" weight="semibold" className="mb-3">
            Tested Endpoints
          </ThemedText>
          
          <View className="space-y-3">
            <View>
              <ThemedText weight="semibold" className="mb-1">Authentication:</ThemedText>
              <ThemedText variant="tertiary" size="sm">
                • POST /api/auth/register{'\n'}
                • POST /api/auth/login
              </ThemedText>
            </View>
            
            <View>
              <ThemedText weight="semibold" className="mb-1">User Management:</ThemedText>
              <ThemedText variant="tertiary" size="sm">
                • GET /api/users/profile{'\n'}
                • GET /api/users/preferences
              </ThemedText>
            </View>
            
            <View>
              <ThemedText weight="semibold" className="mb-1">Tickets:</ThemedText>
              <ThemedText variant="tertiary" size="sm">
                • GET /api/tickets{'\n'}
                • GET /api/tickets/summary
              </ThemedText>
            </View>
            
            <View>
              <ThemedText weight="semibold" className="mb-1">Vehicles:</ThemedText>
              <ThemedText variant="tertiary" size="sm">
                • GET /api/vehicles
              </ThemedText>
            </View>
            
            <View>
              <ThemedText weight="semibold" className="mb-1">Payments:</ThemedText>
              <ThemedText variant="tertiary" size="sm">
                • GET /api/payments/methods
              </ThemedText>
            </View>
            
            <View>
              <ThemedText weight="semibold" className="mb-1">Dashboard:</ThemedText>
              <ThemedText variant="tertiary" size="sm">
                • GET /api/dashboard
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </AppLayout>
  );
}