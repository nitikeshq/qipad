import { db } from "./db";
import { events } from "@shared/schema";
import { sql, lt, and, eq } from "drizzle-orm";

/**
 * Manages event lifecycle:
 * 1. Marks events as 'inactive' when their event date has passed
 * 2. Removes events that have been inactive for 30+ days
 */
export async function manageEventLifecycle() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Step 1: Mark expired events as inactive
    const expiredEventsResult = await db
      .update(events)
      .set({ 
        status: 'inactive',
        updatedAt: now
      })
      .where(
        and(
          lt(events.eventDate, now),
          eq(events.status, 'active')
        )
      )
      .returning({ id: events.id, title: events.title });

    if (expiredEventsResult.length > 0) {
      console.log(`Marked ${expiredEventsResult.length} expired events as inactive:`, 
        expiredEventsResult.map(e => e.title).join(', '));
    }

    // Step 2: Remove events that have been inactive for 30+ days
    const eventsToDelete = await db
      .select({ id: events.id, title: events.title })
      .from(events)
      .where(
        and(
          eq(events.status, 'inactive'),
          lt(events.updatedAt, thirtyDaysAgo)
        )
      );

    if (eventsToDelete.length > 0) {
      // Delete related records first (event_participants, etc.)
      await db.execute(sql`
        DELETE FROM event_participants 
        WHERE event_id IN (${sql.join(eventsToDelete.map(e => sql`${e.id}`), sql`, `)})
      `);
      
      await db.execute(sql`
        DELETE FROM event_tickets 
        WHERE event_id IN (${sql.join(eventsToDelete.map(e => sql`${e.id}`), sql`, `)})
      `);

      // Delete the events
      await db
        .delete(events)
        .where(
          and(
            eq(events.status, 'inactive'),
            lt(events.updatedAt, thirtyDaysAgo)
          )
        );

      console.log(`Removed ${eventsToDelete.length} events inactive for 30+ days:`, 
        eventsToDelete.map(e => e.title).join(', '));
    }

    return {
      markedInactive: expiredEventsResult.length,
      removed: eventsToDelete.length
    };
  } catch (error) {
    console.error('Error managing event lifecycle:', error);
    return {
      markedInactive: 0,
      removed: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Lightweight version that only marks expired events as inactive
 * Use this for frequent calls during API requests
 */
export async function markExpiredEventsInactive() {
  try {
    const now = new Date();
    
    const result = await db
      .update(events)
      .set({ 
        status: 'inactive',
        updatedAt: now
      })
      .where(
        and(
          lt(events.eventDate, now),
          eq(events.status, 'active')
        )
      )
      .returning({ id: events.id });

    return result.length;
  } catch (error) {
    console.error('Error marking expired events inactive:', error);
    return 0;
  }
}