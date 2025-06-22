import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../../wrappers/layout';
import GoBackHeader from '../../components/GoBackHeader';
import {
  ThemedView,
  ThemedText,
  ThemedButton,
  ThemedCard,
  ThemedScrollView,
  StatusBadge,
} from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchBillingHistory } from '../../store/slices/subscriptionSlice';

// Move dateRangeOptions inside component to use translations

export default function BillingHistory() {
  const [filter, setFilter] = useState('All');
  const { theme } = useTheme();
  const { t } = useTranslation();
  
  const dateRangeOptions = [
    { key: 'All', label: t('common.all') },
    { key: 'Last 30 Days', label: t('billing.last30Days') },
    { key: 'Last 3 Months', label: t('billing.last3Months') }
  ];
  const dispatch = useAppDispatch();

  // Redux state
  const billingHistory = useAppSelector(state => state.subscriptions.billingHistory);
  const currentSubscription = useAppSelector(state => state.subscriptions.currentSubscription);
  const loading = useAppSelector(state => state.subscriptions.loading);
  const error = useAppSelector(state => state.subscriptions.error);

  // Fetch billing history on mount
  useEffect(() => {
    if (currentSubscription) {
      dispatch(fetchBillingHistory({ page: 1, limit: 50 }));
    }
  }, [dispatch, currentSubscription]);

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert(t('common.error'), error);
    }
  }, [error, t]);

  const now = new Date();

  const filteredData = billingHistory.filter((item) => {
    const itemDate = new Date(item.createdAt);
    if (filter === 'All') {
        return true;
    } else if (filter === 'Last 30 Days') {
        const cutoff = new Date();
        cutoff.setDate(now.getDate() - 30);
        return itemDate >= cutoff;
    } else if (filter === 'Last 3 Months') {
        const cutoff = new Date();
        cutoff.setMonth(now.getMonth() - 3);
        return itemDate >= cutoff;
    }
    return false;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return { status: 'success' as const, label: t('billing.paid') };
      case 'pending':
        return { status: 'warning' as const, label: t('billing.pending') };
      case 'failed':
        return { status: 'error' as const, label: t('billing.failed') };
      case 'refunded':
        return { status: 'info' as const, label: t('billing.refunded') };
      case 'partially_refunded':
        return { status: 'warning' as const, label: t('billing.partialRefund') };
      default:
        return { status: 'info' as const, label: status };
    }
  };

  const handleDownloadInvoice = async (billingId: string, invoiceNumber: string) => {
    try {
      // Construct the download URL
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const downloadUrl = `${baseUrl}/api/subscriptions/billing/${billingId}/invoice`;
      
      // For web, we can use fetch to download
      if (Platform.OS === 'web') {
        const token = localStorage.getItem('token');
        const response = await fetch(downloadUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `invoice-${invoiceNumber}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          throw new Error(t('billing.downloadInvoiceFailed'));
        }
      } else {
        // For mobile, open in browser
        const token = localStorage.getItem('token') || 'dummy-token';
        const urlWithAuth = `${downloadUrl}?token=${token}`;
        const supported = await Linking.canOpenURL(urlWithAuth);
        
        if (supported) {
          await Linking.openURL(urlWithAuth);
        } else {
          Alert.alert(t('common.error'), t('billing.cannotOpenInvoiceLink'));
        }
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('billing.downloadInvoiceError'));
    }
  };

  return (
    <AppLayout scrollable={false}>
    <ThemedScrollView className="flex-1 px-5">
      {/* Header */}
      <GoBackHeader screenTitle={t('subscription.billingHistory')} />

      {/* Filters */}
      <ThemedView className="mb-6">
        {/* Date Range */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {dateRangeOptions.map((range) => (
            <ThemedButton
              key={range.key}
              variant={filter === range.key ? 'primary' : 'outline'}
              size='sm'
              onPress={() => setFilter(range.key)}
              className='mr-2 rounded-full'
            >
              <ThemedText
                size='sm'
                variant={filter === range.key ? 'inverse' : 'primary'}
              >
                {range.label}
              </ThemedText>
            </ThemedButton>
          ))}
        </ScrollView>
      </ThemedView>

      {/* Loading State */}
      {loading.billing && filteredData.length === 0 && (
        <ThemedView className="flex-1 justify-center items-center">
          <ThemedText>{t('billing.loadingBillingHistory')}</ThemedText>
        </ThemedView>
      )}

      {/* Billing Items */}
      {filteredData.length > 0 ? (
        filteredData.map((item) => {
          const statusBadge = getStatusBadge(item.status);
          return (
            <ThemedCard
              key={item._id}
              className="mb-4"
            >
              <ThemedView className="flex-row justify-between items-center mb-1">
                <ThemedText size='base' weight='semibold' variant='primary'>
                  {formatDate(item.createdAt)}
                </ThemedText>
                <StatusBadge 
                  status={statusBadge.status}
                  label={statusBadge.label}
                  size='sm'
                />
              </ThemedView>
              
              <ThemedView className="flex-row justify-between items-center mb-1">
                <ThemedText variant='secondary'>{t('billing.invoiceNumber', { number: item.invoiceNumber })}</ThemedText>
                <ThemedText size='sm' variant='tertiary'>
                  {item.type === 'subscription' ? t('billing.subscription') : 
                   item.type === 'refund' ? t('billing.refund') : t('billing.payment')}
                </ThemedText>
              </ThemedView>
              
              <ThemedText variant='secondary' className='mt-1'>
                {t('billing.amount')}: {formatAmount(item.totalAmount, item.currency)}
              </ThemedText>
              
              {item.paymentMethod && (
                <ThemedText variant='secondary'>
                  {t('billing.paidWith')}: {item.paymentMethod.brand} •••• {item.paymentMethod.last4}
                </ThemedText>
              )}
              
              {item.status === 'paid' && item.invoiceNumber && (
                <TouchableOpacity 
                  className="mt-3 items-end"
                  onPress={() => handleDownloadInvoice(item._id, item.invoiceNumber)}
                >
                  <ThemedView className="flex-row items-center">
                    <Ionicons 
                      name="download-outline" 
                      size={16} 
                      color={theme === 'dark' ? '#3B82F6' : '#2563EB'}
                      style={{ marginRight: 4 }}
                    />
                    <ThemedText 
                      className="underline" 
                      size='sm'
                      style={{ color: theme === 'dark' ? '#3B82F6' : '#2563EB' }}
                    >
{t('billing.downloadInvoice')}
                    </ThemedText>
                  </ThemedView>
                </TouchableOpacity>
              )}
            </ThemedCard>
          );
        })
      ) : !loading.billing ? (
        <ThemedView className="mt-20 items-center">
          <Ionicons
            name="receipt-outline"
            size={64}
            color={theme === 'dark' ? '#4A5158' : '#9CA3AF'}
            style={{ marginBottom: 16 }}
          />
          <ThemedText variant='tertiary' size='lg' className="mb-2">
            {t('billing.noBillingRecords')}
          </ThemedText>
          <ThemedText variant='secondary' className="text-center">
            {filter === 'All' 
              ? t('billing.noBillingHistoryYet')
              : t('billing.noRecordsForPeriod', { period: dateRangeOptions.find(opt => opt.key === filter)?.label.toLowerCase() })
            }
          </ThemedText>
        </ThemedView>
      ) : null}
    </ThemedScrollView>
    </AppLayout>
  );
}
