import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AppLayout from '../../wrappers/layout';
import { useHomeStackNavigation } from '../../navigation/hooks';
import {
  ThemedView,
  ThemedText,
  ThemedButton,
  ThemedCard,
  ThemedScrollView,
  StatusBadge,
} from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';

const vehicles = [
  { id: 1, name: 'Tesla Model 3', plate: 'ABC 123' },
  { id: 2, name: 'Toyota Camry', plate: 'XYZ 789' },
];

const recentLocations = [
  {
    id: 1,
    name: 'Downtown Parking',
    address: '123 Rideau Street',
    time: '2 hours ago',
  },
  {
    id: 2,
    name: 'Bay Street Garage',
    address: '456 Bay Street',
    time: 'Yesterday',
  },
];

export default function HomeScreen() {
  const navigation = useHomeStackNavigation();
  const { theme } = useTheme();

  //get todays date
  const date = new Date();
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <AppLayout scrollable={false}>
      <ThemedScrollView className='flex-1 px-4 pt-4'>
        {/* Header */}
        <ThemedView className='flex-row justify-between items-center mb-4'>
          <ThemedView>
            <ThemedText size='xl' weight='bold' className='text-primary'>
              MooseTicket
            </ThemedText>
          </ThemedView>

          <TouchableOpacity
            onPress={() => {
              // Handle notification press here
              navigation.navigate('Notifications');
            }}
            className='relative mr-4'
            activeOpacity={0.7}
          >
            <Ionicons
              name='notifications-outline'
              size={24}
              color={theme === 'dark' ? '#FFA366' : '#10472B'}
            />
            <ThemedView
              className='absolute -top-1 -right-3 bg-danger rounded-full w-5 h-5 items-center justify-center'
              style={{ minWidth: 20, minHeight: 20 }}
            >
              <ThemedText size='' weight='bold' variant='error'>
                1
              </ThemedText>
            </ThemedView>
          </TouchableOpacity>
        </ThemedView>

        {/* Greeting */}
        <ThemedView className='mb-6'>
          <ThemedView className='flex-row justify-between items-start'>
            <ThemedView className='flex-1'>
              <ThemedText size='2xl' weight='bold' variant='primary'>
                Good Morning, Anton
              </ThemedText>
              <ThemedText variant='secondary' className='mt-1'>
                Your parking status at a glance
              </ThemedText>
              <ThemedText variant='tertiary' size='sm'>
                {formattedDate}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Active Ticket */}
        <ThemedCard className='mb-4'>
          <ThemedText size='sm' weight='semibold' className='mb-1 text-primary'>
            Active Ticket
          </ThemedText>
          <ThemedText
            size='lg'
            weight='bold'
            variant='primary'
            className='mb-1'
          >
            Downtown Ottawa - Zone A
          </ThemedText>
          <ThemedText weight='semibold' size='lg' className='mb-2 text-warning'>
            1h 23m left
          </ThemedText>
          <ThemedText variant='secondary' size='sm' className='mb-2'>
            Tesla Model 3 • ABC 123
          </ThemedText>
          <ThemedView className='h-2 w-full bg-background-secondary rounded-full overflow-hidden'>
            <ThemedView className='h-2 bg-warning w-2/3 rounded-full' />
          </ThemedView>
        </ThemedCard>

        {/* Action Buttons */}
        <ThemedView className='flex-row justify-between mb-6'>
          {[
            { icon: 'time-outline', label: 'Extend\nTime', route: '' },
            { icon: 'add', label: 'New\nTicket', route: 'AddTicket' },
            {
              icon: 'calendar-outline',
              label: 'Billing History',
              route: 'BillingHistory',
            },
          ].map(({ icon, label, route }, i) => (
            <ThemedButton
              key={i}
              variant={theme === 'dark' ? 'outline' : 'outline'}
              className='flex-1 mx-1 rounded-xl items-center justify-center'
              onPress={() => route && navigation.navigate(route as any)}
            >
              <ThemedView className='flex-col items-center justify-between w-full h-20 rounded-xl bg-background-tertiary py-1'>
                <Ionicons
                  name={icon as any}
                  size={22}
                  color={theme === 'dark' ? '#FFA366' : '#10472B'}
                />
                <ThemedText
                  variant='secondary'
                  size='sm'
                  className='text-center mt-1 w-14'
                  weight='semibold'
                >
                  {label}
                </ThemedText>
              </ThemedView>
            </ThemedButton>
          ))}
        </ThemedView>

        {/* Recent Locations */}
        <ThemedText weight='bold' size='lg' className='mb-2'>
          Recent Locations
        </ThemedText>
        <ThemedView className='mb-6'>
          {recentLocations.map((loc) => (
            <TouchableOpacity
              key={loc.id}
              className='flex-row items-center justify-between'
            >
              <ThemedCard
                variant='flat'
                className='flex-1 mb-3 bg-background-secondary'
              >
                <ThemedView className='flex-row items-center justify-between rounded-xl'>
                  <ThemedView className='flex-row items-center rounded-xl px-2'>
                    <ThemedView className='bg-success-light p-2 rounded-xl mr-3'>
                      <Ionicons
                        name='location-outline'
                        size={18}
                        color={theme === 'dark' ? '#FFA366' : '#10472B'}
                      />
                    </ThemedView>
                    <ThemedView>
                      <ThemedText
                        size='base'
                        weight='semibold'
                        variant='primary'
                      >
                        {loc.name}
                      </ThemedText>
                      <ThemedText variant='secondary' size='sm'>
                        {loc.address}
                      </ThemedText>
                      <ThemedText variant='tertiary' size='xs' className='my-1'>
                        {loc.time}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <Ionicons
                    name='chevron-forward'
                    size={18}
                    color={theme === 'dark' ? '#9CA3AF' : '#A0A0A0'}
                  />
                </ThemedView>
              </ThemedCard>
            </TouchableOpacity>
          ))}
        </ThemedView>

        {/* Vehicles */}
        <ThemedText weight='bold' size='lg' className='mb-2'>
          Your Vehicles
        </ThemedText>
        <FlatList
          data={vehicles}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ThemedCard
              variant='flat'
              className='mr-4 w-40 bg-background-secondary'
            >
              <ThemedView className='mb-3 w-5 bg-inherit'>
                <Ionicons
                  name='car-outline'
                  size={20}
                  color={theme === 'dark' ? '#FFA366' : '#10472B'}
                  className='bg-background-secondary'
                />
              </ThemedView>
              <ThemedText size='base' weight='semibold' variant='primary'>
                {item.name}
              </ThemedText>
              <ThemedText variant='secondary' size='sm'>
                {item.plate}
              </ThemedText>
            </ThemedCard>
          )}
        />
      </ThemedScrollView>
    </AppLayout>
  );
}
