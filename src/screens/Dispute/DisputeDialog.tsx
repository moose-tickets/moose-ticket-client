import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Dialog from "../../components/Dialog"; // adjust based on your structure
import { useRoute, RouteProp } from "@react-navigation/native";
import { useTicketStackNavigation } from "../../navigation/hooks";
import { TicketStackParamList } from "../../navigation/types";
import { useTheme } from "../../wrappers/ThemeProvider";

type StatusType = "success" | "error" | "failed";

export default function DisputeDialog() {
  const navigation = useTicketStackNavigation();
  const { theme } = useTheme();
  const route = useRoute<RouteProp<TicketStackParamList, 'DisputeDialog'>>();
  const status = route.params.status;

  const statusContent = {
    success: {
      icon: "checkmark-circle-outline",
      color: theme === 'dark' ? "#22C55E" : "#10472B",
      title: "Dispute Submitted",
      message: "Your dispute has been submitted successfully and is under review.",
      button: "Back to Tickets",
    },
    failed: {
      icon: "close-circle-outline",
      color: "#EF4444",
      title: "Submission Failed",
      message: "Something went wrong while submitting your dispute. Please try again.",
      button: "Try Again",
    },
    error: {
      icon: "alert-circle-outline",
      color: theme === 'dark' ? "#FF9A4A" : "#FF7F11",
      title: "Something Went Wrong",
      message: "An unexpected error occurred. Please check your connection and try again.",
      button: "Dismiss",
    },
  };

  const content = statusContent[status];

  const handleClose = () => {
    if (status === "success") {
      navigation.navigate("TicketList");
    } else {
      navigation.goBack();
    }
  };

  return (
    <Dialog 
      visible={true}
      type={status === 'success' ? 'success' : status === 'failed' ? 'error' : 'warning'}
      title={content.title}
      message={content.message}
      onClose={handleClose}
      confirmText={content.button}
    />
  );
}
