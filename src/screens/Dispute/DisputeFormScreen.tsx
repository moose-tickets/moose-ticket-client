// src/screens/Dispute/DisputeFormScreen.tsx
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
import * as DocumentPicker from 'expo-document-picker';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../wrappers/ThemeProvider';
import AppLayout from '../../wrappers/layout';
import GoBackHeader from '../../components/GoBackHeader';
import Dialog from '../../components/Dialog';
import { 
  ThemedView, 
  ThemedText, 
  ThemedInput, 
  ThemedButton, 
  ThemedCard 
} from '../../components/ThemedComponents';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  createDispute, 
  fetchTicket,
  clearError 
} from '../../store/slices/ticketSlice';
import { 
  validateRequired,
  validateForm
} from '../../utils/validators';
import { 
  sanitizeUserContent 
} from '../../utils/sanitize';

interface DisputeFormScreenParams {
  ticketId: string;
}

const DISPUTE_REASONS = [
  {
    id: 'incorrect_location',
    title: 'Incorrect Location',
    description: 'The violation did not occur at the specified location',
    icon: 'location-outline',
  },
  {
    id: 'incorrect_date_time',
    title: 'Incorrect Date/Time',
    description: 'The date or time of the violation is wrong',
    icon: 'time-outline',
  },
  {
    id: 'vehicle_not_owned',
    title: 'Vehicle Not Owned',
    description: 'I did not own the vehicle at the time of violation',
    icon: 'car-outline',
  },
  {
    id: 'emergency_situation',
    title: 'Emergency Situation',
    description: 'The violation occurred due to an emergency',
    icon: 'medical-outline',
  },
  {
    id: 'signs_not_visible',
    title: 'Signs Not Visible',
    description: 'Traffic signs were obscured or missing',
    icon: 'eye-off-outline',
  },
  {
    id: 'technical_error',
    title: 'Technical Error',
    description: 'Camera or equipment malfunction',
    icon: 'construct-outline',
  },
  {
    id: 'other',
    title: 'Other',
    description: 'Another reason not listed above',
    icon: 'ellipsis-horizontal-outline',
  },
];

