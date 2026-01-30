import React, { useState } from 'react';
import {
  View,
  TextInput,
  Alert,
  Pressable,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Shield, User, Lock, ArrowRight, AlertCircle } from 'lucide-react-native';
import { loginStaff } from '../auth/authService';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      await loginStaff(email, password);
      navigation.replace('EventSelect');
    } catch (e: any) {
      Alert.alert('Login Failed', e?.message ?? 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white"
      >
        {/* Background decorations */}
        <View className="absolute inset-0">
          <View className="absolute top-0 right-0 w-64 h-64 border border-gray-200 rounded-full" />
          <View className="absolute bottom-0 left-0 w-48 h-48 border border-gray-200 rounded-full" />
        </View>

        <View className="flex-1 justify-center px-6">
          {/* Header */}
          <View className="items-center mb-12">
            <View className="border-2 border-gray-900 rounded-2xl p-4 mb-6">
              <View className="flex-row items-center gap-2">
                <Shield size={22} color="#111827" />
                <Text className="text-gray-900 text-xs font-mono">
                  STAFF
                </Text>
              </View>
            </View>

            <Text className="text-3xl font-bold text-gray-900 tracking-tight">
              AVANT
            </Text>
            <Text className="text-gray-600 text-sm font-mono mt-1">
              STAFF_PORTAL
            </Text>
          </View>

          {/* Form */}
          <View className="gap-6">
            {/* Email */}
            <View>
              <View className="flex-row items-center gap-2 mb-2">
                <User size={16} color="#111827" />
                <Text className="text-sm font-mono text-gray-900">
                  STAFF_IDENTIFIER
                </Text>
              </View>

              <TextInput
                placeholder="staff@avant.com"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                className="border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-mono bg-white"
              />
            </View>

            {/* Password */}
            <View>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <Lock size={16} color="#111827" />
                  <Text className="text-sm font-mono text-gray-900">
                    ACCESS_KEY
                  </Text>
                </View>

                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Text className="text-xs text-gray-500 font-mono">
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </Text>
                </Pressable>
              </View>

              <TextInput
                placeholder="••••••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                className="border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-mono bg-white"
              />
            </View>

            {/* Submit */}
            <Pressable
              onPress={onSubmit}
              disabled={loading}
              className={`border-2 border-gray-900 rounded-xl py-4 ${
                loading ? 'opacity-50' : ''
              }`}
            >
              <View className="flex-row items-center justify-center gap-3">
                {loading ? (
                  <>
                    <ActivityIndicator size="small" color="#111827" />
                    <Text className="text-gray-900 font-bold text-lg font-mono">
                      VERIFYING
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="text-gray-900 font-bold text-lg font-mono">
                      INITIATE_SESSION
                    </Text>
                    <ArrowRight size={20} color="#111827" />
                  </>
                )}
              </View>
            </Pressable>

            {/* Info */}
            <View className="pt-6 border-t border-gray-200 items-center">
              <View className="flex-row items-center gap-2 mb-2">
                <AlertCircle size={14} color="#6B7280" />
                <Text className="text-xs text-gray-500 font-mono">
                  STAFF_AUTHENTICATION_ONLY
                </Text>
              </View>
              <Text className="text-xs text-gray-400 text-center">
                Offline-first ticket verification system
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
