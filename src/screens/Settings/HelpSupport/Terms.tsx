import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import AppLayout from '../../../wrappers/layout';
import GoBackHeader from '../../../components/GoBackHeader';
import { ThemedView, ThemedText } from '../../../components/ThemedComponents';

const Terms = () => {
  return (
    <AppLayout>
      {/* Header */}
      <GoBackHeader screenTitle='Terms Of Service' />
      <ThemedView className='px-5 py-4'>
        <ThemedText variant='primary' size='lg' weight='semibold' className='mb-4'>
          Terms of Service
        </ThemedText>
        <ThemedText variant='primary' size='base' className='mb-4'>
          Welcome to MooseTicket. By using our app, you agree to these terms.
        </ThemedText>
        <ThemedText variant='secondary' size='sm' className='text-center mt-8'>
          Full terms of service content would be displayed here.
        </ThemedText>
      </ThemedView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({});

export default Terms;
