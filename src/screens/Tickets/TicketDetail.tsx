// src/screens/Tickets/TicketDetail.tsx

import React, { use, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTicketStackNavigation } from '../../navigation/hooks';
import { TicketStackParamList } from '../../navigation/types';
import { useTheme } from '../../wrappers/ThemeProvider';
import AppLayout from '../../wrappers/layout';

import MapWebView from '../../components/MapWebView';
import { allTickets, Ticket } from '../../../dummyDb/ticketresponse';
import GoBackHeader from '../../components/GoBackHeader';
import { ThemedView, ThemedText, ThemedCard, ThemedButton, ThemedScrollView, StatusBadge } from '../../components/ThemedComponents';

export default function TicketDetail() {
  const navigation = useTicketStackNavigation();
  const { theme } = useTheme();
  const route = useRoute<RouteProp<TicketStackParamList, 'TicketDetail'>>();
  const ticketId = route.params.ticketId;
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [isDisputeTicket, setIsDisputeTicket] = useState<boolean>(true);
  const toggleAccordion = (section: string) =>
    setOpenSection((prev) => (prev === section ? null : section));
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [paymentCalculations, setPaymentCalculations] = useState({
    baseFine: 0,
    adminFee: 1, // or ticket.fine.adminFee if you add it
    hst: '0',
    total: 0,
  });

  // Simulate fetching ticket data
  useEffect(() => {
    allTickets.find((t) => t.ticket_id === ticketId)
      ? setTicket(allTickets.find((t) => t.ticket_id === ticketId)!)
      : setTicket(null);
  }, [ticketId, allTickets]);

  // check if ticket is in dispute
  useEffect(() => {
    if (ticket) {
      setPaymentCalculations({
        baseFine: ticket.fine.amount,
        adminFee: 1,
        hst: (ticket.fine.amount * 0.13).toFixed(2),
        total: ticket.fine.amount + 1 + +(ticket.fine.amount * 0.13).toFixed(2),
      });
      if (ticket.status === 'Disputed') {
        setIsDisputeTicket(false);
      }
    }
  }, [ticket]);

  return (
    <AppLayout scrollable={false}>
      {!ticket ? (
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
                  name={ticket.infraction.icon as any}
                  size={20}
                  color={theme === 'dark' ? '#FFFFFF' : '#10472B'}
                  style={{ marginRight: 8 }}
                />
                <ThemedText>{ticket.infraction.type}</ThemedText>
              </ThemedView>
              <StatusBadge
                status={ticket.status === 'Paid' ? 'success' : ticket.status === 'Outstanding' ? 'error' : 'warning'}
                label={ticket.status}
              />
            </ThemedView>

            {/* Plate & Ticket # */}
            <ThemedView className='mb-3'>
              <ThemedText variant='secondary' size='sm'>Plate:</ThemedText>
              <ThemedText weight='semibold'>
                {ticket.vehicle.plate}
              </ThemedText>
            </ThemedView>
            <ThemedView className='mb-3'>
              <ThemedText variant='secondary' size='sm'>Ticket #:</ThemedText>
              <ThemedText weight='semibold'>
                {ticket.ticket_id}
              </ThemedText>
            </ThemedView>

            {/* Issued By, Date & Location */}
            <ThemedView className='mb-3'>
              <ThemedText variant='secondary' size='sm'>Issued by:</ThemedText>
              <ThemedText weight='semibold'>
                {ticket.enforcement.agency}
              </ThemedText>
            </ThemedView>
            <ThemedView className='mb-3'>
              <ThemedText variant='secondary' size='sm'>Date & Time:</ThemedText>
              <ThemedText weight='semibold'>
                {new Date(ticket.issue_date).toLocaleString('en-CA', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </ThemedText>
            </ThemedView>
            <ThemedView className='mb-3'>
              <ThemedText variant='secondary' size='sm'>Location:</ThemedText>
              <ThemedText weight='semibold'>
                {ticket.location.street}
              </ThemedText>
            </ThemedView>

            {/* Map of Ticket Location */}
            <MapWebView
              latitude={ticket.location.coordinates.lat}
              longitude={ticket.location.coordinates.lng}
              zoom={16}
              apiKey={'' /* your Google Embed API key if you have one */}
              style={{ height: 240, marginHorizontal: 16, borderRadius: 12 }}
            />
          </ThemedCard>

          {/* Fine Breakdown */}
          <ThemedCard className='mx-4 mb-4'>
            <ThemedText size='base' weight='semibold' className='mb-3'>Fine Breakdown</ThemedText>
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
              <ThemedText weight='bold'>${paymentCalculations.total.toFixed(2)}</ThemedText>
            </ThemedView>
          </ThemedCard>

          {/* Actions */}
          <ThemedView className='px-4 mb-6'>
            <ThemedButton
              variant={ticket.status === 'Paid' ? undefined : 'primary'}
              size='lg'
              disabled={ticket.status === 'Paid'}
              onPress={() =>
                ticket.status === 'Paid'
                  ? undefined
                  : navigation.navigate('PayNow', { ticketId: ticket.ticket_id })
              }
              className='mb-3'
            >
              Pay Now
            </ThemedButton>

            <ThemedButton
              variant={ticket.status === 'Paid' ? undefined : 'primary'}
              size='lg'
              onPress={() =>
                ticket.status === 'Disputed'
                  ? navigation.navigate('TicketDisputeStatus', {
                      ticketId: ticket.ticket_id,
                    })
                  : ticket.status === 'Paid' ? undefined : navigation.navigate('DisputeForm', { ticketId: ticket.ticket_id })
              }
              disabled={ticket.status === 'Paid' ? true : false}
              className='mb-3'
            >
              {ticket.status !== 'Disputed'
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
                <ThemedText variant='secondary' size='sm' className='leading-relaxed'>
                  {ticket.infraction.description}
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
                {ticket.payment_history.length > 0 ? (
                  ticket.payment_history.map((p, idx) => (
                    <ThemedView key={idx} className='mb-2'>
                      <ThemedText variant='secondary' size='sm'>
                        {new Date(p.date).toLocaleDateString('en-CA')} –{' '}
                        {p.type}: ${p.amount.toFixed(2)}
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
                <ThemedText variant='secondary' size='sm'>No Note available</ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedScrollView>
      )}
    </AppLayout>
  );
}
