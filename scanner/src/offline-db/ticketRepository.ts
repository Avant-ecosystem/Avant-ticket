import { run, runExec } from './db';

export type TicketRow = {
  ticketId: string;
  eventId: string;
  signature: string;
  status: 'unused' | 'used';
};

export const ticketRepository = {
  bulkInsert(tickets: TicketRow[]) {
    if (!tickets.length) return;
    runExec('BEGIN');
    try {
      for (const t of tickets) {
        runExec(
          `INSERT OR REPLACE INTO tickets(ticketId,eventId,signature,status)
           VALUES(?,?,?,?)`,
          [t.ticketId, t.eventId, t.signature, t.status]
        );
      }
      runExec('COMMIT');
    } catch (e) {
      runExec('ROLLBACK');
      throw e;
    }
  },

  get(ticketId: string): TicketRow | undefined {
    const rows = run<TicketRow>(`SELECT * FROM tickets WHERE ticketId=?`, [ticketId]);
    return rows[0];
  },

  updateEvent(ticketId: string, eventId: string) {
    runExec(
      `UPDATE tickets SET eventId=? WHERE ticketId=?`,
      [eventId, ticketId]
    );
  },

markUsed(ticketId: string, eventId: string) {
  const alreadyUsed = this.isUsed(ticketId);
  if (alreadyUsed) {
    console.log('[DB] Ticket already used, skipping queue:', ticketId);
    return;
  }

  runExec('BEGIN');
  try {
    runExec(
      `UPDATE tickets SET status='used', eventId=? WHERE ticketId=?`,
      [eventId, ticketId]
    );

    runExec(
      `INSERT INTO used_queue(ticketId,eventId,usedAt)
       VALUES(?,?,?)`,
      [ticketId, eventId, Date.now()]
    );

    runExec('COMMIT');
  } catch (e) {
    runExec('ROLLBACK');
    throw e;
  }
},

  isUsed(ticketId: string): boolean {
    const rows = run<{ status: string }>(
      `SELECT status FROM tickets WHERE ticketId=?`,
      [ticketId]
    );
    return rows[0]?.status === 'used';
  },

listQueuedUsed(): { ticketId: string; eventId: string }[] {
  return run(`
    SELECT uq.ticketId, uq.eventId
    FROM used_queue uq
    JOIN tickets t ON t.ticketId = uq.ticketId
    WHERE t.status = 'used'
    ORDER BY uq.usedAt ASC
  `);
},

  clearQueue(ticketIds: string[]) {
    if (!ticketIds.length) return;
    const placeholders = ticketIds.map(() => '?').join(',');
    runExec(
      `DELETE FROM used_queue WHERE ticketId IN (${placeholders})`,
      ticketIds
    );
  },

  clearTickets(eventId: string) {
    runExec(`DELETE FROM tickets WHERE eventId=?`, [eventId]);
  },
};
