import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import AppLayout from '../../../wrappers/layout';
import GoBackHeader from '../../../components/GoBackHeader';
import { ThemedView, ThemedText } from '../../../components/ThemedComponents';

const Privacy = () => {
    return (
        <AppLayout>
             {/* Header */}
        <GoBackHeader
          screenTitle='Privacy Policy'
        />
            <ThemedView className='px-5 py-4'>
                <ThemedText variant='primary' size='lg' weight='semibold' className='mb-4'>
                  Privacy Policy
                </ThemedText>
                <ThemedText variant='primary' size='base' className='mb-4'>
                  Your privacy is important to us. This policy explains how we collect, use, and protect your information.
                </ThemedText>
                <ThemedText variant='secondary' size='sm' className='text-center mt-8'>
                  Full privacy policy content would be displayed here.
                </ThemedText>
            </ThemedView>

        </AppLayout>
    );
}

const styles = StyleSheet.create({})

export default Privacy;
