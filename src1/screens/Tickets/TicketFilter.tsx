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
import { setFilters } from '../../redux/ticketFilterSlice';
import { ThemedView, ThemedText, ThemedInput, ThemedButton, ThemedCard, ThemedScrollView } from '../../components/ThemedComponents';

// Simple Dropdown component
interface DropdownProps {
  data: string[];
  selected: string;
  onSelect: (value: string) => void;
  searchable?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({ data, selected, onSelect, searchable }) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredData = searchable 
    ? data.filter(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
    : data;
  
  return (
    <ThemedView className="relative">
      <TouchableOpacity 
        onPress={() => setIsOpen(!isOpen)}
        className="border border-border rounded-lg p-3 flex-row justify-between items-center bg-background"
      >
        <ThemedText variant="secondary">{selected}</ThemedText>
        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color={theme === 'dark' ? '#9CA3AF' : '#666666'} />
      </TouchableOpacity>
      
      {isOpen && (
        <ThemedCard variant="elevated" className="absolute top-full left-0 right-0 mt-1 z-10 max-h-48">
          {searchable && (
            <ThemedInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search..."
              className="border-b border-border"
            />
          )}
          <ThemedScrollView>
            {filteredData.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  onSelect(item);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="p-3 border-b border-border"
              >
                <ThemedText variant="secondary">{item}</ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedScrollView>
        </ThemedCard>
      )}
    </ThemedView>
  );
};

// Simple DatePicker component
interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange }) => {
  return (
    <TouchableOpacity 
      onPress={() => {
        // In a real app, you'd open a proper date picker here
        onChange(new Date());
      }}
      className="border border-border rounded-lg p-3 bg-background"
    >
      <ThemedText variant="secondary">
        {value ? value.toLocaleDateString() : 'Select Date'}
      </ThemedText>
    </TouchableOpacity>
  );
};

const vehicleTypes = ['All', 'Car', 'Truck', 'Motorcycle', 'SUV'];
const cities = ['Toronto', 'Mississauga', 'Ottawa', 'Vancouver'];
const statuses = ['All', 'Outstanding', 'Paid', 'Disputed'];

export default function TicketFilter({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const [vehicleType, setVehicleType] = useState('All');
  const [status, setStatus] = useState('All');
  const [city, setCity] = useState('Toronto');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleApply = () => {
    dispatch(
      setFilters({
        vehicleType,
        status,
        city,
        startDate,
        endDate,
      })
    );
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <ThemedView className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
        <ThemedView className="bg-background rounded-t-2xl px-4 pt-6 pb-10">
          {/* Header */}
          <ThemedView className="flex-row justify-between items-center mb-4">
            <ThemedText size="lg" weight="bold">Filter Tickets</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme === 'dark' ? '#FFFFFF' : '#1E1E1E'} />
            </TouchableOpacity>
          </ThemedView>

          <ThemedScrollView>
            <ThemedView className="mb-4">
              <ThemedText size="sm" variant="secondary" className="mb-2">Vehicle Type</ThemedText>
              <Dropdown
                data={vehicleTypes}
                selected={vehicleType}
                onSelect={setVehicleType}
              />
            </ThemedView>

            <ThemedView className="mb-4">
              <ThemedText size="sm" variant="secondary" className="mb-2">Ticket Status</ThemedText>
              <Dropdown
                data={statuses}
                selected={status}
                onSelect={setStatus}
              />
            </ThemedView>

            <ThemedView className="mb-4">
              <ThemedText size="sm" variant="secondary" className="mb-2">City</ThemedText>
              <Dropdown
                data={cities}
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
    </Modal>
  );
}
