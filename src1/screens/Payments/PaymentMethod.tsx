import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import AppLayout from '../../wrappers/layout';
import Dialog from '../../components/Dialog';
import { useTicketStackNavigation } from '../../navigation/hooks';
import GoBackHeader from '../../components/GoBackHeader';
import { ThemedView, ThemedText, ThemedCard, ThemedButton } from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';

const dummyCards = [
  {
    id: '1',
    type: 'Visa',
    number: '**** **** **** 1234',
    expiry: '04/26',
    expired: false,
    isDefault: true,
  },
  {
    id: '2',
    type: 'Mastercard',
    number: '**** **** **** 5678',
    expiry: '12/23',
    expired: true,
    isDefault: false,
  },
];

export default function PaymentMethod() {
  const navigation = useTicketStackNavigation();
  const { theme } = useTheme();
  const [cards, setCards] = useState(dummyCards);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [infoDialogVisible, setInfoDialogVisible] = useState(false);
  const [dialogProps, setDialogProps] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'error' | 'warning',
  });

  const handleConfirmDelete = () => {
    const deletingCard = cards.find((c) => c.id === cardToDelete);
    const remainingActive = cards.filter(
      (c) => c.id !== cardToDelete && !c.expired
    );

    if (deletingCard && !deletingCard.expired && remainingActive.length === 0) {
      setDialogProps({
        title: 'Cannot Delete Card',
        message:
          'You must have at least one active (non-expired) card on file.',
        type: 'warning',
      });
      setInfoDialogVisible(true);
      setCardToDelete(null);
      setConfirmDialogVisible(false);
      return;
    }

    setCards((prev) => prev.filter((c) => c.id !== cardToDelete));
    setCardToDelete(null);
    setConfirmDialogVisible(false);
  };

  const renderRightActions = (id: string) => (
    <TouchableOpacity
      onPress={() => {
        setCardToDelete(id);
        setDialogProps({
          title: 'Delete Card',
          message: 'Are you sure you want to delete this card?',
          type: 'warning',
        });
        setConfirmDialogVisible(true);
      }}
      className='bg-error justify-center px-6 rounded-r-xl'
    >
      <Ionicons name='trash-outline' size={24} color='white' />
    </TouchableOpacity>
  );

  const renderLeftActions = (id: string) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('EditPaymentMethod', { cardId: id })}
      className='bg-primary justify-center px-6 rounded-l-xl'
    >
      <Ionicons name='create-outline' size={24} color='white' />
    </TouchableOpacity>
  );

  const handleSetDefault = (id: string) => {
    setCards((prev) =>
      prev.map((card) => ({
        ...card,
        isDefault: card.id === id,
      }))
    );
  };

  return (
    <AppLayout scrollable={false}>
       {/* Header */}
          <GoBackHeader screenTitle='Payment Method' />

      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <Swipeable
            renderLeftActions={() => renderLeftActions(item.id)}
            renderRightActions={() => renderRightActions(item.id)}
          >
            <ThemedCard className='mb-3'>
              <ThemedView className='flex-row justify-between items-center mb-1'>
                <ThemedView className='flex-row items-center space-x-2'>
                  <TouchableOpacity
                    onPress={() => handleSetDefault(item.id)}
                    className={`w-6 h-6 rounded-full border-2 ${
                      item.isDefault
                        ? 'border-primary bg-primary'
                        : 'border-border bg-background'
                    } items-center justify-center mr-3`}
                  >
                    {item.isDefault && (
                      <Ionicons name='checkmark' size={16} color='white' />
                    )}
                  </TouchableOpacity>

                  <FontAwesome
                    name={
                      item.type.toLowerCase() === 'visa'
                        ? 'cc-visa'
                        : 'cc-mastercard'
                    }
                    size={24}
                    color={theme === 'dark' ? '#22C55E' : '#10472B'}
                  />
                  <ThemedText weight='semibold'>
                    {item.type}
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              <ThemedView className='flex-row justify-between items-center pl-9'>
                <ThemedText variant='secondary'>{item.number}</ThemedText>
                <ThemedView className='flex-column items-center space-x-2'>
                  <ThemedText size='sm' variant='tertiary'>{item.expiry}</ThemedText>
                  {item.expired && (
                    <ThemedText size='xs' weight='medium' className='text-red-500'>
                      Expired
                    </ThemedText>
                  )}
                </ThemedView>
              </ThemedView>
            </ThemedCard>
          </Swipeable>
        )}
      />

      <ThemedView className='absolute bottom-6 left-6 right-6'>
        <ThemedButton
          onPress={() => navigation.navigate('AddPaymentMethod')}
          variant='secondary'
          size='lg'
        >
          Add New Card
        </ThemedButton>
      </ThemedView>

      {/* Confirmation Dialog */}
      <Dialog
        visible={confirmDialogVisible}
        title={dialogProps.title}
        message={dialogProps.message}
        type={dialogProps.type}
        onClose={() => {
          setConfirmDialogVisible(false);
          setCardToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        confirmText='Delete'
      />

      {/* Info/Warning Dialog */}
      <Dialog
        visible={infoDialogVisible}
        title={dialogProps.title}
        message={dialogProps.message}
        type={dialogProps.type}
        onClose={() => setInfoDialogVisible(false)}
        onConfirm={() => setInfoDialogVisible(false)}
        confirmText='OK'
      />
    </AppLayout>
  );
}
