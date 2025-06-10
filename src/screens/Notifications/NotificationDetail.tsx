import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNotificationsStackNavigation } from "../../navigation/hooks";
import AppLayout from "../../wrappers/layout";
import GoBackHeader from "../../components/GoBackHeader";
import { ThemedView, ThemedText, ThemedCard, ThemedButton } from "../../components/ThemedComponents";
import { useTheme } from "../../wrappers/ThemeProvider";

export default function NotificationDetails() {
  const navigation = useNotificationsStackNavigation();
  const { theme } = useTheme();

  return (
    <AppLayout scrollable={false}>
       {/* Header */}
          <GoBackHeader screenTitle='Notification Details' />

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
            New Parking Ticket Issued
          </ThemedText>
          <ThemedText size="sm" variant="secondary">May 30, 2025 · 14:30</ThemedText>
        </ThemedView>
      </ThemedCard>

      {/* Message Content */}
      <ThemedView className="px-4 mb-8">
        <ThemedText className="leading-relaxed">
          Your plate <ThemedText weight="semibold">ABC1234</ThemedText> received a
          parking ticket at{" "}
          <ThemedText weight="medium">123 King St W</ThemedText>. Amount due:{" "}
          <ThemedText weight="semibold">$78.30</ThemedText>. Pay by{" "}
          <ThemedText weight="medium">Jun 14, 2025</ThemedText> to avoid late fees.
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
          View Ticket Details
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
            Mark as Read
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </AppLayout>
  );
}
