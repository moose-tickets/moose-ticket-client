import React, { useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useInfractionTypes } from '../hooks/useInfractionTypes';

interface InfractionTypeListProps {
  category?: 'stationary' | 'moving';
  onSelectInfractionType?: (infractionType: any) => void;
}

export const InfractionTypeList: React.FC<InfractionTypeListProps> = ({ 
  category, 
  onSelectInfractionType 
}) => {
  const {
    infractionTypes,
    filteredInfractionTypes,
    loading,
    error,
    categories,
    filters,
    setInfractionTypeFilter,
    clearInfractionTypeFilters,
    refetchInfractionTypes
  } = useInfractionTypes();

  // Set category filter when prop changes
  useEffect(() => {
    if (category) {
      setInfractionTypeFilter('category', category);
    } else {
      setInfractionTypeFilter('category', null);
    }
  }, [category, setInfractionTypeFilter]);

  const handleSearch = (searchTerm: string) => {
    setInfractionTypeFilter('search', searchTerm);
  };

  const handleCategoryFilter = (selectedCategory: string | null) => {
    setInfractionTypeFilter('category', selectedCategory);
  };

  const getIconForType = (iconName: string) => {
    // Map common icon names to emojis for React Native
    const iconMap: { [key: string]: string } = {
      'clock-outline': '⏰',
      'car-brake-parking': '🅿️',
      'stop-circle-outline': '🛑',
      'swap-horizontal': '↔️',
      'tow-truck': '🚗',
      'wheelchair-accessibility': '♿',
      'fire-hydrant': '🚒',
      'bus-stop': '🚌',
      'walk': '🚶',
      'car-multiple': '🚗🚗',
      'truck-fast': '🚚',
      'weather-snowy': '❄️',
      'home-city-outline': '🏠',
      'card-account-details': '💳',
      'garage': '🏠',
      'speedometer': '🏃',
      'traffic-light': '🚦',
      'hand-pointing-up': '✋',
      'arrow-u-down-left': '↩️',
      'arrow-left-bold': '⬅️',
      'speedometer-medium': '🏃‍♂️',
      'car-off': '🚫',
      'cellphone-off': '📵',
      'seatbelt': '🔗',
      'glass-cocktail-off': '🚫🍸',
      'card-account-details-outline': '💳',
      'card-bulleted-off-outline': '📋',
      'traffic-cone': '🚧',
      'align-horizontal-distribute': '↔️',
      'cards-diamond-outline': '♦️',
      'gamepad': '🎮',
    };
    return iconMap[iconName] || '📋';
  };

  const renderInfractionType = (infractionType: any) => (
    <TouchableOpacity
      key={infractionType.id}
      style={styles.infractionItem}
      onPress={() => onSelectInfractionType?.(infractionType)}
      disabled={!onSelectInfractionType}
    >
      <View style={styles.infractionHeader}>
        <Text style={styles.infractionIcon}>
          {getIconForType(infractionType.icon)}
        </Text>
        <View style={styles.infractionContent}>
          <View style={styles.infractionTitleRow}>
            <Text style={styles.infractionTitle}>{infractionType.type}</Text>
            <View style={styles.infractionBadges}>
              <View style={[
                styles.categoryBadge,
                { backgroundColor: infractionType.category === 'moving' ? '#ff6b6b' : '#4ecdc4' }
              ]}>
                <Text style={styles.categoryText}>{infractionType.category}</Text>
              </View>
              <Text style={styles.fineAmount}>${infractionType.baseFine}</Text>
            </View>
          </View>
          <Text style={styles.infractionDescription}>
            {infractionType.description}
          </Text>
          <View style={styles.infractionDetails}>
            <Text style={styles.detailText}>Code: {infractionType.code}</Text>
            <Text style={styles.detailText}>Points: {infractionType.points}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading infraction types...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => refetchInfractionTypes()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Infraction Types ({filteredInfractionTypes.length})
        </Text>
        
        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search infraction types..."
          value={filters.search}
          onChangeText={handleSearch}
        />

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              !filters.category && styles.filterButtonActive
            ]}
            onPress={() => handleCategoryFilter(null)}
          >
            <Text style={[
              styles.filterButtonText,
              !filters.category && styles.filterButtonTextActive
            ]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterButton,
                filters.category === cat && styles.filterButtonActive
              ]}
              onPress={() => handleCategoryFilter(cat)}
            >
              <Text style={[
                styles.filterButtonText,
                filters.category === cat && styles.filterButtonTextActive
              ]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Infraction Types List */}
      <ScrollView style={styles.listContainer}>
        {filteredInfractionTypes.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No infraction types found</Text>
          </View>
        ) : (
          filteredInfractionTypes.map(renderInfractionType)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchInput: {
    width: '100%',
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  filterButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  filterButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    flex: 1,
  },
  infractionItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infractionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infractionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infractionContent: {
    flex: 1,
  },
  infractionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infractionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  infractionBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  fineAmount: {
    fontWeight: '600',
    color: '#e74c3c',
    fontSize: 14,
  },
  infractionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  infractionDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailText: {
    fontSize: 12,
    color: '#888',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default InfractionTypeList;