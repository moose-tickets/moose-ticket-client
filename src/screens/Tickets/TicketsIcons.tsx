// src/components/InfractionList.tsx
import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function InfractionList() {
  const renderItem = ({ item }: { item: InfractionType }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 mb-2 bg-light dark:bg-dark rounded-lg"
      onPress={() => console.log('Selected infraction:', item.code)}
    >
      <MaterialCommunityIcons
        name={item.icon as any}
        size={24}
        className="text-primary dark:text-secondary mr-4"
      />
      <View>
        <Text className="text-base text-dark dark:text-light">{item.type}</Text>
        <Text className="text-xs text-grey dark:text-light">{item.code}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={infractionTypes}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ padding: 16 }}
      renderItem={renderItem}
      ListEmptyComponent={
        <View className="items-center mt-10">
          <Text className="text-grey dark:text-light">No infractions available.</Text>
        </View>
      }
    />
  );
}
