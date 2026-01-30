import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  Alert, 
  Pressable, 
  Modal,
  Animated,
  StyleSheet,
  Dimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, CameraType } from 'expo-camera';
import { ensureCameraPermission } from '../services/permissions';
import { handleScan } from '../scanner/scannerService';
import { 
  QrCode, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Zap,
  Flashlight,
  FlashlightOff,
  Camera,
  CameraOff,
  Scan,
  Hash,
  Ticket,
  Clock,
  ArrowLeft  // <-- Nuevo ícono agregado
} from 'lucide-react-native';
import { resetDb } from '@/offline-db/db';

const { width, height } = Dimensions.get('window');
const SCANNER_SIZE = Math.min(width, height) * 0.7;

export default function ScannerScreen({ navigation }:any) { // <-- Agregado navigation prop
  const [ready, setReady] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flash, setFlash] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<{ok: boolean, ticketId?: string, message?: string} | null>(null);
  const [showResult, setShowResult] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    //  resetDb()
    ensureCameraPermission().then(setReady);
    startPulseAnimation();
  }, []);

  const dot1 = useRef(new Animated.Value(0.3)).current;
const dot2 = useRef(new Animated.Value(0.3)).current;
const dot3 = useRef(new Animated.Value(0.3)).current;

useEffect(() => {
  Animated.loop(
    Animated.stagger(150, [
      Animated.sequence([
        Animated.timing(dot1, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(dot1, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(dot2, { toValue: 1, duration: 500, useNativeDriver:true }),
        Animated.timing(dot2, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(dot3, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ]),
    ])
  ).start();
}, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const showScanResult = (result: any) => {
    setLastScanResult(result);
    setShowResult(true);
    console.log(result);
    
    
    Animated.timing(resultAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(resultAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowResult(false);
      });
    }, 2000);
  };

  const onBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanning) return;
    
    setScanning(true);
    try {
      console.log(data);
      const res = await handleScan(data);
      showScanResult(res);
      
      if (res.ok) {
        // Success - continue scanning after brief delay
        setTimeout(() => setScanning(false), 1500);
      } else {
        // Error - resume scanning immediately
        setScanning(false);
      }
    } catch (error: any) {
      Alert.alert('SCAN_ERROR', error?.message ?? 'Unknown error');
      console.log(error);
      
      setScanning(false);
    }
  };

  const router = useRouter();
  const toggleFlash = () => setFlash(!flash);
  const toggleCamera = () => setCameraType(prev => prev === 'back' ? 'front' : 'back');
  const goBack = () => navigation.goBack(); // <-- Nueva función para volver atrás

  if (!ready) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <View className="border-2 border-gray-900 rounded-2xl p-8 items-center">
          <View className="border-2 border-gray-900 rounded-full w-20 h-20 items-center justify-center mb-6">
            <CameraOff size={32} color="#111827" />
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2 font-mono">
            CAMERA_PERMISSION
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            Waiting for camera permission...
          </Text>
          <View className="flex-row gap-2">
          <View className="flex-row gap-2">
  <Animated.View style={{ opacity: dot1 }} className="w-2 h-2 bg-gray-900 rounded-full" />
  <Animated.View style={{ opacity: dot2 }} className="w-2 h-2 bg-gray-900 rounded-full" />
  <Animated.View style={{ opacity: dot3 }} className="w-2 h-2 bg-gray-900 rounded-full" />
</View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Header Overlay */}
      <View className="absolute top-0 left-0 right-0 z-10 pt-12 px-6">
        <View className="flex-row items-center justify-between">
          {/* Botón de volver atrás agregado aquí */}
          <Pressable
            onPress={goBack}
            className="border-2 border-white/30 rounded-xl p-2 active:border-white active:bg-white/10 mr-2"
          >
            <ArrowLeft size={20} color="white" />
          </Pressable>
          
          <View className="flex-row items-center gap-3 flex-1">
            <View className="border-2 border-white rounded-xl p-2">
              <QrCode size={20} color="white" />
            </View>
            <View>
              <Text className="text-white text-lg font-bold font-mono">
                SCAN_MODE
              </Text>
              <Text className="text-gray-300 font-mono text-xs">
                ON_CHAIN_VERIFICATION
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center gap-2">
            <View className={`w-2 h-2 rounded-full ${scanning ? 'bg-yellow-500' : 'bg-green-500'}`} />
            <Text className="text-white text-xs font-mono">
              {scanning ? 'PROCESSING...' : 'READY'}
            </Text>
          </View>
        </View>
      </View>

      {/* Camera View */}
      <CameraView 
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanning ? undefined : onBarcodeScanned}
        enableTorch={flash}
        facing={cameraType}
      >
        {/* Scanner Overlay */}
        <View className="flex-1 items-center justify-center">
          {/* Scanner Frame */}
          <View className="relative">
            {/* Top Left Corner */}
            <View className="absolute -top-2 -left-2">
              <View className="border-t-2 border-l-2 border-white w-16 h-16 rounded-tl-2xl" />
            </View>
            
            {/* Top Right Corner */}
            <View className="absolute -top-2 -right-2">
              <View className="border-t-2 border-r-2 border-white w-16 h-16 rounded-tr-2xl" />
            </View>
            
            {/* Bottom Left Corner */}
            <View className="absolute -bottom-2 -left-2">
              <View className="border-b-2 border-l-2 border-white w-16 h-16 rounded-bl-2xl" />
            </View>
            
            {/* Bottom Right Corner */}
            <View className="absolute -bottom-2 -right-2">
              <View className="border-b-2 border-r-2 border-white w-16 h-16 rounded-br-2xl" />
            </View>
            
            {/* Scanning Line */}
            <Animated.View 
              style={[
                styles.scanLine,
                {
                  transform: [{ scaleY: pulseAnim }]
                }
              ]}
            />
            
            {/* Scanner Area */}
            <View 
              className="border-2 border-white/20"
              style={{ width: SCANNER_SIZE, height: SCANNER_SIZE }}
            />
          </View>

          {/* Instructions */}
          <View className="absolute bottom-32 left-0 right-0 items-center">
            <Text className="text-white text-center font-mono mb-2">
              ALIGN_QR_CODE_WITH_FRAME
            </Text>
            <Text className="text-gray-300 text-center text-sm">
              Position ticket QR code within the frame
            </Text>
          </View>
        </View>
      </CameraView>

      {/* Control Panel */}
      <View className="absolute bottom-0 left-0 right-0 bg-black/80 border-t border-gray-800 p-6">
        <View className="flex-row items-center justify-between">
          {/* Flash Toggle */}
          <Pressable
            onPress={toggleFlash}
            className="border-2 border-white/30 rounded-xl p-3 active:border-white active:bg-white/10"
          >
            {flash ? (
              <FlashlightOff size={24} color="white" />
            ) : (
              <Flashlight size={24} color="white" />
            )}
          </Pressable>

          {/* Scan Status */}
          <View className="items-center">
            <View className="border-2 border-white/30 rounded-full w-16 h-16 items-center justify-center mb-2">
              <Scan size={28} color="white" />
            </View>
            <Text className="text-white text-xs font-mono">
              {scanning ? 'SCANNING...' : 'SCAN_READY'}
            </Text>
          </View>

          {/* Camera Toggle */}
          <Pressable
            onPress={toggleCamera}
            className="border-2 border-white/30 rounded-xl p-3 active:border-white active:bg-white/10"
          >
            <Camera size={24} color="white" />
          </Pressable>
        </View>
      </View>

      {/* Scan Result Modal */}
      <Modal
        visible={showResult}
        transparent
        animationType="fade"
      >
        <Animated.View 
          style={[
            styles.resultContainer,
            { opacity: resultAnim }
          ]}
        >
          <View className={`rounded-2xl p-6 items-center ${lastScanResult?.ok ? 'bg-green-900/90' : 'bg-red-900/90'}`}>
            <View className="border-2 border-white rounded-full w-20 h-20 items-center justify-center mb-4">
              {lastScanResult?.ok ? (
                <CheckCircle size={36} color="white" />
              ) : (
                <XCircle size={36} color="white" />
              )}
            </View>
            
            <Text className="text-white text-xl font-bold font-mono mb-2">
              {lastScanResult?.ok ? 'VERIFIED' : 'INVALID'}
            </Text>
            
            {lastScanResult?.ticketId && (
              <View className="flex-row items-center gap-2 mb-3">
                <Hash size={14} color="white" />
                <Text className="text-white font-mono text-sm">
                  {lastScanResult.ticketId.slice(0, 8)}...
                </Text>
              </View>
            )}
            
            <Text className="text-white/90 text-center text-sm">
              {lastScanResult?.ok 
                ? 'Ticket verified on-chain'
                : lastScanResult?.message?.replace('_', ' ') || 'Invalid QR code'
              }
            </Text>
            
            <View className="flex-row items-center gap-2 mt-4">
              <Clock size={14} color="white" />
              <Text className="text-white/80 text-xs">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        </Animated.View>
      </Modal>

      {/* Security Info */}
      <View className="absolute top-20 right-6 z-10">
        <View className="border-2 border-white/30 rounded-xl p-3">
          <Shield size={20} color="white" />
        </View>
      </View>

      {/* Event Info */}
      <View className="absolute bottom-44 left-6 z-10">
        <View className="border-2 border-white/30 rounded-xl px-3 py-2">
          <View className="flex-row items-center gap-2">
            <Ticket size={16} color="white" />
            <Text className="text-white text-xs font-mono">LIVE_SCAN</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
});