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

  private validateProps(props: ContactConfigurationProps): void {
    if (props.responseDelay < 0 || props.responseDelay > 86400) { // Max 24 hours
      throw new DomainError('Response delay must be between 0 and 86400 seconds', 'INVALID_RESPONSE_DELAY');
    }

    if (props.predefinedMessage && props.predefinedMessage.trim().length > 1000) {
      throw new DomainError('Predefined message cannot exceed 1000 characters', 'INVALID_PREDEFINED_MESSAGE');
    }
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

  hasPredefinedMessage(): boolean {
    return this._predefinedMessage !== undefined && this._predefinedMessage.length > 0;
  }

  shouldAutoRespond(): boolean {
    return this._autoResponseEnabled && !this._isUrgent;
  }

  withResponseDelay(delay: number): ContactConfiguration {
    return new ContactConfiguration({
      responseDelay: delay,
      predefinedMessage: this._predefinedMessage,
      isUrgent: this._isUrgent,
      autoResponseEnabled: this._autoResponseEnabled,
    });
  }

  withPredefinedMessage(message?: string): ContactConfiguration {
    return new ContactConfiguration({
      responseDelay: this._responseDelay,
      predefinedMessage: message,
      isUrgent: this._isUrgent,
      autoResponseEnabled: this._autoResponseEnabled,
    });
  }

  withUrgentStatus(isUrgent: boolean): ContactConfiguration {
    return new ContactConfiguration({
      responseDelay: this._responseDelay,
      predefinedMessage: this._predefinedMessage,
      isUrgent: isUrgent,
      autoResponseEnabled: this._autoResponseEnabled,
    });
  }

  withAutoResponseEnabled(enabled: boolean): ContactConfiguration {
    return new ContactConfiguration({
      responseDelay: this._responseDelay,
      predefinedMessage: this._predefinedMessage,
      isUrgent: this._isUrgent,
      autoResponseEnabled: enabled,
    });
  }

  equals(other: ContactConfiguration): boolean {
    return (
      this._responseDelay === other._responseDelay &&
      this._predefinedMessage === other._predefinedMessage &&
      this._isUrgent === other._isUrgent &&
      this._autoResponseEnabled === other._autoResponseEnabled
    );
  }

  static default(): ContactConfiguration {
    return new ContactConfiguration({
      responseDelay: 60, // 1 minute
      isUrgent: false,
      autoResponseEnabled: true,
    });
  }
}