import { TimerId, ContactId, MessageId } from '@domain/value-objects';

export interface TimerProps {
  id: TimerId;
  contactId: ContactId;
  messageId: MessageId;
  expiresAt: Date;
  createdAt?: Date;
}

export class Timer {
  private readonly _id: TimerId;
  private readonly _contactId: ContactId;
  private readonly _messageId: MessageId;
  private readonly _expiresAt: Date;
  private readonly _createdAt: Date;
  private _isCancelled: boolean;

  constructor(props: TimerProps) {
    this._id = props.id;
    this._contactId = props.contactId;
    this._messageId = props.messageId;
    this._expiresAt = new Date(props.expiresAt);
    this._createdAt = props.createdAt || new Date();
    this._isCancelled = false;
  }

  get id(): TimerId {
    return this._id;
  }

  get contactId(): ContactId {
    return this._contactId;
  }

  get messageId(): MessageId {
    return this._messageId;
  }

  get expiresAt(): Date {
    return new Date(this._expiresAt);
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get isCancelled(): boolean {
    return this._isCancelled;
  }

  // Business logic methods
  isExpired(currentTime?: Date): boolean {
    const now = currentTime || new Date();
    return now >= this._expiresAt && !this._isCancelled;
  }

  isActive(currentTime?: Date): boolean {
    return !this.isExpired(currentTime) && !this._isCancelled;
  }

  getRemainingTime(currentTime?: Date): number {
    const now = currentTime || new Date();
    if (this._isCancelled || now >= this._expiresAt) {
      return 0;
    }
    return Math.max(0, this._expiresAt.getTime() - now.getTime());
  }

  getRemainingSeconds(currentTime?: Date): number {
    return Math.ceil(this.getRemainingTime(currentTime) / 1000);
  }

  // Mutation methods
  cancel(): Timer {
    const cancelledTimer = new Timer({
      id: this._id,
      contactId: this._contactId,
      messageId: this._messageId,
      expiresAt: this._expiresAt,
      createdAt: this._createdAt,
    });
    cancelledTimer._isCancelled = true;
    return cancelledTimer;
  }

  equals(other: Timer): boolean {
    return this._id.equals(other._id);
  }

  // Factory methods
  static create(
    contactId: ContactId,
    messageId: MessageId,
    delayInSeconds: number
  ): Timer {
    const expiresAt = new Date(Date.now() + delayInSeconds * 1000);
    
    return new Timer({
      id: TimerId.generate(),
      contactId,
      messageId,
      expiresAt,
    });
  }

  static fromExisting(
    id: TimerId,
    contactId: ContactId,
    messageId: MessageId,
    expiresAt: Date,
    createdAt: Date
  ): Timer {
    return new Timer({
      id,
      contactId,
      messageId,
      expiresAt,
      createdAt,
    });
  }

  static createWithExpiration(
    contactId: ContactId,
    messageId: MessageId,
    expiresAt: Date
  ): Timer {
    return new Timer({
      id: TimerId.generate(),
      contactId,
      messageId,
      expiresAt,
    });
  }
}