import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../../wrappers/layout';
import Dialog from '../../components/Dialog';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTicketStackNavigation } from '../../navigation/hooks';
import { TicketStackParamList } from '../../navigation/types';
import { ThemedView, ThemedText, ThemedCard, ThemedInput, ThemedButton, ThemedScrollView } from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';
import GoBackHeader from '../../components/GoBackHeader';

const disputeReasons = [
  'I was not the driver',
  'Signage was unclear',
  'Ticket issued in error',
  'Other',
];

export default function DisputeForm() {
  const navigation = useTicketStackNavigation();
  const { theme } = useTheme();
  const route = useRoute<RouteProp<TicketStackParamList, 'DisputeForm'>>();
  const ticketId = route.params.ticketId;

  const [selectedReason, setSelectedReason] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [comments, setComments] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogProps, setDialogProps] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning',
  });

  const handlePickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission denied', 'Media library access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      selectionLimit: 5,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map((asset) => asset.uri);
      setImageUris((prev) => [...prev, ...newUris]);
    }
  };

  const handleRemoveImage = (uriToRemove: string) => {
    setImageUris((prev) => prev.filter((uri) => uri !== uriToRemove));
  };

  const handleContinue = () => {
  if (!selectedReason || !comments.trim()) {
    setDialogProps({
      title: "Missing Information",
      message:
        "Please select a dispute reason and provide additional comments to proceed.",
      type: "info",
    });
    setDialogVisible(true);
    return;
  }

  // Show success dialog (don't navigate yet)
  setDialogProps({
    title: "Dispute Submitted",
    message:
      "Your dispute has been submitted successfully and is now under review.",
    type: "success",
  });
  setDialogVisible(true);
};

const messageComponent = () => dialogProps.type === 'success' ? (
  <ThemedView className='flex-column items-center'>
    <ThemedText size='sm' className='ml-2'>
      <ThemedText weight='bold'>Reference: #DSP-789</ThemedText>
    </ThemedText>
    <ThemedText size='sm' className='ml-2 text-center'>
     We will let you know the outcome when the review is complete.
    </ThemedText>
  </ThemedView>
) : 'Please select a dispute reason and provide additional comments to proceed.';


  return (
    <AppLayout scrollable={false}>
      <ThemedScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <GoBackHeader screenTitle='File a Dispute' />

        {/* Step Indicator */}
        <ThemedView className='px-4 mb-4'>
          <ThemedText size='sm' variant='tertiary'>Step 1 of 3</ThemedText>
          <ThemedText weight='bold' size='base' className='mt-1'>
            Ticket Details & Reason
          </ThemedText>
        </ThemedView>

        {/* Ticket Summary */}
        <ThemedCard className='mx-4 mb-4'>
          <ThemedText variant='tertiary' size='sm'>Ticket #</ThemedText>
          <ThemedText weight='semibold' className='mb-2'>12345678</ThemedText>
          <ThemedText variant='tertiary' size='sm'>Date & Location</ThemedText>
          <ThemedText size='sm' className='mb-2'>
            May 30, 2025 · Toronto
          </ThemedText>
          <ThemedText variant='tertiary' size='sm'>Amount</ThemedText>
          <ThemedText weight='semibold'>$75.00</ThemedText>
        </ThemedCard>

        {/* Reason Selector */}
        <ThemedView className='mx-4 mb-4'>
          <ThemedText variant='tertiary' size='sm' className='mb-2'>Dispute Reason</ThemedText>
          <TouchableOpacity
            onPress={() => setShowDropdown(!showDropdown)}
            className='border border-border rounded-xl px-4 py-3 bg-background'
          >
            <ThemedText size='sm'>
              {selectedReason || 'Select a reason'}
            </ThemedText>
          </TouchableOpacity>
          {showDropdown && (
            <ThemedView className='mt-2 border border-border rounded-xl bg-background'>
              {disputeReasons.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  onPress={() => {
                    setSelectedReason(reason);
                    setShowDropdown(false);
                  }}
                  className='px-4 py-3 border-b border-border'
                >
                  <ThemedText size='sm'>{reason}</ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>
          )}
        </ThemedView>

        {/* Comments */}
        <ThemedView className='mx-4 mb-4'>
          <ThemedText variant='tertiary' size='sm' className='mb-2'>
            Additional Comments
          </ThemedText>
          <ThemedInput
            multiline
            placeholder='Explain your dispute...'
            value={comments}
            onChangeText={setComments}
            className='min-h-[100px]'
          />
        </ThemedView>

        {/* Upload Section */}
        <ThemedView className='mx-4 mb-6'>
          <ThemedText variant='tertiary' size='sm' className='mb-2'>Upload Photos</ThemedText>

          <TouchableOpacity
            onPress={handlePickImages}
            className='border border-dashed border-border rounded-xl py-10 items-center bg-background mb-4'
          >
            <Ionicons
              name='cloud-upload-outline'
              size={28}
              color={theme === 'dark' ? '#94A3B8' : '#9CA3AF'}
            />
            <ThemedText variant='tertiary' size='sm' className='mt-2'>Add image(s)</ThemedText>
          </TouchableOpacity>

          {imageUris.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {imageUris.map((uri) => (
                <View key={uri} className='relative mr-3'>
                  <Image
                    source={{ uri }}
                    className='w-24 h-24 rounded-lg'
                    resizeMode='cover'
                  />
                  <TouchableOpacity
                    className='absolute -top-2 -right-2 bg-white rounded-full p-1'
                    onPress={() => handleRemoveImage(uri)}
                  >
                    <Ionicons name='close-circle' size={20} color='#EF4444' />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </ThemedView>

        {/* Submit */}
        <ThemedView className='px-4'>
          <ThemedButton
            onPress={handleContinue}
            variant='primary'
            size='lg'
          >
            Continue
          </ThemedButton>
        </ThemedView>
      </ThemedScrollView>
      <Dialog
        visible={dialogVisible}
        title={dialogProps.title}
        messageComponent={messageComponent()}
        type={dialogProps.type}
        onClose={() => {
          setDialogVisible(false);
          if (dialogProps.type === 'success') {
            navigation.navigate('TicketList');
          }
        }}
      />
    </AppLayout>
  );
}
