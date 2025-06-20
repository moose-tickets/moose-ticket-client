import * as LocalAuthentication from 'expo-local-authentication';

export async function isBiometricSupported(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    const supported = await isBiometricSupported();
    console.log(supported)
    if (!supported) {
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to enable Face/Touch ID',
      fallbackLabel: 'Enter Passcode',
      cancelLabel: 'Cancel',
    });

    return result.success;
  } catch (error) {
    console.error('Biometric auth error:', error);
    return false;
  }
}
