import { ContactId, PhoneNumber, ContactName, ContactConfiguration } from '@domain/value-objects';

export interface ContactProps {
  id: ContactId;
  phoneNumber: PhoneNumber;
  name: ContactName;
  configuration: ContactConfiguration;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Contact {
  private readonly _id: ContactId;
  private readonly _phoneNumber: PhoneNumber;
  private _name: ContactName;
  private _configuration: ContactConfiguration;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: ContactProps) {
    this._id = props.id;
    this._phoneNumber = props.phoneNumber;
    this._name = props.name;
    this._configuration = props.configuration;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  get id(): ContactId {
    return this._id;
  }

  get phoneNumber(): PhoneNumber {
    return this._phoneNumber;
  }

  get name(): ContactName {
    return this._name;
  }

  get configuration(): ContactConfiguration {
    return this._configuration;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  // Business logic methods
  shouldAutoRespond(): boolean {
    return this._configuration.shouldAutoRespond();
  }

  getResponseDelay(): number {
    return this._configuration.responseDelay;
  }

  getPredefinedMessage(): string | null {
    return this._configuration.predefinedMessage || null;
  }

  isUrgent(): boolean {
    return this._configuration.isUrgent;
  }

  isAutoResponseEnabled(): boolean {
    return this._configuration.autoResponseEnabled;
  }

  hasPredefinedMessage(): boolean {
    return this._configuration.hasPredefinedMessage();
  }

  // Mutation methods (return new instances for immutability)
  updateName(name: ContactName): Contact {
    return new Contact({
      id: this._id,
      phoneNumber: this._phoneNumber,
      name: name,
      configuration: this._configuration,
      createdAt: this._createdAt,
      updatedAt: new Date(),
    });
  }

  updateConfiguration(configuration: ContactConfiguration): Contact {
    return new Contact({
      id: this._id,
      phoneNumber: this._phoneNumber,
      name: this._name,
      configuration: configuration,
      createdAt: this._createdAt,
      updatedAt: new Date(),
    });
  }

  setResponseDelay(delayInSeconds: number): Contact {
    const newConfig = this._configuration.withResponseDelay(delayInSeconds);
    return this.updateConfiguration(newConfig);
  }

  setPredefinedMessage(message?: string): Contact {
    const newConfig = this._configuration.withPredefinedMessage(message);
    return this.updateConfiguration(newConfig);
  }

  setUrgentStatus(isUrgent: boolean): Contact {
    const newConfig = this._configuration.withUrgentStatus(isUrgent);
    return this.updateConfiguration(newConfig);
  }

  enableAutoResponse(): Contact {
    const newConfig = this._configuration.withAutoResponseEnabled(true);
    return this.updateConfiguration(newConfig);
  }

  disableAutoResponse(): Contact {
    const newConfig = this._configuration.withAutoResponseEnabled(false);
    return this.updateConfiguration(newConfig);
  }

  equals(other: Contact): boolean {
    return this._id.equals(other._id);
  }

  // Factory methods
  static create(
    phoneNumber: PhoneNumber,
    name: ContactName,
    configuration?: ContactConfiguration
  ): Contact {
    return new Contact({
      id: ContactId.generate(),
      phoneNumber,
      name,
      configuration: configuration || ContactConfiguration.default(),
    });
  }

  static fromExisting(
    id: ContactId,
    phoneNumber: PhoneNumber,
    name: ContactName,
    configuration: ContactConfiguration,
    createdAt: Date,
    updatedAt: Date
  ): Contact {
    return new Contact({
      id,
      phoneNumber,
      name,
      configuration,
      createdAt,
      updatedAt,
    });
  }
}