import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Image } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../wrappers/ThemeProvider';
import AppLayout from '../../wrappers/layout';
import GoBackHeader from '../../components/GoBackHeader';
import Dialog from '../../components/Dialog';
import { useNavigation } from '@react-navigation/native';
import {
  ThemedView,
  ThemedText,
  ThemedInput,
  ThemedButton,
  ThemedCard,
  ThemedScrollView,
} from '../../components/ThemedComponents';
import { useBotCheck } from '../../hooks/UseBotCheck';
import { validateLicensePlate, validateRequired } from '../../utils/validators';
import {
  sanitizeLicensePlate,
  sanitizeUserContent,
  sanitizeFileName,
} from '../../utils/sanitize';
import { useAppDispatch, useAppSelector } from '../../store';
import { createTicket, clearError } from '../../store/slices/ticketSlice';
import { InfractionTypeSelector } from '../../components/InfractionTypeSelector';
import { InfractionType } from '../../store/slices/infractionTypeSlice';

export default function AddTicket() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as 'en' | 'fr' | 'ar' | 'es';
  
  // Helper function to get localized infraction type text
  const getLocalizedInfractionType = (infractionType: InfractionType) => {
    if (!infractionType) return '';
    
    // Handle new multilingual structure
    if (infractionType.type && typeof infractionType.type === 'object') {
      return infractionType.type[currentLanguage] || infractionType.type.en || '';
    }
    
    // Handle old string structure (backwards compatibility)
    if (typeof infractionType.type === 'string') {
      return infractionType.type;
    }
    
    return '';
  };
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
    fineAmount: '',
    notes: '',
    imageUri: null as string | null,
  });
  const [selectedInfractionType, setSelectedInfractionType] =
    useState<InfractionType | null>(null);
  const [showDate, setShowDate] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>
  >({});

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogProps, setDialogProps] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning',
  });

  // Security hooks
  const { checkBot, isHuman, riskLevel } = useBotCheck({
    onBotDetected: (context) => {
      setDialogProps({
        title: t('errors.permissionDenied'),
        message: t('errors.somethingWentWrong'),
        type: 'error',
      });
      setDialogVisible(true);
    },
  });

  // Handle Redux errors
  useEffect(() => {
    if (error) {
      setDialogProps({
        title: t('common.error'),
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

    // Validate selected infraction type
    if (!selectedInfractionType) {
      errors.violation = [t('tickets.selectViolationType')];
    }

    // Validate required fields
    const requiredFields = [
      { key: 'location', label: t('tickets.location') },
      { key: 'city', label: t('tickets.city') },
    ];

    requiredFields.forEach(({ key, label }) => {
      const result = validateRequired(form[key as keyof typeof form], label);
      if (!result.isValid) {
        errors[key] = result.errors;
      }
    });

    // Fine amount is auto-populated from selected infraction type

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
    if (isCreating) return;

    setValidationErrors({});

    try {
      // 1. Validate form
      const isFormValid = validateForm();
      if (!isFormValid) {
        setDialogProps({
          title: t('auth.validationFailed'),
          message: t('tickets.correctErrors'),
          type: 'error',
        });
        setDialogVisible(true);
        return;
      }

      // 2. Perform bot detection check
      const botContext = await checkBot();
      if (!botContext.isHuman && botContext.riskLevel === 'critical') {
        throw new Error('Security verification failed');
      }
// fineAmount
      // 3. Prepare ticket data for API
      const ticketData = {
        licensePlate: sanitizeLicensePlate(form.plate),
        violationType: getLocalizedInfractionType(selectedInfractionType) || '',
        violationCode: selectedInfractionType?.code || '',
        issueDate: form.date.toISOString(),
        location: sanitizeUserContent(form.location),
        city: sanitizeUserContent(form.city),
        postalCode: form.postalCode.trim().toUpperCase(),
        fineAmount: form.fineAmount || selectedInfractionType?.baseFine,
        points: selectedInfractionType?.points || 0,
        category: selectedInfractionType?.category || '',
        notes: sanitizeUserContent(form.notes),
        images: form.imageUri ? [form.imageUri] : [],
      };

      console.log('🎫 Prepared ticket data:', ticketData);

      // 4. Create ticket via Redux
      await dispatch(createTicket(ticketData)).unwrap();

      // Success
      setDialogProps({
        title: t('tickets.ticketAddedSuccess'),
        message: t('tickets.ticketSavedSecurely'),
        type: 'success',
      });
      setDialogVisible(true);

      // Navigate back after delay
      setTimeout(() => {
        setDialogVisible(false);
        navigation.goBack();
      }, 2000);
    } catch (error: any) {
      console.error('Save ticket error:', error);

      setDialogProps({
        title: t('tickets.saveFailed'),
        message: error.message || t('tickets.saveFailedMessage'),
        type: 'error',
      });
      setDialogVisible(true);
    }
  };

  return (
    <AppLayout scrollable={false}>
      <ThemedScrollView className='flex-1 px-5 '>
        {/* Header */}
        <GoBackHeader screenTitle={t('tickets.addTicket')} />

        {/* License Plate */}
        <ThemedView className='mb-4'>
          <ThemedText weight='medium' className='mb-1'>
            {t('tickets.licensePlate')} *
          </ThemedText>
          <ThemedInput
            value={form.plate}
            onChangeText={(text) => {
              const sanitized = sanitizeLicensePlate(text);
              setForm((prev) => ({ ...prev, plate: sanitized }));
              // Clear validation errors when user types
              if (validationErrors.plate) {
                setValidationErrors((prev) => ({ ...prev, plate: [] }));
              }
            }}
            placeholder={t('tickets.licensePlatePlaceholder')}
          />
          {validationErrors.plate && validationErrors.plate.length > 0 && (
            <ThemedText variant='error' size='xs' className='mt-1 ml-1'>
              {validationErrors.plate[0]}
            </ThemedText>
          )}
        </ThemedView>

        {/* Violation Type */}
        <ThemedView className='mb-4'>
          <ThemedText weight='medium' className='mb-1'>
            {t('tickets.violationType')} *
          </ThemedText>

          <InfractionTypeSelector
            selectedInfractionType={selectedInfractionType}
            onSelect={(infractionType) => {
              setSelectedInfractionType(infractionType);
              setForm((prev) => ({
                ...prev,
                violation: getLocalizedInfractionType(infractionType),
                fine: infractionType.baseFine.toString(),
              }));
              // Clear validation error when user selects
              if (validationErrors.violation) {
                setValidationErrors((prev) => ({ ...prev, violation: [] }));
              }
            }}
            placeholder={t('tickets.selectViolationType')}
          />
          {validationErrors.violation &&
            validationErrors.violation.length > 0 && (
              <ThemedText variant='error' size='xs' className='mt-1 ml-1'>
                {validationErrors.violation[0]}
              </ThemedText>
            )}
          {selectedInfractionType && (
            <ThemedView className='mt-2 p-3 bg-background border border-border rounded-xl'>
              <ThemedView className='flex-row justify-between items-center mb-1'>
                <ThemedText size='sm' variant='secondary'>
                  {t('tickets.code')}: {selectedInfractionType.code}
                </ThemedText>
                <ThemedView className='flex-row items-center gap-2'>
                  <ThemedView
                    style={{
                      backgroundColor:
                        selectedInfractionType.category === 'moving'
                          ? '#ff6b6b'
                          : '#4ecdc4',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 10,
                    }}
                  >
                    <ThemedText
                      size='xs'
                      style={{
                        color: 'white',
                        fontWeight: '500',
                        textTransform: 'capitalize',
                      }}
                    >
                      {selectedInfractionType.category}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
              <ThemedView className='flex-row justify-between items-center'>
                <ThemedText
                  size='sm'
                  style={{ color: '#e74c3c', fontWeight: '600' }}
                >
                 {t('tickets.baseFine')}: ${selectedInfractionType.baseFine}
                </ThemedText>
                <ThemedText size='sm' variant='secondary'>
                  {t('tickets.points')}: {selectedInfractionType.points}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          )}
        </ThemedView>

        {/* Date and Time */}
        <ThemedText weight='medium' className='mb-1'>
          {t('tickets.dateTime')}
        </ThemedText>
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
            <Ionicons
              name='chevron-down'
              size={20}
              color={theme === 'dark' ? '#9CA3AF' : '#888888'}
            />
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
        <ThemedText weight='medium' className='mb-1'>
          {t('tickets.location')}
        </ThemedText>
        <ThemedView className='mb-4'>
          <ThemedInput
            value={form.location}
            onChangeText={(text) =>
              setForm((prev) => ({ ...prev, location: text }))
            }
            placeholder={t('tickets.streetPlaceholder')}
            autoCapitalize='words'
            className='mb-2'
          />
          <ThemedInput
            value={form.city}
            onChangeText={(text) =>
              setForm((prev) => ({ ...prev, city: text }))
            }
            placeholder={t('tickets.city')}
            autoCapitalize='words'
            className='mb-2'
          />
          <ThemedInput
            value={form.postalCode}
            onChangeText={(text) =>
              setForm((prev) => ({ ...prev, postalCode: text }))
            }
            placeholder={t('tickets.postalCode')}
            autoCapitalize='characters'
            className='mb-4'
          />
        </ThemedView>

        {/* Fine Amount - Auto-populated */}
        <ThemedView className='mb-4'>
          <ThemedText weight='medium' className='mb-1'>
            {t('tickets.fineAmount')}
          </ThemedText>
          <ThemedView className=' flex-row items-start border border-border rounded-xl px-4 py-3'>
            <ThemedView className='flex-column items-start mr-6'>
              <ThemedText>{t('tickets.baseFine')}</ThemedText>
              <ThemedView className='flex-row items-center mr-2'>
              <Ionicons
                name='cash-outline'
                size={20}
                color={theme === 'dark' ? '#FFA366' : '#E18743'}
                style={{ marginRight: 8 }}
              />
              <ThemedText>
                {selectedInfractionType
                  ? `$${selectedInfractionType.baseFine}`
                  : '$0.00'}
              </ThemedText>
                </ThemedView>
            </ThemedView>
            <ThemedInput
              value={form.fineAmount}
              onChangeText={(text) =>
                setForm((prev) => ({ ...prev, fineAmount: text }))
              }
              placeholder={t('tickets.actualAmountPlaceholder')}
              keyboardType='decimal-pad'
              className='flex-1 border'
             
            />
          </ThemedView>
        </ThemedView>

        {/* Upload Photo */}
        <ThemedText weight='medium' className='mb-1'>
          {t('tickets.uploadPhoto')}
        </ThemedText>
        <ThemedButton onPress={pickImage} variant='secondary' className='mb-2'>
          {t('tickets.chooseFile')}
        </ThemedButton>
        {form.imageUri ? (
          <Image
            source={{ uri: form.imageUri }}
            className='w-full h-40 rounded-lg mb-4'
          />
        ) : (
          <ThemedText variant='tertiary' className='mb-4'>
            {t('tickets.noFileChosen')}
          </ThemedText>
        )}

        {/* Notes */}
        <ThemedText weight='medium' className='mb-1'>
          {t('tickets.notes')}
        </ThemedText>
        <ThemedInput
          value={form.notes}
          onChangeText={(text) => setForm((prev) => ({ ...prev, notes: text }))}
          placeholder={t('tickets.notesPlaceholder')}
          multiline
          numberOfLines={4}
          className='mb-6'
        />

        {/* Security Status */}
        {!isHuman && riskLevel !== 'low' && (
          <ThemedView className='mb-4 p-3 bg-warning-light rounded-xl'>
            <ThemedText variant='warning' size='xs' className='text-center'>
              {t('auth.securityVerification')}
            </ThemedText>
          </ThemedView>
        )}

        {/* Rate limiting removed */}

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
            {t('common.cancel')}
          </ThemedButton>
          <ThemedButton
            variant='primary'
            onPress={handleSave}
            className='flex-1 mx-3'
            disabled={isCreating || (!isHuman && riskLevel === 'critical')}
          >
            {isCreating ? t('tickets.saving') : t('tickets.saveTicket')}
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
