import React, { useState } from 'react';
import { Modal, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useInfractionTypes } from '../hooks/useInfractionTypes';
import { InfractionType } from '../store/slices/infractionTypeSlice';
import {
  ThemedView,
  ThemedText,
  ThemedButton,
  ThemedCard,
  ThemedScrollView,
} from './ThemedComponents';
import { useTheme } from '../wrappers/ThemeProvider';

interface InfractionTypeSelectorProps {
  selectedInfractionType?: InfractionType | null;
  onSelect: (infractionType: InfractionType) => void;
  placeholder?: string;
  style?: any;
}

export const InfractionTypeSelector: React.FC<InfractionTypeSelectorProps> = ({
  selectedInfractionType,
  onSelect,
  placeholder = 'Select violation type',
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { theme } = useTheme();
  const {
    filteredInfractionTypes,
    loading,
    error,
    categories,
    filters,
    setInfractionTypeFilter,
  } = useInfractionTypes();

  const getIconForType = (iconName: string) => {
    const iconMap: { [key: string]: string } = {
      'clock-outline': '⏰',
      'car-brake-parking': '🅿️',
      speedometer: '🏃',
      'traffic-light': '🚦',
      'fire-hydrant': '🚒',
      'wheelchair-accessibility': '♿',
      'cellphone-off': '📵',
      seatbelt: '🔗',
    };
    return iconMap[iconName] || '📋';
  };

  const handleSelect = (infractionType: InfractionType) => {
    onSelect(infractionType);
    setModalVisible(false);
  };

  const renderInfractionType = ({ item }: { item: InfractionType }) => (
    <ThemedCard variant='flat' className='mx-2 my-1'>
      <ThemedButton
        variant='ghost'
        onPress={() => handleSelect(item)}
        className='p-3'
      >
        <ThemedView className='flex-row items-start mb-2'>
          <MaterialCommunityIcons
            name={item.icon as any}
            size={20}
            color={theme === 'dark' ? '#FFA366' : '#E18743'}
            style={{ marginRight: 8 }}
          />
          <ThemedView className='flex-1'>
            <ThemedText weight='semibold' size='sm'>
              {item.type}
            </ThemedText>
            <ThemedText variant='secondary' size='xs' className='mt-1'>
              Code: {item.code}
            </ThemedText>
          </ThemedView>
          <ThemedView className='items-end'>
            <ThemedView
              className='px-2 py-1 rounded-lg mb-1'
              style={{
                backgroundColor:
                  item.category === 'moving' ? '#ff6b6b' : '#4ecdc4',
              }}
            >
              <ThemedText
                size='xs'
                style={{ color: 'white', fontWeight: '500' }}
              >
                {item.category}
              </ThemedText>
            </ThemedView>
            <ThemedText
              weight='semibold'
              size='xs'
              style={{ color: '#e74c3c' }}
            >
              ${item.baseFine}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        <ThemedText
          variant='secondary'
          size='xs'
          numberOfLines={2}
          className='leading-4'
        >
          {item.description}
        </ThemedText>
      </ThemedButton>
    </ThemedCard>
  );

  const renderCategoryFilter = () => (
    <ThemedView
      horizontal
      showsHorizontalScrollIndicator={false}
      className='px-4 py-3 bg-background border-b border-border'
    >
      <ThemedView className='flex-row justify-start items-start mb-4'>
        <ThemedButton
          variant={!filters.category ? 'primary' : 'outline'}
          size='sm'
          onPress={() => setInfractionTypeFilter('category', null)}
          className='rounded-full mr-3'
        >
          <ThemedText
            size='xs'
            weight='medium'
            style={{
              color: !filters.category
                ? 'white'
                : theme === 'dark'
                ? '#FFA366'
                : '#E18743',
            }}
          >
            All
          </ThemedText>
        </ThemedButton>
        {categories.map((category) => (
          <ThemedButton
            key={category}
            variant={filters.category === category ? 'primary' : 'outline'}
            size='sm'
            onPress={() => setInfractionTypeFilter('category', category)}
            className='rounded-full mr-3'
          >
            <ThemedText
              size='xs'
              weight='medium'
              style={{
                color:
                  filters.category === category
                    ? 'white'
                    : theme === 'dark'
                    ? '#FFA366'
                    : '#E18743',
              }}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </ThemedText>
          </ThemedButton>
        ))}
      </ThemedView>
    </ThemedView>
  );

  return (
    <>
      <ThemedButton
        variant='outline'
        onPress={() => setModalVisible(true)}
        className='border border-border rounded-xl px-4 py-3 bg-background'
        style={style}
      >
        <ThemedView className='flex-row justify-between items-center'>
          {selectedInfractionType ? (
            <ThemedView className='flex-row items-start flex-1'>
              <ThemedText size='lg' className='mr-2'>
                <MaterialCommunityIcons
                  name={selectedInfractionType.icon as any}
                  size={20}
                  color={theme === 'dark' ? '#FFA366' : '#E18743'}
                  style={{ marginRight: 8 }}
                />
              </ThemedText>
              <ThemedView className='flex-1'>
                <ThemedText weight='medium' size='sm'>
                  {selectedInfractionType.type}
                </ThemedText>
                <ThemedText variant='secondary' size='xs' className='mt-1'>
                  {selectedInfractionType.code} • $
                  {selectedInfractionType.baseFine}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          ) : (
            <ThemedText variant='tertiary' className='flex-1'>
              {placeholder}
            </ThemedText>
          )}
          <Ionicons
            name='chevron-down'
            size={20}
            color={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
          />
        </ThemedView>
      </ThemedButton>

      <Modal
        visible={modalVisible}
        animationType='slide'
        presentationStyle='pageSheet'
      >
        <SafeAreaView className='flex-1 bg-background'>
          <ThemedView className='flex-row justify-between items-center p-4 bg-background border-b border-border'>
            <ThemedText weight='semibold' size='lg'>
              Select Violation Type
            </ThemedText>
            <ThemedButton
              variant='ghost'
              onPress={() => setModalVisible(false)}
              className='p-1'
            >
              <Ionicons
                name='close'
                size={24}
                color={theme === 'dark' ? '#FFA366' : '#E18743'}
              />
            </ThemedButton>
          </ThemedView>

          {renderCategoryFilter()}

          {loading ? (
            <ThemedView className='flex-1 justify-center items-center p-5'>
              <ThemedText>Loading violation types...</ThemedText>
            </ThemedView>
          ) : error ? (
            <ThemedView className='flex-1 justify-center items-center p-5'>
              <ThemedText variant='error' className='text-center mb-4'>
                Error: {error}
              </ThemedText>
            </ThemedView>
          ) : (
            <FlatList
              data={filteredInfractionTypes}
              renderItem={renderInfractionType}
              keyExtractor={(item) => item._id}
              className='flex-1 bg-background'
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingVertical: 8 }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
};

export default InfractionTypeSelector;
