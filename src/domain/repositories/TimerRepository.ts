import { Timer } from '@domain/entities';
import { TimerId, ContactId, MessageId } from '@domain/value-objects';

export interface TimerRepository {
  /**
   * Save a timer to the repository
   */
  save(timer: Timer): Promise<void>;

  /**
   * Find a timer by its ID
   */
  findById(id: TimerId): Promise<Timer | null>;

  /**
   * Find active timer for a contact
   */
  findByContact(contactId: ContactId): Promise<Timer | null>;

  /**
   * Find timer by message ID
   */
  findByMessage(messageId: MessageId): Promise<Timer | null>;

  /**
   * Find all expired timers
   */
  findExpired(currentTime?: Date): Promise<Timer[]>;

  /**
   * Find all active timers (not expired and not cancelled)
   */
  findActive(currentTime?: Date): Promise<Timer[]>;

  /**
   * Find timers expiring within specified minutes
   */
  findExpiringWithin(minutes: number, currentTime?: Date): Promise<Timer[]>;

  /**
   * Delete a timer by ID
   */
  delete(timerId: TimerId): Promise<void>;

  /**
   * Delete timer by contact ID
   */
  deleteByContact(contactId: ContactId): Promise<void>;

  /**
   * Delete timer by message ID
   */
  deleteByMessage(messageId: MessageId): Promise<void>;

  /**
   * Delete all expired timers
   */
  deleteExpired(currentTime?: Date): Promise<number>;

  /**
   * Cancel timer for a contact (mark as cancelled)
   */
  cancelByContact(contactId: ContactId): Promise<void>;

  /**
   * Cancel timer by message ID
   */
  cancelByMessage(messageId: MessageId): Promise<void>;

  /**
   * Count active timers
   */
  countActive(currentTime?: Date): Promise<number>;

  /**
   * Count expired timers
   */
  countExpired(currentTime?: Date): Promise<number>;

  /**
   * Find timers for multiple contacts
   */
  findByContacts(contactIds: ContactId[]): Promise<Timer[]>;

  /**
   * Check if a timer exists for a contact
   */
  existsByContact(contactId: ContactId): Promise<boolean>;

  /**
   * Get timer statistics
   */
  getTimerStats(): Promise<{
    totalActive: number;
    totalExpired: number;
    averageResponseTime: number;
  }>;
}