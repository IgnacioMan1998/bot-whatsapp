import { Contact } from '@domain/entities';
import { ContactId, PhoneNumber } from '@domain/value-objects';

export interface ContactSearchCriteria {
  name?: string;
  isUrgent?: boolean;
  autoResponseEnabled?: boolean;
  hasResponseDelay?: boolean;
  hasPredefinedMessage?: boolean;
}

export interface ContactRepository {
  /**
   * Save a contact to the repository
   */
  save(contact: Contact): Promise<void>;

  /**
   * Find a contact by its ID
   */
  findById(id: ContactId): Promise<Contact | null>;

  /**
   * Find a contact by phone number
   */
  findByPhoneNumber(phoneNumber: PhoneNumber): Promise<Contact | null>;

  /**
   * Find all contacts
   */
  findAll(): Promise<Contact[]>;

  /**
   * Find contacts by search criteria
   */
  findByCriteria(criteria: ContactSearchCriteria, limit?: number, offset?: number): Promise<Contact[]>;

  /**
   * Find contacts by name (partial match)
   */
  findByName(name: string): Promise<Contact[]>;

  /**
   * Find urgent contacts
   */
  findUrgentContacts(): Promise<Contact[]>;

  /**
   * Find contacts with auto-response enabled
   */
  findAutoResponseEnabled(): Promise<Contact[]>;

  /**
   * Find contacts with predefined messages
   */
  findWithPredefinedMessages(): Promise<Contact[]>;

  /**
   * Delete a contact by ID
   */
  delete(id: ContactId): Promise<void>;

  /**
   * Check if a contact exists by phone number
   */
  existsByPhoneNumber(phoneNumber: PhoneNumber): Promise<boolean>;

  /**
   * Count total contacts
   */
  count(): Promise<number>;

  /**
   * Count contacts by criteria
   */
  countByCriteria(criteria: ContactSearchCriteria): Promise<number>;

  /**
   * Update contact configuration
   */
  updateConfiguration(id: ContactId, contact: Contact): Promise<void>;

  /**
   * Get contacts with recent activity (based on message history)
   */
  findRecentlyActive(days: number, limit?: number): Promise<Contact[]>;
}