import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Alert,
  View,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTicketStackNavigation } from '../../navigation/hooks';
import { TicketStackParamList } from '../../navigation/types';
import { useTheme } from '../../wrappers/ThemeProvider';
import AppLayout from '../../wrappers/layout';
import GoBackHeader from '../../components/GoBackHeader';
import Dialog from '../../components/Dialog';
import { 
  ThemedView, 
  ThemedText, 
  ThemedInput, 
  ThemedButton, 
  ThemedCard,
  ThemedScrollView 
} from '../../components/ThemedComponents';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  fetchTicket,
  updateTicket,
  deleteTicket,
  createDispute,
  payTicket,
  clearError,
  selectCurrentTicket,
  selectIsUpdatingTicket,
  selectIsDeletingTicket,
  selectIsDisputing,
  selectIsPayingTicket,
  selectTicketError 
} from '../../store/slices/ticketSlice';
import { validateLicensePlate, validateRequired } from '../../utils/validators';
import { sanitizeLicensePlate, sanitizeUserContent } from '../../utils/sanitize';

export default function TicketDetailEdit() {
  const navigation = useTicketStackNavigation();
  const { theme } = useTheme();
  const route = useRoute<RouteProp<TicketStackParamList, 'TicketDetail'>>();
  const dispatch = useAppDispatch();
  
  const ticketId = route.params.ticketId;
  
  // Redux state
  const ticket = useAppSelector(selectCurrentTicket);
  const isUpdating = useAppSelector(selectIsUpdatingTicket);
  const isDeleting = useAppSelector(selectIsDeletingTicket);
  const isDisputing = useAppSelector(selectIsDisputing);
  const isPaying = useAppSelector(selectIsPayingTicket);
  const error = useAppSelector(selectTicketError);
  
  // Local state
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogProps, setDialogProps] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning',
  });
  
  const [editForm, setEditForm] = useState({
    licensePlate: '',
    violationType: '',
    issueDate: new Date(),
    location: '',
    city: '',
    state: '',
    postalCode: '',
    fineAmount: '',
    notes: '',
    images: [] as string[],
  });

  // Load ticket details
  useEffect(() => {
    if (ticketId) {
      dispatch(fetchTicket(ticketId));
    }
  }, [ticketId, dispatch]);

  // Populate form when ticket loads
  useEffect(() => {
    if (ticket && !isEditing) {
      setEditForm({
        licensePlate: ticket.licensePlate || '',
        violationType: ticket.violationType || '',
        issueDate: ticket.issueDate ? new Date(ticket.issueDate) : new Date(),
        location: ticket.location || '',
        city: ticket.city || '',
        state: ticket.state || '',
        postalCode: ticket.postalCode || '',
        fineAmount: ticket.fineAmount?.toString() || '',
        notes: ticket.notes || '',
        images: ticket.images || [],
      });
    }
  }, [ticket, isEditing]);

  // Handle errors
  useEffect(() => {
    if (error) {
      setDialogProps({
        title: 'Error',
        message: error,
        type: 'error',
      });
      setDialogVisible(true);
    }
  }, [error]);

  const validateForm = () => {
    const errors: Record<string, string[]> = {};

    // Validate license plate
    const plateResult = validateLicensePlate(editForm.licensePlate);
    if (!plateResult.isValid) {
      errors.licensePlate = plateResult.errors;
    }

    // Validate required fields
    const requiredFields = [
      { key: 'violationType', label: 'Violation type' },
      { key: 'location', label: 'Location' },
      { key: 'city', label: 'City' },
    ];

    requiredFields.forEach(({ key, label }) => {
      const result = validateRequired(editForm[key as keyof typeof editForm], label);
      if (!result.isValid) {
        errors[key] = result.errors;
      }
    });

    // Validate fine amount
    if (editForm.fineAmount && isNaN(Number(editForm.fineAmount))) {
      errors.fineAmount = ['Fine amount must be a valid number'];
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!ticket) return;

    // Validate form
    const isValid = validateForm();
    if (!isValid) {
      setDialogProps({
        title: 'Validation Error',
        message: 'Please correct the errors and try again.',
        type: 'error',
      });
      setDialogVisible(true);
      return;
    }

    // Prepare update data
    const updateData = {
      licensePlate: sanitizeLicensePlate(editForm.licensePlate),
      violationType: editForm.violationType.trim(),
      issueDate: editForm.issueDate.toISOString(),
      location: sanitizeUserContent(editForm.location),
      city: sanitizeUserContent(editForm.city),
      state: editForm.state.trim(),
      postalCode: editForm.postalCode.trim().toUpperCase(),
      fineAmount: editForm.fineAmount ? Number(editForm.fineAmount) : undefined,
      notes: sanitizeUserContent(editForm.notes),
    };

    try {
      await dispatch(updateTicket({ ticketId: ticket.id, updates: updateData })).unwrap();
      setIsEditing(false);
      setDialogProps({
        title: 'Success',
        message: 'Ticket updated successfully.',
        type: 'success',
      });
      setDialogVisible(true);
    } catch (error: any) {
      setDialogProps({
        title: 'Update Failed',
        message: error.message || 'Failed to update ticket.',
        type: 'error',
      });
      setDialogVisible(true);
    }
  };

  const handleDelete = () => {
    if (!ticket) return;

    Alert.alert(
      'Delete Ticket',
      'Are you sure you want to delete this ticket? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteTicket(ticket.id)).unwrap();
              setDialogProps({
                title: 'Success',
                message: 'Ticket deleted successfully.',
                type: 'success',
              });
              setDialogVisible(true);
              setTimeout(() => {
                navigation.goBack();
              }, 1500);
            } catch (error: any) {
              setDialogProps({
                title: 'Delete Failed',
                message: error.message || 'Failed to delete ticket.',
                type: 'error',
              });
              setDialogVisible(true);
            }
          },
        },
      ]
    );
  };

  const handlePayNow = () => {
    if (!ticket) return;
    navigation.navigate('PayNow', { ticketId: ticket.id });
  };

  const handleDispute = () => {
    if (!ticket) return;
    navigation.navigate('DisputeForm', { ticketId: ticket.id });
  };

  const handleAddImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission denied', 'Media library access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setEditForm(prev => ({
        ...prev,
        images: [...prev.images, result.assets[0].uri],
      }));
    }
  };

  const handleRemoveImage = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return theme === 'dark' ? '#10B981' : '#16A34A';
      case 'outstanding':
        return theme === 'dark' ? '#EF4444' : '#DC2626';
      case 'disputed':
        return theme === 'dark' ? '#F59E0B' : '#D97706';
      default:
        return theme === 'dark' ? '#6B7280' : '#9CA3AF';
    }
  };

  if (!ticket) {
    return (
      <AppLayout>
        <GoBackHeader screenTitle="Ticket Details" />
        <ThemedView className="flex-1 justify-center items-center">
          <ThemedText>Loading ticket details...</ThemedText>
        </ThemedView>
      </AppLayout>
    );
  }

  return (
    <AppLayout scrollable={false}>
      <ThemedScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <GoBackHeader 
          screenTitle={isEditing ? 'Edit Ticket' : 'Ticket Details'} 
          rightComponent={
            !isEditing ? (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Ionicons 
                  name="pencil" 
                  size={24} 
                  color={theme === 'dark' ? '#FFA366' : '#E18743'} 
                />
              </TouchableOpacity>
            ) : null
          }
        />

        {/* Ticket Info Card */}
        <ThemedCard className="mx-4 mb-4">
          <ThemedView className="flex-row justify-between items-start mb-4">
            <ThemedView className="flex-1">
              <ThemedText variant="tertiary" size="sm">Ticket #</ThemedText>
              <ThemedText weight="bold" size="lg">{ticket.ticketNumber || ticket.id}</ThemedText>
            </ThemedView>
            <ThemedView 
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: getStatusColor(ticket.status) + '20' }}
            >
              <ThemedText 
                size="sm" 
                weight="medium"
                style={{ color: getStatusColor(ticket.status) }}
              >
                {ticket.status}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView className="flex-row justify-between mb-2">
            <ThemedText variant="tertiary" size="sm">Amount</ThemedText>
            <ThemedText weight="bold" size="lg">${ticket.fineAmount?.toFixed(2)}</ThemedText>
          </ThemedView>

          <ThemedView className="flex-row justify-between">
            <ThemedText variant="tertiary" size="sm">Due Date</ThemedText>
            <ThemedText>{ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : 'N/A'}</ThemedText>
          </ThemedView>
        </ThemedCard>

        {/* License Plate */}
        <ThemedView className="mx-4 mb-4">
          <ThemedText variant="tertiary" size="sm" className="mb-2">License Plate</ThemedText>
          {isEditing ? (
            <ThemedInput
              value={editForm.licensePlate}
              onChangeText={(text) => {
                setEditForm(prev => ({ ...prev, licensePlate: sanitizeLicensePlate(text) }));
                if (validationErrors.licensePlate) {
                  setValidationErrors(prev => ({ ...prev, licensePlate: [] }));
                }
              }}
              placeholder="e.g., ABC1234"
            />
          ) : (
            <ThemedText weight="medium" size="lg">{ticket.licensePlate}</ThemedText>
          )}
          {validationErrors.licensePlate && validationErrors.licensePlate.length > 0 && (
            <ThemedText variant="error" size="xs" className="mt-1">
              {validationErrors.licensePlate[0]}
            </ThemedText>
          )}
        </ThemedView>

        {/* Violation Type */}
        <ThemedView className="mx-4 mb-4">
          <ThemedText variant="tertiary" size="sm" className="mb-2">Violation Type</ThemedText>
          {isEditing ? (
            <ThemedInput
              value={editForm.violationType}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, violationType: text }))}
              placeholder="e.g., Speeding, Parking"
            />
          ) : (
            <ThemedText>{ticket.violationType}</ThemedText>
          )}
        </ThemedView>

        {/* Date */}
        <ThemedView className="mx-4 mb-4">
          <ThemedText variant="tertiary" size="sm" className="mb-2">Issue Date</ThemedText>
          {isEditing ? (
            <TouchableOpacity
              className="border border-border rounded-xl px-4 py-3 bg-background"
              onPress={() => setShowDatePicker(true)}
            >
              <ThemedText>{editForm.issueDate.toLocaleDateString()}</ThemedText>
            </TouchableOpacity>
          ) : (
            <ThemedText>{ticket.issueDate ? new Date(ticket.issueDate).toLocaleDateString() : 'N/A'}</ThemedText>
          )}
          {showDatePicker && (
            <DateTimePicker
              value={editForm.issueDate}
              mode="date"
              display="default"
              onChange={(_, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setEditForm(prev => ({ ...prev, issueDate: selectedDate }));
                }
              }}
            />
          )}
        </ThemedView>

        {/* Location */}
        <ThemedView className="mx-4 mb-4">
          <ThemedText variant="tertiary" size="sm" className="mb-2">Location</ThemedText>
          {isEditing ? (
            <ThemedView>
              <ThemedInput
                value={editForm.location}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, location: text }))}
                placeholder="Street address"
                className="mb-2"
              />
              <ThemedInput
                value={editForm.city}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, city: text }))}
                placeholder="City"
                className="mb-2"
              />
              <ThemedInput
                value={editForm.postalCode}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, postalCode: text.toUpperCase() }))}
                placeholder="Postal Code"
              />
            </ThemedView>
          ) : (
            <ThemedText>
              {[ticket.location, ticket.city, ticket.postalCode].filter(Boolean).join(', ')}
            </ThemedText>
          )}
        </ThemedView>

        {/* Notes */}
        <ThemedView className="mx-4 mb-4">
          <ThemedText variant="tertiary" size="sm" className="mb-2">Notes</ThemedText>
          {isEditing ? (
            <ThemedInput
              value={editForm.notes}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, notes: text }))}
              placeholder="Add any additional notes..."
              multiline
              numberOfLines={3}
            />
          ) : (
            <ThemedText>{ticket.notes || 'No notes added'}</ThemedText>
          )}
        </ThemedView>

        {/* Images */}
        <ThemedView className="mx-4 mb-6">
          <ThemedText variant="tertiary" size="sm" className="mb-2">Images</ThemedText>
          {isEditing && (
            <TouchableOpacity
              onPress={handleAddImage}
              className="border border-dashed border-border rounded-xl py-4 items-center mb-4"
            >
              <Ionicons
                name="camera-outline"
                size={24}
                color={theme === 'dark' ? '#94A3B8' : '#9CA3AF'}
              />
              <ThemedText variant="tertiary" size="sm" className="mt-2">Add Image</ThemedText>
            </TouchableOpacity>
          )}
          
          {editForm.images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {editForm.images.map((uri, index) => (
                <View key={index} className="relative mr-3">
                  <Image
                    source={{ uri }}
                    className="w-24 h-24 rounded-lg"
                    resizeMode="cover"
                  />
                  {isEditing && (
                    <TouchableOpacity
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                      onPress={() => handleRemoveImage(index)}
                    >
                      <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </ThemedView>

        {/* Action Buttons */}
        <ThemedView className="mx-4 space-y-3">
          {isEditing ? (
            <ThemedView className="flex-row space-x-3">
              <ThemedButton
                variant="outline"
                onPress={() => {
                  setIsEditing(false);
                  setValidationErrors({});
                }}
                className="flex-1"
                disabled={isUpdating}
              >
                Cancel
              </ThemedButton>
              <ThemedButton
                variant="primary"
                onPress={handleSave}
                className="flex-1"
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </ThemedButton>
            </ThemedView>
          ) : (
            <ThemedView className="space-y-3">
              {ticket.status?.toLowerCase() === 'outstanding' && (
                <ThemedButton
                  variant="primary"
                  onPress={handlePayNow}
                  disabled={isPaying}
                  className="mb-3"
                >
                  {isPaying ? 'Processing...' : `Pay $${ticket.fineAmount?.toFixed(2)}`}
                </ThemedButton>
              )}
              
              {['outstanding', 'pending'].includes(ticket.status?.toLowerCase() || '') && (
                <ThemedButton
                  variant="secondary"
                  onPress={handleDispute}
                  disabled={isDisputing}
                  className="mb-3"
                >
                  {isDisputing ? 'Submitting...' : 'Dispute Ticket'}
                </ThemedButton>
              )}
              
              <ThemedButton
                variant="outline"
                onPress={handleDelete}
                disabled={isDeleting}
                style={{ borderColor: '#EF4444' }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Ticket'}
              </ThemedButton>
            </ThemedView>
          )}
        </ThemedView>
      </ThemedScrollView>

      <Dialog
        visible={dialogVisible}
        title={dialogProps.title}
        message={dialogProps.message}
        type={dialogProps.type}
        onClose={() => {
          setDialogVisible(false);
          if (error) {
            dispatch(clearError());
          }
        }}
      />
    </AppLayout>
  );
}