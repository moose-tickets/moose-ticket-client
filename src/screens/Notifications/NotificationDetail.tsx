import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNotificationsStackNavigation } from "../../navigation/hooks";
import AppLayout from "../../wrappers/layout";
import GoBackHeader from "../../components/GoBackHeader";
import { ThemedView, ThemedText, ThemedCard, ThemedButton } from "../../components/ThemedComponents";
import { useTheme } from "../../wrappers/ThemeProvider";
import { useTranslation } from 'react-i18next';

export default function NotificationDetails() {
  const navigation = useNotificationsStackNavigation();
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <AppLayout scrollable={false}>
       {/* Header */}
          <GoBackHeader screenTitle={t('notifications.notificationDetails')} />

      {/* Notification Header */}
      <ThemedCard className="mx-4 flex-row items-start mb-6">
        <ThemedView className="bg-primary-100 rounded-full p-2 mr-3">
          <MaterialCommunityIcons
            name="ticket-confirmation"
            size={24}
            color={theme === 'dark' ? '#FF9A4A' : '#FF7F11'}
          />
        </ThemedView>
        <ThemedView className="flex-1">
          <ThemedText weight="semibold" className="mb-1">
            {t('notifications.newParkingTicket')}
          </ThemedText>
          <ThemedText size="sm" variant="secondary">May 30, 2025 · 14:30</ThemedText>
        </ThemedView>
      </ThemedCard>

      {/* Message Content */}
      <ThemedView className="px-4 mb-8">
        <ThemedText className="leading-relaxed">
          {t('notifications.ticketIssuedMessage', {
            plate: 'ABC1234',
            location: '123 King St W',
            amount: '$78.30',
            dueDate: 'Jun 14, 2025'
          })}
        </ThemedText>
      </ThemedView>

      {/* Buttons */}
      <ThemedView className="px-4">
        <ThemedButton
          onPress={() => navigation.navigate("TicketDetail", { ticketId: "TTC-20250602-140439" })}
          variant="primary"
          size="lg"
          className="mb-4"
        >
{t('tickets.viewTicketDetails')}
        </ThemedButton>

        <TouchableOpacity
          onPress={() => console.log("Marked as read")}
          className="items-center"
        >
          <ThemedText 
            variant="primary" 
            weight="medium" 
            className="underline"
            style={{
              color: theme === 'dark' ? '#22C55E' : '#10472B'
            }}
          >
{t('notifications.markAsRead')}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </AppLayout>
  );
}
