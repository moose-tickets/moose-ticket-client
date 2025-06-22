// src/components/TicketFilterSheet.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useTheme } from '../../wrappers/ThemeProvider';
import { setFilters } from '../../store/slices/ticketSlice';
import { ThemedView, ThemedText, ThemedInput, ThemedButton, ThemedCard, ThemedScrollView } from '../../components/ThemedComponents';
import AppLayout from '../../wrappers/layout';
import InfractionTypeSelector from '../../components/InfractionTypeSelector';
import { InfractionType } from '../../store/slices/infractionTypeSlice';
import DropdownSearch from '../../components/DropdownSearch';



// Enhanced DatePicker component
interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, placeholder = 'Select Date' }) => {
  const [showPicker, setShowPicker] = useState(false);
  const { theme } = useTheme();

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const clearDate = () => {
    onChange(null);
  };

  return (
    <ThemedView>
      <TouchableOpacity 
        onPress={() => setShowPicker(true)}
        className="border border-border rounded-lg p-3 bg-background flex-row justify-between items-center"
      >
        <ThemedText variant="secondary">
          {value ? value.toLocaleDateString() : placeholder}
        </ThemedText>
        <ThemedView className="flex-row items-center">
          {value && (
            <TouchableOpacity onPress={clearDate} className="mr-2">
              <Ionicons name="close-circle" size={20} color={theme === 'dark' ? '#9CA3AF' : '#666666'} />
            </TouchableOpacity>
          )}
          <Ionicons name="calendar" size={20} color={theme === 'dark' ? '#9CA3AF' : '#666666'} />
        </ThemedView>
      </TouchableOpacity>
      
      {showPicker && (
        <Modal transparent animationType="fade">
          <ThemedView className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <ThemedCard className="p-4 m-4">
              <ThemedView className="flex-row justify-between items-center mb-4">
                <ThemedText size="lg" weight="bold">Select Date</ThemedText>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Ionicons name="close" size={24} color={theme === 'dark' ? '#FFFFFF' : '#1E1E1E'} />
                </TouchableOpacity>
              </ThemedView>
              
              <ThemedView className="items-center">
                <TextInput
                  value={value ? value.toISOString().split('T')[0] : ''}
                  onChangeText={(text) => {
                    const date = new Date(text);
                    if (!isNaN(date.getTime())) {
                      onChange(date);
                    }
                  }}
                  placeholder="YYYY-MM-DD"
                  className="border border-border rounded-lg p-3 w-full mb-4 text-center"
                  style={{ color: theme === 'dark' ? '#FFFFFF' : '#1E1E1E' }}
                />
                
                <ThemedView className="flex-row space-x-2">
                  <ThemedButton
                    variant="secondary"
                    onPress={() => setShowPicker(false)}
                    className="flex-1 mr-2"
                  >
                    Cancel
                  </ThemedButton>
                  <ThemedButton
                    variant="primary"
                    onPress={() => {
                      if (!value) onChange(new Date());
                      setShowPicker(false);
                    }}
                    className="flex-1"
                  >
                    Done
                  </ThemedButton>
                </ThemedView>
              </ThemedView>
            </ThemedCard>
          </ThemedView>
        </Modal>
      )}
    </ThemedView>
  );
};

const licenses = ['All', 'Car', 'Truck', 'Motorcycle', 'SUV'];

const cities = [
  { rank: 0, city: "All", province: "" },
  { rank: 1, city: "Toronto", province: "Ontario" },
  { rank: 2, city: "Montreal", province: "Quebec" },
  { rank: 3, city: "Vancouver", province: "British Columbia" },
  { rank: 4, city: "Calgary", province: "Alberta" },
  { rank: 5, city: "Edmonton", province: "Alberta" },
  { rank: 6, city: "Ottawa", province: "Ontario" },
  { rank: 7, city: "Mississauga", province: "Ontario" },
  { rank: 8, city: "Winnipeg", province: "Manitoba" },
  { rank: 9, city: "Brampton", province: "Ontario" },
  { rank: 10, city: "Hamilton", province: "Ontario" },
  { rank: 11, city: "Surrey", province: "British Columbia" },
  { rank: 12, city: "Halifax", province: "Nova Scotia" },
  { rank: 13, city: "Quebec City", province: "Quebec" },
  { rank: 14, city: "London", province: "Ontario" },
  { rank: 15, city: "Kitchener", province: "Ontario" },
  { rank: 16, city: "Markham", province: "Ontario" },
  { rank: 17, city: "Windsor", province: "Ontario" },
  { rank: 18, city: "Saskatoon", province: "Saskatchewan" },
  { rank: 19, city: "Burnaby", province: "British Columbia" },
  { rank: 20, city: "Regina", province: "Saskatchewan" }
];

const statuses = ['All', 'Outstanding', 'Paid', 'Disputed'];

export default function TicketFilter({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const [license, setLicense] = useState('All');
  const [status, setStatus] = useState('All');
  const [city, setCity] = useState('Toronto');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [infractionType, setInfractionType] = useState<InfractionType | null>(null);

  const handleApply = () => {
    dispatch(
      setFilters({
        license,
        status,
        city,
        startDate,
        endDate,
        infractionType
      })
    );
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
        <AppLayout scrollable={false}>
            {/* Header */}
            <ThemedView className="flex-row justify-between items-center mb-4 px-6">
              <ThemedText size="lg" weight="bold">Filter Tickets</ThemedText>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={theme === 'dark' ? '#FFFFFF' : '#1E1E1E'} />
              </TouchableOpacity>
            </ThemedView>
        <ThemedView className="flex-1 " style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
          <ThemedView className="bg-background rounded-t-2xl px-6 pt-6 pb-10  h-full">

            <ThemedScrollView className=''>
              <ThemedView className="mb-4">
                <ThemedText size="sm" variant="secondary" className="mb-2">License Plate</ThemedText>
                <DropdownSearch
                  data={licenses}
                  selected={license}
                  onSelect={setLicense}
                  
                />
              </ThemedView>
              
              <ThemedView className="mb-4">
                <ThemedText size="sm" variant="secondary" className="mb-2">Infraction Type</ThemedText>
                <InfractionTypeSelector onSelect={setInfractionType} selectedInfractionType={infractionType} showAmount={false}/>
              </ThemedView>

              <ThemedView className="mb-4">
                <ThemedText size="sm" variant="secondary" className="mb-2">Ticket Status</ThemedText>
                <DropdownSearch
                  data={statuses}
                  selected={status}
                  onSelect={setStatus}
                />
              </ThemedView>

              <ThemedView className="mb-4">
                <ThemedText size="sm" variant="secondary" className="mb-2">City</ThemedText>
                <DropdownSearch
                  data={cities.map(c => c.city)}
                  selected={city}
                  onSelect={setCity}
                  searchable
                />
              </ThemedView>

              <ThemedView className="mb-4">
                <ThemedText size="sm" variant="secondary" className="mb-2">Start Date</ThemedText>
                <DatePicker value={startDate} onChange={setStartDate} />
              </ThemedView>

              <ThemedView className="mb-4">
                <ThemedText size="sm" variant="secondary" className="mb-2">End Date</ThemedText>
                <DatePicker value={endDate} onChange={setEndDate} />
              </ThemedView>
            </ThemedScrollView>

            {/* Apply Button */}
            <ThemedView className="">
              <ThemedButton
                variant="primary"
                size="lg"
                onPress={handleApply}
                className="mt-6"
              >
                Apply Filters
              </ThemedButton>

            </ThemedView>
          </ThemedView>
        </ThemedView>
    </AppLayout>
      </Modal>

  );
}
