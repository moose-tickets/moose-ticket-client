import { useTheme } from '@react-navigation/native';
import React, { useState } from 'react';
import { ScrollView, TouchableOpacity} from 'react-native';
import { ThemedCard, ThemedInput, ThemedText, ThemedView } from './ThemedComponents';
import { Ionicons } from '@expo/vector-icons';

interface DropdownSearchProps {
  data: string[];
  selected: string;
  onSelect: (value: string) => void;
  searchable?: boolean;
}

const DropdownSearch: React.FC<DropdownSearchProps> = ({ data, selected, onSelect, searchable }) => {
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
        <ThemedCard
          variant="elevated"
          className="absolute top-full left-0 right-0 mt-0 z-10 max-h-150 border border-t-0 rounded-tl-none rounded-tr-none overflow-hidden"
          style={{ maxHeight: 240 }} // Ensures the dropdown doesn't exceed 240px
        >
          {searchable && (
            <ThemedInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search..."
              className="border-b border-border"
            />
          )}
          <ScrollView style={{ maxHeight: 200 }}>
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
          </ScrollView>
        </ThemedCard>
      )}
    </ThemedView>
  )
}

export default DropdownSearch;