import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { InfractionTypeList } from '../components/InfractionTypeList';
import { useInfractionTypes } from '../hooks/useInfractionTypes';

export const InfractionTypesDemo: React.FC = () => {
  const { infractionTypes, categories, loading } = useInfractionTypes();

  const handleSelectInfractionType = (infractionType: any) => {
    console.log('Selected infraction type:', infractionType);
    // Handle selection - you could navigate to another screen or update state
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Infraction Types Demo</Text>
        {!loading && (
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              Total: {infractionTypes.length} | Categories: {categories.join(', ')}
            </Text>
          </View>
        )}
      </View>
      
      <InfractionTypeList onSelectInfractionType={handleSelectInfractionType} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  summary: {
    marginTop: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
  },
});

export default InfractionTypesDemo;