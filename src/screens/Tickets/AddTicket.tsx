import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../wrappers/ThemeProvider';
import AppLayout from '../../wrappers/layout';
import GoBackHeader from '../../components/GoBackHeader';
import { infractionTypes } from '../../../dummyDb/infractionTypes';
import Dialog from '../../components/Dialog';
import { useNavigation } from '@react-navigation/native';
import { ThemedView, ThemedText, ThemedInput, ThemedButton, ThemedCard, ThemedScrollView } from '../../components/ThemedComponents';
import { useBotCheck } from '../../hooks/UseBotCheck';
import { useRateLimit } from '../../hooks/useRateLimit';
import { RateLimitType } from '../../services/arcjetSecurity';
import { validateLicensePlate, validateRequired } from '../../utils/validators';
import { sanitizeLicensePlate, sanitizeUserContent, sanitizeFileName } from '../../utils/sanitize';
import { useAppDispatch, useAppSelector } from '../../store';
import { createTicket, clearError } from '../../store/slices/ticketSlice';

export default function AddTicket() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  
  // Redux state
  const { isCreating, error } = useAppSelector((state) => state.tickets);
  
  const [form, setForm] = useState({
    plate: '',
    violation: '',
    date: new Date(),
    location: '',
    city: '',
    postalCode: '',
    fine: '',
    notes: '',
    imageUri: null as string | null,
  });
  const [showDate, setShowDate] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogProps, setDialogProps] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning',
  });

  // Arcjet security hooks
  const { checkBot, isHuman, riskLevel } = useBotCheck({
    onBotDetected: (context) => {
      setDialogProps({
        title: "Security Check Failed",
        message: "Suspicious activity detected. Please try again later.",
        type: "error",
      });
      setDialogVisible(true);
    }
  });

  const { executeWithRateLimit, isRateLimited } = useRateLimit({
    type: RateLimitType.TICKET_CREATE,
    onRateLimited: (result) => {
      setDialogProps({
        title: "Too Many Submissions",
        message: `Please wait before submitting another ticket. Try again after ${result.resetTime.toLocaleTimeString()}`,
        type: "warning",
      });
      setDialogVisible(true);
    }
  });

  // Handle Redux errors
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
    const plateResult = validateLicensePlate(form.plate);
    if (!plateResult.isValid) {
      errors.plate = plateResult.errors;
    }

    // Validate required fields
    const requiredFields = [
      { key: 'violation', label: 'Violation type' },
      { key: 'location', label: 'Location' },
      { key: 'city', label: 'City' },
      { key: 'fine', label: 'Fine amount' }
    ];

    requiredFields.forEach(({ key, label }) => {
      const result = validateRequired(form[key as keyof typeof form], label);
      if (!result.isValid) {
        errors[key] = result.errors;
      }
    });

    // Validate fine amount (should be numeric)
    if (form.fine && isNaN(Number(form.fine))) {
      errors.fine = ['Fine amount must be a valid number'];
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled) {
      setForm((prev) => ({ ...prev, imageUri: result.assets[0].uri }));
    }
  };

  const handleSave = async () => {
    if (isCreating || isRateLimited) return;

    setValidationErrors({});

    try {
      // 1. Validate form
      const isFormValid = validateForm();
      if (!isFormValid) {
        setDialogProps({
          title: "Validation Error",
          message: "Please correct the errors below and try again.",
          type: "error",
        });
        setDialogVisible(true);
        return;
      }

      // 2. Perform security checks with rate limiting
      await executeWithRateLimit(async () => {
        // Bot detection
        const botContext = await checkBot();
        if (!botContext.isHuman && botContext.riskLevel === 'critical') {
          throw new Error('Security verification failed');
        }

        // 3. Prepare ticket data for API
        const ticketData = {
          licensePlate: sanitizeLicensePlate(form.plate),
          violationType: form.violation,
          issueDate: form.date.toISOString(),
          location: sanitizeUserContent(form.location),
          city: sanitizeUserContent(form.city),
          postalCode: form.postalCode.trim().toUpperCase(),
          fineAmount: form.fine ? Number(form.fine) : 0,
          notes: sanitizeUserContent(form.notes),
          images: form.imageUri ? [form.imageUri] : [],
        };

        // 4. Create ticket via Redux
        await dispatch(createTicket(ticketData)).unwrap();

        // Success
        setDialogProps({
          title: 'Ticket Added Successfully',
          message: 'Your ticket has been recorded and saved securely.',
          type: 'success',
        });
        setDialogVisible(true);

        // Navigate back after delay
        setTimeout(() => {
          setDialogVisible(false);
          navigation.goBack();
        }, 2000);
      });

    } catch (error: any) {
      console.error('Save ticket error:', error);
      
      setDialogProps({
        title: "Save Failed",
        message: error.message || "Failed to save ticket. Please try again.",
        type: "error",
      });
      setDialogVisible(true);
    }
  };

  return (
    <AppLayout scrollable={false}>
      <ThemedScrollView className='flex-1 px-5 '>
        {/* Header */}
        <GoBackHeader screenTitle='Add Ticket' />

        {/* License Plate */}
        <ThemedView className='mb-4'>
          <ThemedText weight='medium' className='mb-1'>License Plate *</ThemedText>
          <ThemedInput
            value={form.plate}
            onChangeText={(text) => {
              const sanitized = sanitizeLicensePlate(text);
              setForm((prev) => ({ ...prev, plate: sanitized }));
              // Clear validation errors when user types
              if (validationErrors.plate) {
                setValidationErrors(prev => ({ ...prev, plate: [] }));
              }
            }}
            placeholder='e.g., ABC1234'
          />
          {validationErrors.plate && validationErrors.plate.length > 0 && (
            <ThemedText variant="error" size="xs" className="mt-1 ml-1">
              {validationErrors.plate[0]}
            </ThemedText>
          )}
        </ThemedView>

        {/* Violation Type */}
        <ThemedText weight='medium' className='mb-1'>Violation Type</ThemedText>
        <ThemedView className='mb-4'>
          <ThemedView className='border border-border rounded-xl px-4 py-3 flex-row items-center bg-background'>
            <MaterialCommunityIcons
              name={
                infractionTypes.find((i) => i.type === form.violation)
                  ?.icon as any
              }
              size={20}
              color={theme === 'dark' ? '#FFA366' : '#E18743'}
              style={{ marginRight: 8 }}
            />
            <TextInput
              className='flex-1 text-text-primary text-md'
              placeholder='Type or select a reason'
              placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
              value={form.violation}
              onChangeText={(text) => {
                setForm((prev) => ({ ...prev, violation: text }));
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              autoCorrect={false}
              autoCapitalize='none'
            />
            <Ionicons
              name={showDropdown ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme === 'dark' ? '#9CA3AF' : '#888888'}
              onPress={() => setShowDropdown((prev) => !prev)}
            />
          </ThemedView>
          {showDropdown && (
            <ThemedCard
              variant='elevated'
              className='mt-2'
              style={{ maxHeight: 180, overflow: 'hidden' }}
            >
              <ScrollView keyboardShouldPersistTaps='handled'>
                {infractionTypes
                  .filter((infraction) =>
                    form.violation.length === 0
                      ? true
                      : infraction.type
                          .toLowerCase()
                          .includes(form.violation.toLowerCase())
                  )
                  .map((infraction, idx, arr) => (
                    <TouchableOpacity
                      key={infraction.code}
                      onPress={() => {
                        setForm((prev) => ({
                          ...prev,
                          violation: infraction.type,
                        }));
                        setShowDropdown(false);
                      }}
                      className={`px-4 py-3 flex-row ${
                        idx !== arr.length - 1 ? 'border-b border-border' : ''
                      }`}
                    >
                      <MaterialCommunityIcons
                        name={infraction.icon as any}
                        size={20}
                        color={theme === 'dark' ? '#FFA366' : '#E18743'}
                        style={{ marginRight: 8 }}
                      />
                      <ThemedText size='sm'>
                        {infraction.type}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </ThemedCard>
          )}
        </ThemedView>

        {/* Date and Time */}
        <ThemedText weight='medium' className='mb-1'>Date & Time</ThemedText>
        <ThemedView className='mb-4'>
          <TouchableOpacity
            className='border border-border rounded-xl px-4 py-3 flex-row items-center justify-between bg-background'
            onPress={() => setShowDate(true)}
            activeOpacity={0.7}
          >
            <ThemedView className='flex-row items-center'>
              <Ionicons
                name='calendar-outline'
                size={20}
                color={theme === 'dark' ? '#FFA366' : '#E18743'}
                style={{ marginRight: 8 }}
              />
              <ThemedText>
                {form.date.toLocaleDateString()}{' '}
                {form.date.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </ThemedText>
            </ThemedView>
            <Ionicons name='chevron-down' size={20} color={theme === 'dark' ? '#9CA3AF' : '#888888'} />
          </TouchableOpacity>
          {showDate && (
            <ThemedCard variant='elevated' className='mt-2 p-2'>
              <DateTimePicker
                value={form.date}
                mode='datetime'
                display='default'
                onChange={(_, selectedDate) => {
                  if (selectedDate)
                    setForm((prev) => ({ ...prev, date: selectedDate }));
                  setShowDate(false);
                }}
              />
            </ThemedCard>
          )}
        </ThemedView>

        {/* Location */}
        <ThemedText weight='medium' className='mb-1'>Location</ThemedText>
        <ThemedView className='mb-4'>
          <ThemedInput
            value={form.location}
            onChangeText={(text) =>
              setForm((prev) => ({ ...prev, location: text }))
            }
            placeholder='Street (e.g., 123 King St W)'
            autoCapitalize='words'
            className='mb-2'
          />
          <ThemedInput
            value={form.city}
            onChangeText={(text) =>
              setForm((prev) => ({ ...prev, city: text }))
            }
            placeholder='City'
            autoCapitalize='words'
            className='mb-2'
          />
          <ThemedInput
            value={form.postalCode}
            onChangeText={(text) =>
              setForm((prev) => ({ ...prev, postalCode: text }))
            }
            placeholder='Postal Code'
            autoCapitalize='characters'
            className='mb-4'
          />
        </ThemedView>

        {/* Fine Amount */}
        <ThemedText weight='medium' className='mb-1'>Fine Amount</ThemedText>
        <ThemedInput
          value={form.fine}
          onChangeText={(text) => setForm((prev) => ({ ...prev, fine: text }))}
          placeholder='$0.00'
          keyboardType='decimal-pad'
          className='mb-4'
        />

        {/* Upload Photo */}
        <ThemedText weight='medium' className='mb-1'>Upload Photo</ThemedText>
        <ThemedButton
          onPress={pickImage}
          variant='secondary'
          className='mb-2'
        >
          Choose File
        </ThemedButton>
        {form.imageUri ? (
          <Image
            source={{ uri: form.imageUri }}
            className='w-full h-40 rounded-lg mb-4'
          />
        ) : (
          <ThemedText variant='tertiary' className='mb-4'>No file chosen</ThemedText>
        )}

        {/* Notes */}
        <ThemedText weight='medium' className='mb-1'>Notes</ThemedText>
        <ThemedInput
          value={form.notes}
          onChangeText={(text) => setForm((prev) => ({ ...prev, notes: text }))}
          placeholder='Add any extra details...'
          multiline
          numberOfLines={4}
          className='mb-6'
        />

        {/* Security Status */}
        {!isHuman && riskLevel !== 'low' && (
          <ThemedView className="mb-4 p-3 bg-warning-light rounded-xl">
            <ThemedText variant="warning" size="xs" className="text-center">
              Security verification in progress...
            </ThemedText>
          </ThemedView>
        )}

        {/* Rate Limit Warning */}
        {isRateLimited && (
          <ThemedView className="mb-4 p-3 bg-error-light rounded-xl">
            <ThemedText variant="error" size="xs" className="text-center">
              Too many submissions. Please wait before submitting another ticket.
            </ThemedText>
          </ThemedView>
        )}

        {/* Buttons */}
        <ThemedView className='flex-row justify-between space-x-4 mb-8'>
          <ThemedButton
            variant='outline'
            onPress={() => {
              navigation.goBack();
            }}
            className='flex-1 mx-3'
            disabled={isCreating}
          >
            Cancel
          </ThemedButton>
          <ThemedButton
            variant='primary'
            onPress={handleSave}
            className='flex-1 mx-3'
            disabled={isCreating || isRateLimited || (!isHuman && riskLevel === 'critical')}
          >
            {isCreating ? 'Saving...' : 'Save Ticket'}
          </ThemedButton>
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
