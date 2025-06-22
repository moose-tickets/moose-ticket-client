import React from 'react';
import { ThemedView, ThemedText, ThemedCard } from '../ThemedComponents';
import AutoTranslatedText from '../AutoTranslatedText';
import MetadataDisplay from '../MetadataDisplay';
import useAutoTranslate from '../../utils/autoTranslate';

// Example usage of auto-translation components
export const AutoTranslationExample: React.FC = () => {
  const { smartTranslate } = useAutoTranslate();

  // Example dynamic data that might come from an API
  const ticketMetadata = {
    ticket_number: 'TK001234',
    license_plate: 'ABC1234',
    violation_type: 'Parking in No Parking Zone',
    fine_amount: '$85.00',
    status: 'outstanding',
    issued_by: 'Toronto Parking Authority',
    violation_date: '2024-01-15',
    due_date: '2024-02-15',
    location: '123 King St W, Toronto',
    officer_badge: '12345',
    vehicle_make: 'Toyota',
    vehicle_model: 'Camry',
    vehicle_year: '2020',
    vehicle_color: 'Blue',
  };

  const paymentMetadata = {
    payment_method: 'Credit Card',
    card_number: '**** **** **** 1234',
    cardholder_name: 'John Doe',
    amount_paid: '$85.00',
    payment_date: '2024-01-20',
    transaction_id: 'TXN789123',
    status: 'paid',
  };

  return (
    <ThemedView className="p-4 space-y-6">
      <ThemedText weight="bold" size="xl" className="mb-4">
        Auto-Translation Examples
      </ThemedText>

      {/* Example 1: Individual field translations */}
      <ThemedCard className="p-4">
        <ThemedText weight="bold" className="mb-3">
          Individual Field Translation
        </ThemedText>
        
        <ThemedView className="space-y-2">
          <ThemedView className="flex-row">
            <ThemedText className="w-32">Field Name:</ThemedText>
            <AutoTranslatedText text="license_plate" type="field" weight="medium" />
          </ThemedView>
          
          <ThemedView className="flex-row">
            <ThemedText className="w-32">Status:</ThemedText>
            <AutoTranslatedText text="outstanding" type="status" weight="medium" />
          </ThemedView>
          
          <ThemedView className="flex-row">
            <ThemedText className="w-32">Auto-detect:</ThemedText>
            <AutoTranslatedText text="paid" type="auto" weight="medium" />
          </ThemedView>
        </ThemedView>
      </ThemedCard>

      {/* Example 2: Ticket metadata with auto-translation */}
      <ThemedCard className="p-4">
        <MetadataDisplay
          title="Ticket Metadata (Auto-translated)"
          data={ticketMetadata}
          excludeFields={['officer_badge', 'transaction_id']}
          customLabels={{
            'officer_badge': 'Officer Badge Number',
            'vehicle_make': 'Vehicle Brand'
          }}
        />
      </ThemedCard>

      {/* Example 3: Payment metadata */}
      <ThemedCard className="p-4">
        <MetadataDisplay
          title="Payment Information"
          data={paymentMetadata}
          excludeFields={['transaction_id']}
        />
      </ThemedCard>

      {/* Example 4: Programmatic translation */}
      <ThemedCard className="p-4">
        <ThemedText weight="bold" className="mb-3">
          Programmatic Translation
        </ThemedText>
        
        <ThemedView className="space-y-2">
          <ThemedText>
            Smart translate "fine_amount": {smartTranslate('fine_amount')}
          </ThemedText>
          <ThemedText>
            Smart translate "disputed": {smartTranslate('disputed')}
          </ThemedText>
          <ThemedText>
            Smart translate entire object:
          </ThemedText>
          <ThemedText variant="secondary" size="xs" className="ml-4">
            {JSON.stringify(smartTranslate({ status: 'paid', fine_amount: '$50' }), null, 2)}
          </ThemedText>
        </ThemedView>
      </ThemedCard>
    </ThemedView>
  );
};

export default AutoTranslationExample;