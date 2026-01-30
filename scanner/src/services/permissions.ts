import { Camera } from 'expo-camera';

export async function ensureCameraPermission(): Promise<boolean> {
  const { status } = await Camera.requestCameraPermissionsAsync();
  return status === 'granted';
}
