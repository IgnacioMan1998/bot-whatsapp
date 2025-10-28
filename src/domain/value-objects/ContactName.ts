import { DomainError } from '@shared/types';

export class ContactName {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new DomainError('Invalid contact name', 'INVALID_CONTACT_NAME');
    }
    this._value = value.trim();
  }

  get value(): string {
    return this._value;
  }

  private isValid(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }
    
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return false;
    }
    
    // Name should be between 1 and 100 characters
    if (trimmed.length > 100) {
      return false;
    }
    
    // Basic name validation - allow letters, spaces, hyphens, apostrophes
    const nameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\-'\.]+$/;
    return nameRegex.test(trimmed);
  }

  equals(other: ContactName): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  static fromString(value: string): ContactName {
    return new ContactName(value);
  }
}