// src/screens/Tickets/TicketDetail.tsx

import React, { useEffect, useState } from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTicketStackNavigation } from '../../navigation/hooks';
import { TicketStackParamList } from '../../navigation/types';
import { useTheme } from '../../wrappers/ThemeProvider';
import AppLayout from '../../wrappers/layout';

import MapWebView from '../../components/MapWebView';
import GoBackHeader from '../../components/GoBackHeader';
import {
  ThemedView,
  ThemedText,
  ThemedCard,
  ThemedButton,
  ThemedScrollView,
  StatusBadge,
} from '../../components/ThemedComponents';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchTicket,
  selectCurrentTicket,
  selectTicketLoading,
  selectTicketError,
} from '../../store/slices/ticketSlice';
import ImageViewer from '../../components/ImageViewer';

export default function TicketDetail() {
  const navigation = useTicketStackNavigation();
  const { theme } = useTheme();
  const route = useRoute<RouteProp<TicketStackParamList, 'TicketDetail'>>();
  const ticketId = route.params.ticketId;
  const dispatch = useAppDispatch();

  // Redux state
  const ticket = useAppSelector(selectCurrentTicket);
  const isLoading = useAppSelector(selectTicketLoading);
  const error = useAppSelector(selectTicketError);

  // Local state
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [paymentCalculations, setPaymentCalculations] = useState({
    baseFine: 0,
    adminFee: 1,
    hst: '0',
    total: 0,
  });

  const toggleAccordion = (section: string) =>
    setOpenSection((prev) => (prev === section ? null : section));

  const openImageViewer = (index: number) => {
    setImageViewerIndex(index);
    setImageViewerVisible(true);
  };

  // Function to convert camelCase to readable labels
  const formatMetadataKey = (key: string): string => {
    return key
      // Insert space before uppercase letters
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Split on underscores and capitalize each word
      .replace(/_/g, ' ')
      // Capitalize first letter of each word
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
      // Handle specific cases
      .replace(/Id\b/g, 'ID')
      .replace(/Url\b/g, 'URL')
      .replace(/Api\b/g, 'API');
  };

  // Function to format metadata values
  const formatMetadataValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Fetch ticket data
  useEffect(() => {
    if (ticketId) {
      dispatch(fetchTicket(ticketId));
    }
  }, [ticketId, dispatch]);

  // Calculate payment breakdown
  useEffect(() => {
    if (ticket) {
      const baseFine = ticket.amount || 0;
      const adminFee = 1;
      const hst = +(baseFine * 0.13).toFixed(2);
      const total = baseFine + adminFee + hst;

      setPaymentCalculations({
        baseFine,
        adminFee,
        hst: hst.toFixed(2),
        total,
      });
    }
  }, [ticket]);

  const getStatusBadgeType = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'outstanding':
      case 'unpaid':
      case 'overdue':
        return 'error';
      case 'disputed':
        return 'warning';
      default:
        return 'info' as const;
    }
  };

  return (
    <AppLayout scrollable={false}>
      {isLoading ? (
        <ThemedView className='flex-1 items-center justify-center'>
          <ThemedText variant='secondary'>Loading ticket details...</ThemedText>
        </ThemedView>
      ) : error ? (
        <ThemedView className='flex-1 items-center justify-center'>
          <ThemedText variant='secondary'>{error}</ThemedText>
        </ThemedView>
      ) : !ticket ? (
        <ThemedView className='flex-1 items-center justify-center'>
          <ThemedText variant='secondary'>Ticket not found</ThemedText>
        </ThemedView>
      ) : (
        <ThemedScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <GoBackHeader screenTitle='Ticket Details' />

          {/* Ticket Summary */}
          <ThemedCard className='mx-4 mb-4'>
            <ThemedView className='flex-row items-center justify-between mb-3'>
              <ThemedView className='flex-row items-center'>
                <MaterialCommunityIcons
                  name={
                    (ticket.infractionType?.icon as any) ||
                    'alert-circle-outline'
                  }
                  size={20}
                  color={theme === 'dark' ? '#FFFFFF' : '#10472B'}
                  style={{ marginRight: 8 }}
                />
                <ThemedText>
                  {ticket.infractionType?.type || 'Traffic Violation'}
                </ThemedText>
              </ThemedView>
              <StatusBadge
                status={getStatusBadgeType(ticket.status)}
                label={ticket.status}
              />
            </ThemedView>

            {/* Plate & Ticket # */}
            <ThemedView className='mb-3'>
              <ThemedText variant='secondary' size='sm'>
                Plate:
              </ThemedText>
              <ThemedText weight='semibold'>
                {ticket.vehicle?.licensePlate || 'N/A'}
              </ThemedText>
            </ThemedView>
            <ThemedView className='mb-3'>
              <ThemedText variant='secondary' size='sm'>
                Ticket #:
              </ThemedText>
              <ThemedText weight='semibold'>
                {ticket.ticketNumber || ticket._id}
              </ThemedText>
            </ThemedView>

            {/* Issued By, Date & Location */}
            <ThemedView className='mb-3'>
              <ThemedText variant='secondary' size='sm'>
                Issued by:
              </ThemedText>
              <ThemedText weight='semibold'>
                {ticket.metadata?.issuingAuthority || 'Municipal Authority'}
              </ThemedText>
            </ThemedView>
            <ThemedView className=' flex-row mb-3 justify-between'>
              <ThemedView className='mb-3'>
                <ThemedText variant='secondary' size='sm'>
                  Ticket Violation Date:
                </ThemedText>
                <ThemedText weight='semibold'>
                  {new Date(
                    ticket.violationDate || ticket.createdAt
                  ).toLocaleString('en-CA', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </ThemedText>
              </ThemedView>
              <ThemedView className='mb-3'>
                <ThemedText variant='secondary' size='sm' className='text-right'>
                  Ticket Due Date:
                </ThemedText>
                <ThemedText weight='semibold'>
                  {new Date(
                    ticket.dueDate
                  ).toLocaleString('en-CA', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </ThemedText>
              </ThemedView>
              </ThemedView>
            <ThemedView className='mb-3'>
              <ThemedText variant='secondary' size='sm'>
                Location:
              </ThemedText>
              <ThemedText weight='semibold'>
                {ticket.location?.address?.street1} {' '}
                {ticket.location?.address?.city}{' '}
                {ticket.location?.address?.state},{' '}
                {ticket.location?.address?.country},{' '}
                {ticket.location?.address?.postalCode}{' '}

              </ThemedText>
            </ThemedView>

            {/* Map of Ticket Location */}
            {ticket.location?.coordinates?.lat &&
              ticket.location?.coordinates?.lng && (
                <MapWebView
                  latitude={ticket.location.coordinates.lat}
                  longitude={ticket.location.coordinates.lng}
                  zoom={16}
                  apiKey={'' /* your Google Embed API key if you have one */}
                  style={{
                    height: 240,
                    marginHorizontal: 16,
                    borderRadius: 12,
                  }}
                />
              )}
          </ThemedCard>
          {/* Images */}
          {ticket.evidence?.photos && ticket.evidence.photos.length > 0 && (
            <ThemedCard className='mx-4 mb-4'>
              <ThemedText size='base' weight='semibold' className='mb-3'>
                Evidence Images
              </ThemedText>
              <ThemedView className='flex-row flex-wrap justify-between'>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {ticket.evidence.photos.map((uri, index) => (
                    <TouchableOpacity 
                      key={uri} 
                      onPress={() => openImageViewer(index)}
                      className='relative mr-3'
                    >
                      <Image
                        source={{ uri }}
                        className='w-24 h-24 rounded-lg border'
                        resizeMode='cover'
                      />
                      <ThemedView 
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          borderRadius: 12,
                          padding: 4,
                        }}
                      >
                        <Ionicons 
                          name="expand-outline" 
                          size={12} 
                          color="white" 
                        />
                      </ThemedView>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </ThemedView>
            </ThemedCard>
          )}

          {/* Metadata */}
          {ticket.metadata && Object.keys(ticket.metadata).length > 0 && (
            <ThemedCard className='mx-4 mb-4'>
              <ThemedText size='base' weight='semibold' className='mb-3'>
                Ticket Metadata
              </ThemedText>
              {Object.entries(ticket.metadata).map(([key, value]) => {
                // Skip if value is null, undefined, or empty string
                if (value === null || value === undefined || value === '') {
                  return null;
                }
                
                return (
                  <ThemedView key={key} className='flex-row justify-between mb-2 py-1'>
                    <ThemedText variant='secondary' className='flex-1 mr-4'>
                      {formatMetadataKey(key)}:
                    </ThemedText>
                    <ThemedText weight='medium' className='flex-1 text-right'>
                      {formatMetadataValue(value)}
                    </ThemedText>
                  </ThemedView>
                );
              })}
            </ThemedCard>
          )}

          {/* Fine Breakdown */}
          <ThemedCard className='mx-4 mb-4'>
            <ThemedText size='base' weight='semibold' className='mb-3'>
              Fine Breakdown
            </ThemedText>
            <ThemedView className='flex-row justify-between mb-2'>
              <ThemedText variant='secondary'>Base Fine:</ThemedText>
              <ThemedText>
                ${paymentCalculations.baseFine.toFixed(2)}
              </ThemedText>
            </ThemedView>
            <ThemedView className='flex-row justify-between mb-2'>
              <ThemedText variant='secondary'>Admin Fee:</ThemedText>
              <ThemedText>
                ${paymentCalculations.adminFee.toFixed(2)}
              </ThemedText>
            </ThemedView>
            <ThemedView className='flex-row justify-between mb-3'>
              <ThemedText variant='secondary'>HST 13%:</ThemedText>
              <ThemedText>${paymentCalculations.hst}</ThemedText>
            </ThemedView>
            <ThemedView className='border-t border-border my-2' />
            <ThemedView className='flex-row justify-between mt-2'>
              <ThemedText weight='bold'>Total:</ThemedText>
              <ThemedText weight='bold'>
                ${paymentCalculations.total.toFixed(2)}
              </ThemedText>
            </ThemedView>
          </ThemedCard>

          {/* Actions */}
          <ThemedView className='px-4 mb-6'>
            <ThemedButton
              variant={
                ticket.status.toLowerCase() === 'paid' ? undefined : 'primary'
              }
              size='lg'
              disabled={ticket.status.toLowerCase() === 'paid'}
              onPress={() =>
                ticket.status.toLowerCase() === 'paid'
                  ? undefined
                  : navigation.navigate('PayNow', { ticketId: ticket._id })
              }
              className='mb-3'
            >
              Pay Now
            </ThemedButton>

            <ThemedButton
              variant={
                ticket.status.toLowerCase() === 'paid' ? undefined : 'primary'
              }
              size='lg'
              onPress={() =>
                ticket.status.toLowerCase() === 'disputed'
                  ? navigation.navigate('TicketDisputeStatus', {
                      ticketId: ticket._id,
                    })
                  : ticket.status.toLowerCase() === 'paid'
                  ? undefined
                  : navigation.navigate('DisputeForm', { ticketId: ticket._id })
              }
              disabled={ticket.status.toLowerCase() === 'paid'}
              className='mb-3'
            >
              {ticket.status.toLowerCase() !== 'disputed'
                ? 'Dispute Ticket'
                : 'Check Dispute Status'}
            </ThemedButton>
          </ThemedView>

          {/* Accordion Sections */}
          <ThemedView className='px-4'>
            {/* Violation Description */}
            <TouchableOpacity
              onPress={() => toggleAccordion('violation')}
              className='flex-row justify-between items-center py-4 border-b border-border'
            >
              <ThemedText size='base' weight='medium'>
                Violation Description
              </ThemedText>
              <Ionicons
                name={
                  openSection === 'violation' ? 'chevron-up' : 'chevron-down'
                }
                size={20}
                color={theme === 'dark' ? '#9CA3AF' : '#C5C5C5'}
              />
            </TouchableOpacity>
            {openSection === 'violation' && (
              <ThemedView className='py-3'>
                <ThemedText
                  variant='secondary'
                  size='sm'
                  className='leading-relaxed'
                >
                  {ticket.infractionType?.description ||
                    ticket.description ||
                    'No description available'}
                </ThemedText>
              </ThemedView>
            )}

            {/* Payment History */}
            <TouchableOpacity
              onPress={() => toggleAccordion('history')}
              className='flex-row justify-between items-center py-4 border-b border-border mt-2'
            >
              <ThemedText size='base' weight='medium'>
                Payment History
              </ThemedText>
              <Ionicons
                name={openSection === 'history' ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme === 'dark' ? '#9CA3AF' : '#C5C5C5'}
              />
            </TouchableOpacity>
            {openSection === 'history' && (
              <ThemedView className='py-3'>
                {ticket.paymentHistory && ticket.paymentHistory.length > 0 ? (
                  ticket.paymentHistory.map((payment, idx) => (
                    <ThemedView key={idx} className='mb-2'>
                      <ThemedText variant='secondary' size='sm'>
                        {new Date(payment.paymentDate).toLocaleDateString(
                          'en-CA'
                        )}{' '}
                        – {payment.status}: ${payment.amount.toFixed(2)}
                      </ThemedText>
                    </ThemedView>
                  ))
                ) : (
                  <ThemedText variant='secondary' size='sm'>
                    No payments yet.
                  </ThemedText>
                )}
              </ThemedView>
            )}

            {/* Notes */}
            <TouchableOpacity
              onPress={() => toggleAccordion('note')}
              className='flex-row justify-between items-center py-4 border-b border-border mt-2'
            >
              <ThemedText size='base' weight='medium'>
                Notes
              </ThemedText>
              <Ionicons
                name={openSection === 'note' ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme === 'dark' ? '#9CA3AF' : '#C5C5C5'}
              />
            </TouchableOpacity>
            {openSection === 'note' && (
              <ThemedView className='py-3'>
                <ThemedText variant='secondary' size='sm'>
                  {ticket.evidence?.officerNotes || 'No notes available'}
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedScrollView>
      )}

      {/* Image Viewer Modal */}
      {ticket?.evidence?.photos && (
        <ImageViewer
          visible={imageViewerVisible}
          images={ticket.evidence.photos}
          initialIndex={imageViewerIndex}
          onClose={() => setImageViewerVisible(false)}
        />
      )}
    </AppLayout>
  );
}
