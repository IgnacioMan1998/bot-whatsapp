export enum MessageType {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing'
}

export class MessageTypeVO {
  private readonly _value: MessageType;

  constructor(value: MessageType | string) {
    if (typeof value === 'string') {
      if (!Object.values(MessageType).includes(value as MessageType)) {
        throw new Error('Invalid message type');
      }
      this._value = value as MessageType;
    } else {
      this._value = value;
    }
  }

  get value(): MessageType {
    return this._value;
  }

  isIncoming(): boolean {
    return this._value === MessageType.INCOMING;
  }

  isOutgoing(): boolean {
    return this._value === MessageType.OUTGOING;
  }

  equals(other: MessageTypeVO): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  static incoming(): MessageTypeVO {
    return new MessageTypeVO(MessageType.INCOMING);
  }

  static outgoing(): MessageTypeVO {
    return new MessageTypeVO(MessageType.OUTGOING);
  }
}