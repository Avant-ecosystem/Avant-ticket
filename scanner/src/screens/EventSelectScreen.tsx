import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Alert, 
  Pressable, 
  ActivityIndicator,
  ScrollView,
  RefreshControl 
} from 'react-native';
import { Api } from '../services/api';
import { selectEvent } from '../auth/authService';
import { forceSync, initialSync, startSync } from '../sync-engine/syncService';
import { 
  Calendar, 
  ChevronRight, 
  AlertCircle, 
  Shield, 
  RefreshCw,
  Hash,
  CheckCircle,
  Clock
} from 'lucide-react-native';
import { debugDb } from '@/offline-db/db';

type EventItem = {
  id: string;
  name: string;
  secret: string;
  date?: string;
  ticketsTotal?: number;
  ticketsRemaining?: number;
};

export default function EventSelectScreen({ navigation }: any) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      const e = await Api.listEvents();
      setEvents(
        e.map((x: any) => ({
          id: x.id,
          name: x.name,
          secret: x.metadataHash,
          date: x.eventStartTime,
          ticketsTotal: x.ticketsTotal,
          ticketsRemaining: x.ticketsRemaining,
        })),
      );
    } catch (e: any) {
      Alert.alert('LOAD_ERROR', e.message || 'Failed to load events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
    forceSync()
  };

  const onSelect = async (evt: EventItem) => {
    try {
      if (!evt.secret) {
        Alert.alert(
          'ERROR',
          'Este evento no tiene una clave válida para verificación'
        );
        console.log(evt);
        return;
      }
   
      
  
      setSelectedId(evt.id);
await initialSync(evt.id);
debugDb();
startSync();
forceSync(); // 🔥 ESTO FALTABA
      navigation.replace('Scanner');
    } catch (e: any) {
      Alert.alert('SYNC_ERROR', e?.message ?? 'Failed to sync event data');
      console.log(e);
      setSelectedId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'DATE_NOT_SET';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAvailabilityPercentage = (remaining?: number, total?: number) => {
    if (!remaining || !total) return 0;
    return ((total - remaining) / total) * 100;
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="border-b-2 border-gray-900 bg-white pt-12 pb-6 px-6">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-3">
            <View className="border-2 border-gray-900 rounded-xl p-2">
              <Calendar size={24} color="#111827" />
            </View>
            <View>
              <Text className="text-3xl font-bold text-gray-900 tracking-tight">
                SELECT_CONTRACT
              </Text>
              <Text className="text-gray-600 font-mono text-sm">
                CHOOSE_EVENT_TO_VERIFY
              </Text>
            </View>
          </View>
        </View>
        
        {/* Stats */}
        {events.length > 0 && (
          <View className="flex-row gap-3">
            <View className="border-2 border-gray-200 rounded-xl px-3 py-2 flex-1">
              <Text className="text-xs text-gray-500 font-mono mb-1">TOTAL_EVENTS</Text>
              <Text className="text-xl font-bold text-gray-900">{events.length}</Text>
            </View>
            <View className="border-2 border-gray-200 rounded-xl px-3 py-2 flex-1">
              <Text className="text-xs text-gray-500 font-mono mb-1">ACTIVE</Text>
              <Text className="text-xl font-bold text-green-600">
                {events.filter(e => e.ticketsRemaining && e.ticketsRemaining > 0).length}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView 
        className="flex-1 px-4 py-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#111827"
          />
        }
      >
        {loading && !refreshing ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#111827" />
            <Text className="text-gray-600 font-mono text-sm mt-4">
              LOADING_CONTRACTS
            </Text>
            <View className="flex-row gap-1 mt-4">
              <View className="w-1.5 h-1.5 bg-gray-900 rounded-full" style={{opacity: 0.6}} />
              <View className="w-1.5 h-1.5 bg-gray-900 rounded-full" style={{opacity: 0.8}} />
              <View className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
            </View>
          </View>
        ) : events.length === 0 ? (
          <View className="border-2 border-gray-900 rounded-2xl p-8 items-center justify-center my-8">
            <View className="border-2 border-gray-900 rounded-full w-16 h-16 items-center justify-center mb-4">
              <AlertCircle size={28} color="#111827" />
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2 font-mono">
              NO_CONTRACTS
            </Text>
            <Text className="text-gray-600 text-center mb-6">
              No hay contratos de evento disponibles para verificación
            </Text>
            <Pressable
              onPress={loadEvents}
              className="border-2 border-gray-300 rounded-xl px-6 py-3 active:border-gray-900 active:bg-gray-50"
            >
              <View className="flex-row items-center gap-2">
                <RefreshCw size={16} color="#111827" />
                <Text className="font-mono text-gray-900">REFRESH</Text>
              </View>
            </Pressable>
          </View>
        ) : (
          <View className="gap-4">
            {events.map((event) => {
              const availabilityPercentage = getAvailabilityPercentage(
                event.ticketsRemaining,
                event.ticketsTotal
              );
              const isSelecting = selectedId === event.id;
              
              return (
                <Pressable
                  key={event.id}
                  onPress={() => !isSelecting && onSelect(event)}
                  disabled={isSelecting}
                  className={`border-2 rounded-2xl overflow-hidden transition-all ${isSelecting ? 'border-gray-900 bg-gray-50 opacity-70' : 'border-gray-200 active:border-gray-900 active:bg-gray-50'}`}
                >
                  {/* Event Header */}
                  <View className="p-4">
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-gray-900 font-mono" numberOfLines={1}>
                          {event.name.toUpperCase()}
                        </Text>
                        <View className="flex-row items-center gap-2 mt-1">
                          <Hash size={12} color="#6B7280" />
                          <Text className="text-xs text-gray-500 font-mono" numberOfLines={1}>
                            {event.id.slice(0, 8)}...{event.id.slice(-8)}
                          </Text>
                        </View>
                      </View>
                      
                      {isSelecting ? (
                        <ActivityIndicator size="small" color="#111827" />
                      ) : (
                        <ChevronRight size={20} color="#111827" />
                      )}
                    </View>

                    {/* Event Date */}
                    <View className="flex-row items-center gap-2 mb-4">
                      <Clock size={14} color="#111827" />
                      <Text className="text-sm text-gray-600">
                        {formatDate(event.date)}
                      </Text>
                    </View>

                    {/* Ticket Stats */}
                    <View className="border-2 border-gray-200 rounded-xl p-3">
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center gap-2">
                          <Shield size={14} color="#111827" />
                          <Text className="text-xs text-gray-500 font-mono">TICKETS</Text>
                        </View>
                        <Text className={`text-xs font-mono px-2 py-1 rounded-full ${
                          availabilityPercentage > 80 ? 'bg-green-100 text-green-800' :
                          availabilityPercentage > 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {availabilityPercentage.toFixed(1)}% SOLD
                        </Text>
                      </View>
                      
                      {/* Progress Bar */}
                      <View className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                        <View 
                          className={`h-1.5 rounded-full ${
                            availabilityPercentage > 80 ? 'bg-green-500' :
                            availabilityPercentage > 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, availabilityPercentage)}%` }}
                        />
                      </View>
                      
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-gray-500 font-mono">
                          {event.ticketsRemaining || 0} LEFT
                        </Text>
                        <Text className="text-xs text-gray-500 font-mono">
                          {event.ticketsTotal || 0} TOTAL
                        </Text>
                      </View>
                    </View>

                    {/* Sync Status */}
                    <View className="flex-row items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                      <View className={`w-2 h-2 rounded-full ${isSelecting ? 'bg-yellow-500' : 'bg-green-500'}`} />
                      <Text className="text-xs text-gray-600">
                        {isSelecting ? 'SYNCING_DATA...' : 'READY_TO_VERIFY'}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Security Notice */}
        <View className="mt-8 pt-6 border-t border-gray-200">
          <View className="flex-row items-start gap-3">
            <View className="mt-0.5">
              <AlertCircle size={16} color="#6B7280" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-900 font-mono mb-1">
                SECURITY_NOTICE
              </Text>
              <Text className="text-xs text-gray-600">
                Each event has a unique encryption key. Data is synced locally for offline verification.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Network Status */}
      <View className="border-t-2 border-gray-900 bg-white py-3 px-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="w-2 h-2 bg-green-500 rounded-full" />
            <Text className="text-xs text-gray-600 font-mono">
              CONNECTED • STARKNET
            </Text>
          </View>
          <Text className="text-xs text-gray-500">
            {events.length} CONTRACTS
          </Text>
        </View>
      </View>
    </View>
  );
}