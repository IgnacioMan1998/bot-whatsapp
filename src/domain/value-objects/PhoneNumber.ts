import { DomainError } from '@shared/types';

export class PhoneNumber {
  private readonly _value: string;

  constructor(value: string) {
    const normalized = this.normalize(value);
    if (!this.isValid(normalized)) {
      throw new DomainError('Invalid phone number format', 'INVALID_PHONE_NUMBER');
    }
    this._value = normalized;
  }

  get value(): string {
    return this._value;
  }

  private normalize(value: string): string {
    // Remove all non-digit characters except +
    let normalized = value.replace(/[^\d+]/g, '');
    
    // If it starts with +, keep it, otherwise add country code if needed
    if (!normalized.startsWith('+')) {
      // Assume it's a local number and needs country code
      // This is a simplified approach - in real world you'd need proper country detection
      normalized = '+' + normalized;
    }
    
    return normalized;
  }

  private isValid(value: string): boolean {
    // Basic international phone number validation
    // Should start with + followed by 7-15 digits
    const phoneRegex = /^\+\d{7,15}$/;
    return phoneRegex.test(value);
  }

  equals(other: PhoneNumber): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  toDisplayFormat(): string {
    // Simple display format - can be enhanced
    return this._value;
  }

  static fromString(value: string): PhoneNumber {
    return new PhoneNumber(value);
  }
}