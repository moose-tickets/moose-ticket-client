import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useSettingsStackNavigation } from '../../../navigation/hooks';
import { SettingsStackParamList } from '../../../navigation/types';
import * as ImagePicker from 'expo-image-picker';
import AppLayout from '../../../wrappers/layout';
import GoBackHeader from '../../../components/GoBackHeader';
import Dialog from '../../../components/Dialog';
import { ThemedView, ThemedText, ThemedButton, ThemedInput, ThemedScrollView } from '../../../components/ThemedComponents';
import { useTheme } from '../../../wrappers/ThemeProvider';

export default function EditProfile() {
  const navigation = useSettingsStackNavigation();
  const route = useRoute<RouteProp<SettingsStackParamList, 'EditProfile'>>();
  const { theme, presets } = useTheme();
  const userId = route.params.userId;
  const [name, setName] = useState('Jane Doe');
  const [email, setEmail] = useState('jane.doe@example.com');
  const [phone, setPhone] = useState('+1 (416) 555-0123');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogProps, setDialogProps] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning',
  });

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!name || !email || !phone) {
      alert('All fields are required');
      return;
    }

    const profile = { name, email, phone, avatarUri };
    console.log('Saving profile:', profile);

    setDialogProps({
      title: 'Profile Updated',
      message:
        'Your profile has been updated successfully',
      type: 'success',
    });
    setDialogVisible(true);
  };

  return (
    <AppLayout scrollable={false}>
      <ThemedScrollView className='flex-1  px-5'>
        {/* Header */}
        <GoBackHeader screenTitle={'Edit Profile'} />
        {/* Avatar */}
        <ThemedView className='items-center mt-2 mb-6 relative'>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              className='w-20 h-20 rounded-full'
            />
          ) : (
            <ThemedView className='bg-primary w-20 h-20 rounded-full items-center justify-center'>
              <ThemedText variant='inverse' size='xl' weight='bold'>JD</ThemedText>
            </ThemedView>
          )}

          {/* Pencil Icon */}
          <TouchableOpacity
            onPress={pickAvatar}
            className='absolute bottom-1 right-50 left-50 bg-background border border-border p-1 rounded-full'
            style={{ transform: [{ translateX: 12 }, { translateY: 12 }] }} // slight offset
          >
            <Ionicons name='pencil' size={16} color={theme === 'dark' ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
        </ThemedView>

        <ThemedView className='space-y-4'>
          <ThemedInput
            className='mb-2'
            placeholder='Full Name'
            value={name}
            onChangeText={setName}
          />
          <ThemedInput
            className='mb-2'
            placeholder='Email Address'
            keyboardType='email-address'
            value={email}
            onChangeText={setEmail}
          />
          <ThemedInput
            className='mb-2'
            placeholder='Phone Number'
            keyboardType='phone-pad'
            value={phone}
            onChangeText={setPhone}
          />
        </ThemedView>

        <ThemedButton
          onPress={handleSave}
          variant='primary'
          size='lg'
          className='mt-8'
        >
          Update Profile
        </ThemedButton>

        <ThemedButton
          onPress={() => navigation.goBack()}
          variant='ghost'
          className='mt-4'
        >
          Cancel
        </ThemedButton>
      </ThemedScrollView>
      <Dialog
        visible={dialogVisible}
        title={dialogProps.title}
        message={dialogProps.message}
        type={dialogProps.type}
        onClose={() => {
          setDialogVisible(false);
          if (dialogProps.type === 'success') {
            navigation.navigate('Profile');
          }
        }}
      />
    </AppLayout>
  );
}