export default function DisputeFormScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const route = useRoute<RouteProp<{ DisputeForm: DisputeFormScreenParams }, 'DisputeForm'>>();
  const dispatch = useAppDispatch();
  
  const ticketId = route.params.ticketId;
  
  // Redux state
  const ticket = useAppSelector((state) => state.tickets.currentTicket);
  const isDisputing = useAppSelector((state) => state.tickets.isDisputing);
  const error = useAppSelector((state) => state.tickets.error);
  
  // Local state
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<Array<{
    uri: string;
    name: string;
    type: string;
    size?: number;
  }>>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogProps, setDialogProps] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning',
  });

  // Load ticket details
  useEffect(() => {
    if (ticketId) {
      dispatch(fetchTicket(ticketId));
    }
  }, [ticketId, dispatch]);

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

    // Validate reason selection
    if (!selectedReason) {
      errors.reason = ['Please select a dispute reason'];
    }

    // Validate custom reason if "other" is selected
    if (selectedReason === 'other') {
      const customReasonResult = validateRequired(customReason, 'Custom reason');
      if (!customReasonResult.isValid) {
        errors.customReason = customReasonResult.errors;
      }
    }

    // Validate description
    const descriptionResult = validateRequired(description, 'Description');
    if (!descriptionResult.isValid) {
      errors.description = descriptionResult.errors;
    } else if (description.trim().length < 50) {
      errors.description = ['Description must be at least 50 characters'];
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission denied', 'Media library access is required to add images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map((asset, index) => ({
          uri: asset.uri,
          name: `evidence_image_${Date.now()}_${index}.jpg`,
          type: 'image/jpeg',
          size: asset.fileSize,
        }));

        setEvidenceFiles(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to add images. Please try again.');
    }
  };

  const handleAddDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'text/plain'],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size,
        }));

        setEvidenceFiles(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error('Error picking documents:', error);
      Alert.alert('Error', 'Failed to add documents. Please try again.');
    }
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitDispute = async () => {
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

    try {
      const selectedReasonData = DISPUTE_REASONS.find(r => r.id === selectedReason);
      const finalReason = selectedReason === 'other' ? customReason : selectedReasonData?.title || '';
      
      const disputeData = {
        ticketId: ticket.id,
        reason: sanitizeUserContent(finalReason),
        description: sanitizeUserContent(description),
        evidence: evidenceFiles.map(file => ({
          uri: file.uri,
          filename: file.name,
          type: file.type,
        })),
      };

      await dispatch(createDispute(disputeData)).unwrap();

      setDialogProps({
        title: 'Dispute Submitted',
        message: 'Your dispute has been submitted successfully. You will receive updates on its status.',
        type: 'success',
      });
      setDialogVisible(true);

      // Navigate back after delay
      setTimeout(() => {
        navigation.goBack();
      }, 3000);

    } catch (error: any) {
      setDialogProps({
        title: 'Dispute Failed',
        message: error.message || 'Failed to submit dispute. Please try again.',
        type: 'error',
      });
      setDialogVisible(true);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return 'image-outline';
    if (type === 'application/pdf') return 'document-text-outline';
    return 'document-outline';
  };

  if (!ticket) {
    return (
      <AppLayout>
        <GoBackHeader screenTitle="Dispute Ticket" />
        <ThemedView className="flex-1 justify-center items-center">
          <ThemedText>Loading ticket details...</ThemedText>
        </ThemedView>
      </AppLayout>
    );
  }

  return (
    <AppLayout scrollable={false}>
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <GoBackHeader screenTitle="Dispute Ticket" />

        {/* Ticket Info */}
        <ThemedCard className="mb-6">
          <ThemedText weight="bold" size="lg" className="mb-4">Ticket Information</ThemedText>
          
          <ThemedView className="flex-row justify-between items-center mb-2">
            <ThemedText variant="tertiary" size="sm">Ticket #</ThemedText>
            <ThemedText weight="medium">{ticket.ticketNumber || ticket.id}</ThemedText>
          </ThemedView>
          
          <ThemedView className="flex-row justify-between items-center mb-2">
            <ThemedText variant="tertiary" size="sm">License Plate</ThemedText>
            <ThemedText weight="medium">{ticket.licensePlate}</ThemedText>
          </ThemedView>
          
          <ThemedView className="flex-row justify-between items-center mb-2">
            <ThemedText variant="tertiary" size="sm">Violation</ThemedText>
            <ThemedText weight="medium">{ticket.violationType}</ThemedText>
          </ThemedView>
          
          <ThemedView className="flex-row justify-between items-center">
            <ThemedText variant="tertiary" size="sm">Fine Amount</ThemedText>
            <ThemedText weight="bold" style={{ color: theme === 'dark' ? '#FFA366' : '#E18743' }}>
              ${(ticket.fineAmount || 0).toFixed(2)}
            </ThemedText>
          </ThemedView>
        </ThemedCard>

        {/* Dispute Reason */}
        <ThemedView className="mb-6">
          <ThemedText weight="bold" size="lg" className="mb-4">Reason for Dispute</ThemedText>
          
          {DISPUTE_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.id}
              onPress={() => {
                setSelectedReason(reason.id);
                if (validationErrors.reason) {
                  setValidationErrors(prev => ({ ...prev, reason: [] }));
                }
              }}
              className={`flex-row items-center p-4 rounded-xl border mb-3 ${
                selectedReason === reason.id ? 'border-primary bg-primary-light' : 'border-border bg-background-secondary'
              }`}
            >
              <ThemedView 
                className={`w-5 h-5 rounded-full border-2 mr-3 ${
                  selectedReason === reason.id ? 'border-primary bg-primary' : 'border-border'
                }`}
              >
                {selectedReason === reason.id && (
                  <ThemedView className="w-2 h-2 rounded-full bg-background m-auto" />
                )}
              </ThemedView>
              
              <Ionicons
                name={reason.icon as any}
                size={24}
                color={theme === 'dark' ? '#FFA366' : '#E18743'}
                style={{ marginRight: 12 }}
              />
              
              <ThemedView className="flex-1">
                <ThemedText weight="medium">{reason.title}</ThemedText>
                <ThemedText variant="tertiary" size="sm">{reason.description}</ThemedText>
              </ThemedView>
            </TouchableOpacity>
          ))}
          
          {validationErrors.reason && validationErrors.reason.length > 0 && (
            <ThemedText variant="error" size="xs" className="mt-1">
              {validationErrors.reason[0]}
            </ThemedText>
          )}
        </ThemedView>

        {/* Custom Reason (if "Other" is selected) */}
        {selectedReason === 'other' && (
          <ThemedView className="mb-6">
            <ThemedText weight="bold" className="mb-2">Custom Reason</ThemedText>
            <ThemedInput
              value={customReason}
              onChangeText={(text) => {
                setCustomReason(text);
                if (validationErrors.customReason) {
                  setValidationErrors(prev => ({ ...prev, customReason: [] }));
                }
              }}
              placeholder="Please specify your reason for disputing this ticket"
              multiline
              numberOfLines={2}
            />
            {validationErrors.customReason && validationErrors.customReason.length > 0 && (
              <ThemedText variant="error" size="xs" className="mt-1">
                {validationErrors.customReason[0]}
              </ThemedText>
            )}
          </ThemedView>
        )}

        {/* Description */}
        <ThemedView className="mb-6">
          <ThemedText weight="bold" className="mb-2">Detailed Description</ThemedText>
          <ThemedText variant="tertiary" size="sm" className="mb-3">
            Please provide a detailed explanation of why you believe this ticket should be dismissed. 
            Include specific facts, circumstances, and any relevant information.
          </ThemedText>
          <ThemedInput
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (validationErrors.description) {
                setValidationErrors(prev => ({ ...prev, description: [] }));
              }
            }}
            placeholder="Provide a detailed explanation of your dispute (minimum 50 characters)"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <ThemedView className="flex-row justify-between mt-1">
            {validationErrors.description && validationErrors.description.length > 0 ? (
              <ThemedText variant="error" size="xs">
                {validationErrors.description[0]}
              </ThemedText>
            ) : (
              <ThemedText variant="tertiary" size="xs">
                {description.length}/50 characters minimum
              </ThemedText>
            )}
          </ThemedView>
        </ThemedView>

        {/* Evidence */}
        <ThemedView className="mb-6">
          <ThemedText weight="bold" className="mb-2">Supporting Evidence</ThemedText>
          <ThemedText variant="tertiary" size="sm" className="mb-4">
            Upload photos, documents, or other evidence that supports your dispute. 
            This could include dashcam footage, witness statements, receipts, etc.
          </ThemedText>
          
          {/* Add Evidence Buttons */}
          <ThemedView className="flex-row space-x-3 mb-4">
            <ThemedButton
              variant="outline"
              onPress={handleAddImage}
              className="flex-1"
              leftIcon="camera-outline"
            >
              Add Photos
            </ThemedButton>
            <ThemedButton
              variant="outline"
              onPress={handleAddDocument}
              className="flex-1"
              leftIcon="document-attach-outline"
            >
              Add Documents
            </ThemedButton>
          </ThemedView>

          {/* Evidence List */}
          {evidenceFiles.length > 0 && (
            <ThemedView>
              {evidenceFiles.map((file, index) => (
                <ThemedView 
                  key={index}
                  className="flex-row items-center p-3 rounded-xl bg-background-secondary border border-border mb-2"
                >
                  {file.type.startsWith('image/') ? (
                    <Image
                      source={{ uri: file.uri }}
                      className="w-12 h-12 rounded-lg mr-3"
                      resizeMode="cover"
                    />
                  ) : (
                    <ThemedView 
                      className="w-12 h-12 rounded-lg bg-primary-light items-center justify-center mr-3"
                    >
                      <Ionicons
                        name={getFileIcon(file.type) as any}
                        size={24}
                        color={theme === 'dark' ? '#FFA366' : '#E18743'}
                      />
                    </ThemedView>
                  )}
                  
                  <ThemedView className="flex-1">
                    <ThemedText weight="medium" numberOfLines={1}>{file.name}</ThemedText>
                    <ThemedText variant="tertiary" size="xs">
                      {formatFileSize(file.size)}
                    </ThemedText>
                  </ThemedView>
                  
                  <TouchableOpacity
                    onPress={() => handleRemoveEvidence(index)}
                    className="p-2"
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </ThemedView>
              ))}
            </ThemedView>
          )}
        </ThemedView>

        {/* Important Notice */}
        <ThemedCard className="mb-6 bg-warning-light border border-warning">
          <ThemedView className="flex-row items-start">
            <Ionicons
              name="warning-outline"
              size={24}
              color={theme === 'dark' ? '#F59E0B' : '#D97706'}
              style={{ marginRight: 12, marginTop: 2 }}
            />
            <ThemedView className="flex-1">
              <ThemedText weight="bold" className="mb-2">Important Notice</ThemedText>
              <ThemedText size="sm">
                • Submitting false information may result in additional penalties{'\n'}
                • Review all information carefully before submitting{'\n'}
                • You will receive email updates about your dispute status{'\n'}
                • Processing typically takes 5-10 business days
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedCard>

        {/* Submit Button */}
        <ThemedButton
          variant="primary"
          onPress={handleSubmitDispute}
          disabled={isDisputing}
          className="mb-8"
          size="lg"
        >
          {isDisputing ? 'Submitting Dispute...' : 'Submit Dispute'}
        </ThemedButton>
      </ScrollView>

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