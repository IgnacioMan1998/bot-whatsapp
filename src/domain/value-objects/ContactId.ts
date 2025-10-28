import { v4 as uuidv4 } from 'uuid';
import { DomainError } from '@shared/types';

export class ContactId {
  private readonly _value: string;

  constructor(value?: string) {
    if (value && !this.isValid(value)) {
      throw new DomainError('Invalid ContactId format', 'INVALID_CONTACT_ID');
    }
    this._value = value || uuidv4();
  }

  get value(): string {
    return this._value;
  }

  private isValid(value: string): boolean {
    // UUID v4 validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  equals(other: ContactId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  static generate(): ContactId {
    return new ContactId();
  }

  static fromString(value: string): ContactId {
    return new ContactId(value);
  }
}