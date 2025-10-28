import { DomainError } from '@shared/types';

export class MessageContent {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new DomainError('Invalid message content', 'INVALID_MESSAGE_CONTENT');
    }
    this._value = value.trim();
  }

  get value(): string {
    return this._value;
  }

  private isValid(value: string): boolean {
    // Message content validation
    if (!value || typeof value !== 'string') {
      return false;
    }
    
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return false;
    }
    
    // Maximum message length (WhatsApp limit is around 65536 characters)
    if (trimmed.length > 65536) {
      return false;
    }
    
    return true;
  }

  isEmpty(): boolean {
    return this._value.length === 0;
  }

  length(): number {
    return this._value.length;
  }

  contains(text: string): boolean {
    return this._value.toLowerCase().includes(text.toLowerCase());
  }

  equals(other: MessageContent): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  static fromString(value: string): MessageContent {
    return new MessageContent(value);
  }
}