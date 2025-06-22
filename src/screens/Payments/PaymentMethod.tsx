import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import AppLayout from '../../wrappers/layout';
import Dialog from '../../components/Dialog';
import { useTicketStackNavigation } from '../../navigation/hooks';
import GoBackHeader from '../../components/GoBackHeader';
import { ThemedView, ThemedText, ThemedCard, ThemedButton } from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  fetchPaymentMethods, 
  deletePaymentMethod, 
  setDefaultPaymentMethod 
} from '../../store/slices/paymentSlice';

export default function PaymentMethod() {
  const navigation = useTicketStackNavigation();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  // Redux state
  const paymentMethods = useAppSelector(state => state.payments.paymentMethods);
  const loading = useAppSelector(state => state.payments.loading);
  const error = useAppSelector(state => state.payments.error);

  // Fetch payment methods on mount
  useEffect(() => {
    dispatch(fetchPaymentMethods());
  }, [dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert(t('common.error'), error);
    }
  }, [error, t]);

  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [infoDialogVisible, setInfoDialogVisible] = useState(false);
  const [dialogProps, setDialogProps] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'error' | 'warning',
  });

  const handleConfirmDelete = async () => {
    if (!cardToDelete) return;

    const deletingCard = paymentMethods.find((c) => c._id === cardToDelete);
    const remainingActive = paymentMethods.filter(
      (c) => c._id !== cardToDelete && !c.isExpired
    );

    if (deletingCard && !deletingCard.isExpired && remainingActive.length === 0) {
      setDialogProps({
        title: t('payments.cannotDeleteCard'),
        message: t('payments.mustHaveActiveCard'),
        type: 'warning',
      });
      setInfoDialogVisible(true);
      setCardToDelete(null);
      setConfirmDialogVisible(false);
      return;
    }

    try {
      await dispatch(deletePaymentMethod(cardToDelete)).unwrap();
      setCardToDelete(null);
      setConfirmDialogVisible(false);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('payments.deletePaymentMethodFailed'));
      setCardToDelete(null);
      setConfirmDialogVisible(false);
    }
  };

  const renderRightActions = (id: string) => (
    <TouchableOpacity
      onPress={() => {
        setCardToDelete(id);
        setDialogProps({
          title: t('payments.deleteCard'),
          message: t('payments.confirmDeleteCard'),
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

  const handleSetDefault = async (id: string) => {
    try {
      await dispatch(setDefaultPaymentMethod(id)).unwrap();
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('payments.setDefaultFailed'));
    }
  };

  const formatCardNumber = (cardNumber: string) => {
    // Show last 4 digits
    return `**** **** **** ${cardNumber.slice(-4)}`;
  };

  const formatExpiryDate = (expiryMonth: number, expiryYear: number) => {
    return `${expiryMonth.toString().padStart(2, '0')}/${expiryYear.toString().slice(-2)}`;
  };

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return 'cc-visa';
      case 'mastercard':
        return 'cc-mastercard';
      case 'amex':
      case 'american express':
        return 'cc-amex';
      case 'discover':
        return 'cc-discover';
      default:
        return 'credit-card';
    }
  };

  if (loading.fetch && paymentMethods.length === 0) {
    return (
      <AppLayout scrollable={false}>
        <GoBackHeader screenTitle={t('payments.paymentMethods')} />
        <ThemedView className='flex-1 justify-center items-center'>
          <ThemedText>{t('payments.loadingPaymentMethods')}</ThemedText>
        </ThemedView>
      </AppLayout>
    );
  }

  return (
    <AppLayout scrollable={false}>
       {/* Header */}
          <GoBackHeader screenTitle={t('payments.paymentMethods')} />

      {paymentMethods.length === 0 ? (
        <ThemedView className='flex-1 justify-center items-center px-4'>
          <Ionicons
            name="card-outline"
            size={64}
            color={theme === 'dark' ? '#4A5158' : '#9CA3AF'}
            style={{ marginBottom: 16 }}
          />
          <ThemedText size='lg' weight='semibold' className='mb-2 text-center'>
            {t('payments.noPaymentMethods')}
          </ThemedText>
          <ThemedText variant='secondary' className='text-center mb-6'>
            {t('payments.addPaymentMethodDescription')}
          </ThemedText>
          <ThemedButton
            onPress={() => navigation.navigate('AddPaymentMethod')}
            variant='primary'
            size='lg'
          >
{t('payments.addFirstCard')}
          </ThemedButton>
        </ThemedView>
      ) : (
        <FlatList
          data={paymentMethods}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <Swipeable
              renderLeftActions={() => renderLeftActions(item._id)}
              renderRightActions={() => renderRightActions(item._id)}
            >
              <ThemedCard className='mb-3'>
                <ThemedView className='flex-row justify-between items-center mb-1'>
                  <ThemedView className='flex-row items-center space-x-2'>
                    <TouchableOpacity
                      onPress={() => handleSetDefault(item._id)}
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
                      name={getCardIcon(item.brand)}
                      size={24}
                      color={theme === 'dark' ? '#22C55E' : '#10472B'}
                    />
                    <ThemedText weight='semibold'>
                      {item.brand}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                <ThemedView className='flex-row justify-between items-center pl-9'>
                  <ThemedText variant='secondary'>{formatCardNumber(item.last4)}</ThemedText>
                  <ThemedView className='flex-column items-center space-x-2'>
                    <ThemedText size='sm' variant='tertiary'>
                      {formatExpiryDate(item.expiryMonth, item.expiryYear)}
                    </ThemedText>
                    {item.isExpired && (
                      <ThemedText size='xs' weight='medium' className='text-red-500'>
                        {t('payments.expired')}
                      </ThemedText>
                    )}
                  </ThemedView>
                </ThemedView>
              </ThemedCard>
            </Swipeable>
          )}
        />
      )}

      <ThemedView className='absolute bottom-6 left-6 right-6'>
        <ThemedButton
          onPress={() => navigation.navigate('AddPaymentMethod')}
          variant='secondary'
          size='lg'
        >
{t('payments.addCard')}
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
