import React from 'react';
import { View, Text, Button } from 'react-native';
import { getSelectedEvent } from '../auth/authStore';
import { ticketRepository } from '../offline-db/ticketRepository';
import { startSync } from '../sync-engine/syncService';

export default function SyncStatusScreen() {
  const [queued, setQueued] = React.useState<number>(0);
  const [eventId, setEventId] = React.useState<string | undefined>(undefined);

  const refresh = async () => {
    const e = await getSelectedEvent();
    setEventId(e ?? undefined);
    if (e) setQueued(ticketRepository.listQueuedUsed(e).length);
  };

  React.useEffect(() => { refresh(); }, []);

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text>Event: {eventId ?? '-'}</Text>
      <Text>Queued used tickets: {queued}</Text>
      <Button title="Force Sync" onPress={() => { startSync(); setTimeout(refresh, 1000); }} />
    </View>
  );
}
