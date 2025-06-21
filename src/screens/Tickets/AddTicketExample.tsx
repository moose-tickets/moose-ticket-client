import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { InfractionTypeSelector } from '../../components/InfractionTypeSelector';
import { InfractionType } from '../../store/slices/infractionTypeSlice';

export const AddTicketExample: React.FC = () => {
  const [selectedInfractionType, setSelectedInfractionType] = useState<InfractionType | null>(null);
  const [form, setForm] = useState({
    licensePlate: '',
    location: '',
    notes: '',
  });

  const handleInfractionSelect = (infractionType: InfractionType) => {
    setSelectedInfractionType(infractionType);
    console.log('Selected infraction type:', infractionType);
  };

  const handleSubmit = () => {
    if (!selectedInfractionType) {
      Alert.alert('Error', 'Please select a violation type');
      return;
    }

    const ticketData = {
      ...form,
      infractionType: selectedInfractionType,
      fine: selectedInfractionType.baseFine,
      points: selectedInfractionType.points,
    };

    console.log('Ticket data to submit:', ticketData);
    Alert.alert('Success', `Ticket created for ${selectedInfractionType.type}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Add New Ticket</Text>
        </View>

        <View style={styles.form}>
          {/* License Plate Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>License Plate *</Text>
            <TextInput
              style={styles.input}
              value={form.licensePlate}
              onChangeText={(text) => setForm(prev => ({ ...prev, licensePlate: text }))}
              placeholder="Enter license plate"
              autoCapitalize="characters"
            />
          </View>

          {/* Infraction Type Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Violation Type *</Text>
            <InfractionTypeSelector
              selectedInfractionType={selectedInfractionType}
              onSelect={handleInfractionSelect}
              placeholder="Select violation type"
            />
            {selectedInfractionType && (
              <View style={styles.selectedInfo}>
                <Text style={styles.infoText}>
                  Fine: ${selectedInfractionType.baseFine}
                </Text>
                <Text style={styles.infoText}>
                  Points: {selectedInfractionType.points}
                </Text>
                <Text style={styles.infoText}>
                  Category: {selectedInfractionType.category}
                </Text>
              </View>
            )}
          </View>

          {/* Location Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              value={form.location}
              onChangeText={(text) => setForm(prev => ({ ...prev, location: text }))}
              placeholder="Enter violation location"
            />
          </View>

          {/* Notes Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.notes}
              onChangeText={(text) => setForm(prev => ({ ...prev, notes: text }))}
              placeholder="Additional notes (optional)"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedInfractionType || !form.licensePlate || !form.location) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!selectedInfractionType || !form.licensePlate || !form.location}
          >
            <Text style={styles.submitButtonText}>Create Ticket</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
  },
  selectedInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddTicketExample;