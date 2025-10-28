import { MessageId, ContactId, MessageContent, MessageTypeVO } from '@domain/value-objects';

export interface MessageProps {
  id: MessageId;
  from: ContactId;
  to: ContactId;
  content: MessageContent;
  timestamp: Date;
  type: MessageTypeVO;
  isGroup?: boolean;
}

export class Message {
  private readonly _id: MessageId;
  private readonly _from: ContactId;
  private readonly _to: ContactId;
  private readonly _content: MessageContent;
  private readonly _timestamp: Date;
  private readonly _type: MessageTypeVO;
  private readonly _isGroup: boolean;

  constructor(props: MessageProps) {
    this._id = props.id;
    this._from = props.from;
    this._to = props.to;
    this._content = props.content;
    this._timestamp = new Date(props.timestamp);
    this._type = props.type;
    this._isGroup = props.isGroup || false;
  }

  get id(): MessageId {
    return this._id;
  }

  get from(): ContactId {
    return this._from;
  }

  get to(): ContactId {
    return this._to;
  }

  get content(): MessageContent {
    return this._content;
  }

  get timestamp(): Date {
    return new Date(this._timestamp);
  }

  get type(): MessageTypeVO {
    return this._type;
  }

  get isGroup(): boolean {
    return this._isGroup;
  }

  // Business logic methods
  isFromUser(userId: ContactId): boolean {
    return this._type.isOutgoing() || this._from.equals(userId);
  }

  isUrgent(): boolean {
    // Business rules for urgent messages
    const urgentKeywords = ['urgente', 'emergency', 'emergencia', 'ayuda', 'help'];
    const content = this._content.value.toLowerCase();
    
    return urgentKeywords.some(keyword => content.includes(keyword));
  }

  requiresAutoResponse(): boolean {
    // Only incoming messages from non-group chats require auto response
    return this._type.isIncoming() && !this._isGroup;
  }

  isOlderThan(minutes: number): boolean {
    const now = new Date();
    const diffInMs = now.getTime() - this._timestamp.getTime();
    const diffInMinutes = diffInMs / (1000 * 60);
    return diffInMinutes > minutes;
  }

  containsKeyword(keyword: string): boolean {
    return this._content.contains(keyword);
  }

  equals(other: Message): boolean {
    return this._id.equals(other._id);
  }

  // Factory methods
  static create(props: Omit<MessageProps, 'id'>): Message {
    return new Message({
      ...props,
      id: MessageId.generate(),
    });
  }

  static fromIncoming(
    from: ContactId,
    to: ContactId,
    content: MessageContent,
    timestamp: Date,
    isGroup = false
  ): Message {
    return Message.create({
      from,
      to,
      content,
      timestamp,
      type: MessageTypeVO.incoming(),
      isGroup,
    });
  }

  static fromOutgoing(
    from: ContactId,
    to: ContactId,
    content: MessageContent,
    timestamp: Date,
    isGroup = false
  ): Message {
    return Message.create({
      from,
      to,
      content,
      timestamp,
      type: MessageTypeVO.outgoing(),
      isGroup,
    });
  }
}