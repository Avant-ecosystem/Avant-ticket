import { Api } from '../services/api';
import { networkService } from '../services/network';
import { getSelectedEvent } from '../auth/authStore';
import { ticketRepository } from '../offline-db/ticketRepository';
import { initDb, runExec } from '../offline-db/db';

let started = false;

let triggerSync: (() => void) | null = null;

export function startSync() {
  if (started) return;
  started = true;

  initDb();

  const trySync = async () => {
    if (!networkService.isOnline()) return;

    const queued = ticketRepository.listQueuedUsed();
    console.log('[SYNC] Queue before push:', queued);
    if (!queued.length) return;

    const ticketsByEvent = queued.reduce((acc, { ticketId, eventId }) => {
      if (!acc[eventId]) acc[eventId] = [];
      acc[eventId].push(ticketId);
      return acc;
    }, {} as Record<string, string[]>);

    for (const [eventId, ticketIds] of Object.entries(ticketsByEvent)) {
      try {
        console.log(`[SYNC] Pushing ${ticketIds.length} tickets for event ${eventId}`);
        const res = await Api.pushUsedTickets(eventId, ticketIds);

        if (res.accepted.length) {
          ticketRepository.clearQueue(res.accepted);
          console.log(`[SYNC] Cleared ${res.accepted.length}`);
        }
      } catch (e) {
        console.warn('[SYNC] Failed:', e);
      }
    }
  };

  triggerSync = trySync;

  networkService.on('change', trySync);

  void trySync(); // inicial
}

export function forceSync() {
  if (triggerSync) {
    console.log('[SYNC] Forced sync');
    triggerSync();
  }
}

export async function initialSync(eventId: string) {
  initDb();

  const tickets = await Api.downloadTickets(eventId);
  const mapped = tickets.map((t) => ({
    ticketId: t.ticketId,
    eventId: t.eventId,
    signature: t.signature,
    status: t.status,
  }));

  ticketRepository.clearTickets(eventId);
  runExec(`DELETE FROM used_queue WHERE eventId=?`, [eventId]); // 🔥
  ticketRepository.bulkInsert(mapped);
  console.log('[SYNC] Initial sync completed for event', eventId);
}

export async function clearEventData(eventId: string) {
  try { await Api.clearLocalForEvent(eventId); } catch {}
  ticketRepository.clearTickets(eventId);
}
