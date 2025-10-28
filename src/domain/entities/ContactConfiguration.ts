import { DomainError } from '@shared/types';

export interface ContactConfigurationProps {
  responseDelay: number;
  predefinedMessage?: string;
  isUrgent: boolean;
  autoResponseEnabled: boolean;
}

export class ContactConfiguration {
  private readonly _responseDelay: number;
  private readonly _predefinedMessage?: string;
  private readonly _isUrgent: boolean;
  private readonly _autoResponseEnabled: boolean;

  constructor(props: ContactConfigurationProps) {
    this.validateProps(props);
    
    this._responseDelay = props.responseDelay;
    this._predefinedMessage = props.predefinedMessage?.trim();
    this._isUrgent = props.isUrgent;
    this._autoResponseEnabled = props.autoResponseEnabled;
  }

  get responseDelay(): number {
    return this._responseDelay;
  }

  get predefinedMessage(): string | undefined {
    return this._predefinedMessage;
  }

  get isUrgent(): boolean {
    return this._isUrgent;
  }

  get autoResponseEnabled(): boolean {
    return this._autoResponseEnabled;
  }

  private validateProps(props: ContactConfigurationProps): void {
    if (props.responseDelay < 0) {
      throw new DomainError('Response delay cannot be negative');
    }

    if (props.responseDelay > 86400) { // 24 hours in seconds
      throw new DomainError('Response delay cannot exceed 24 hours');
    }

    if (props.predefinedMessage && props.predefinedMessage.trim().length > 1000) {
      throw new DomainError('Predefined message cannot exceed 1000 characters');
    }
  }

  updateResponseDelay(delay: number): ContactConfiguration {
    return new ContactConfiguration({
      responseDelay: delay,
      predefinedMessage: this._predefinedMessage,
      isUrgent: this._isUrgent,
      autoResponseEnabled: this._autoResponseEnabled,
    });
  }

  updatePredefinedMessage(message?: string): ContactConfiguration {
    return new ContactConfiguration({
      responseDelay: this._responseDelay,
      predefinedMessage: message,
      isUrgent: this._isUrgent,
      autoResponseEnabled: this._autoResponseEnabled,
    });
  }

  markAsUrgent(urgent: boolean): ContactConfiguration {
    return new ContactConfiguration({
      responseDelay: this._responseDelay,
      predefinedMessage: this._predefinedMessage,
      isUrgent: urgent,
      autoResponseEnabled: this._autoResponseEnabled,
    });
  }

  enableAutoResponse(enabled: boolean): ContactConfiguration {
    return new ContactConfiguration({
      responseDelay: this._responseDelay,
      predefinedMessage: this._predefinedMessage,
      isUrgent: this._isUrgent,
      autoResponseEnabled: enabled,
    });
  }

  static createDefault(): ContactConfiguration {
    return new ContactConfiguration({
      responseDelay: 60, // 1 minute
      isUrgent: false,
      autoResponseEnabled: true,
    });
  }
}