import { AutoResponseServiceImpl } from '@domain/services/AutoResponseService';
import { Message } from '@domain/entities/Message';
import { Contact } from '@domain/entities/Contact';
import {
  MessageId,
  ContactId,
  MessageContent,
  MessageTypeVO,
  PhoneNumber,
  ContactName,
  ContactConfiguration,
} from '@domain/value-objects';

describe('Group Message Security', () => {
  let autoResponseService: AutoResponseServiceImpl;
  let contact: Contact;

  beforeEach(() => {
    autoResponseService = new AutoResponseServiceImpl();

    // Create a test contact with auto-response enabled
    const phone = PhoneNumber.fromString('+1234567890');
    const name = ContactName.fromString('Test Contact');
    const config = new ContactConfiguration({
      autoResponseEnabled: true,
      responseDelay: 300,
      predefinedMessage: 'Test response',
      isUrgent: false,
    });

    contact = Contact.create(phone, name, config);
  });

  describe('shouldRespond', () => {
    it('should NOT respond to group messages', () => {
      // Create a group message
      const groupMessage = new Message({
        id: MessageId.generate(),
        from: ContactId.fromString('+1234567890'),
        to: ContactId.fromString('+0987654321'),
        content: MessageContent.fromString('Hello from group'),
        timestamp: new Date(),
        type: MessageTypeVO.incoming(),
        isGroup: true, // This is the key - it's a group message
      });

      const shouldRespond = autoResponseService.shouldRespond(groupMessage, contact);

      expect(shouldRespond).toBe(false);
    });

    it('should respond to individual messages', () => {
      // Create an individual message
      const individualMessage = new Message({
        id: MessageId.generate(),
        from: ContactId.fromString('+1234567890'),
        to: ContactId.fromString('+0987654321'),
        content: MessageContent.fromString('Hello individual'),
        timestamp: new Date(),
        type: MessageTypeVO.incoming(),
        isGroup: false, // Individual message
      });

      const shouldRespond = autoResponseService.shouldRespond(individualMessage, contact);

      expect(shouldRespond).toBe(true);
    });

    it('should NOT respond to outgoing messages even if not from group', () => {
      // Create an outgoing message
      const outgoingMessage = new Message({
        id: MessageId.generate(),
        from: ContactId.fromString('+1234567890'),
        to: ContactId.fromString('+0987654321'),
        content: MessageContent.fromString('Hello outgoing'),
        timestamp: new Date(),
        type: MessageTypeVO.outgoing(),
        isGroup: false,
      });

      const shouldRespond = autoResponseService.shouldRespond(outgoingMessage, contact);

      expect(shouldRespond).toBe(false);
    });
  });

  describe('Message entity requiresAutoResponse', () => {
    it('should return false for group messages', () => {
      const groupMessage = new Message({
        id: MessageId.generate(),
        from: ContactId.fromString('+1234567890'),
        to: ContactId.fromString('+0987654321'),
        content: MessageContent.fromString('Group message'),
        timestamp: new Date(),
        type: MessageTypeVO.incoming(),
        isGroup: true,
      });

      expect(groupMessage.requiresAutoResponse()).toBe(false);
    });

    it('should return true for individual incoming messages', () => {
      const individualMessage = new Message({
        id: MessageId.generate(),
        from: ContactId.fromString('+1234567890'),
        to: ContactId.fromString('+0987654321'),
        content: MessageContent.fromString('Individual message'),
        timestamp: new Date(),
        type: MessageTypeVO.incoming(),
        isGroup: false,
      });

      expect(individualMessage.requiresAutoResponse()).toBe(true);
    });
  });

  describe('WhatsApp ID Detection', () => {
    it('should correctly identify group IDs', () => {
      // Group IDs end with @g.us
      const groupId = '1234567890-1234567890@g.us';
      const isGroup = groupId.includes('@g.us');

      expect(isGroup).toBe(true);
    });

    it('should correctly identify individual chat IDs', () => {
      // Individual chat IDs end with @c.us
      const individualId = '1234567890@c.us';
      const isGroup = individualId.includes('@g.us');

      expect(isGroup).toBe(false);
    });
  });
});

describe('Security Logging', () => {
  let consoleSpy: jest.SpyInstance;
  let autoResponseService: AutoResponseServiceImpl;
  let contact: Contact;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    autoResponseService = new AutoResponseServiceImpl();

    const phone = PhoneNumber.fromString('+1234567890');
    const name = ContactName.fromString('Test Contact');
    const config = new ContactConfiguration({
      autoResponseEnabled: true,
      responseDelay: 300,
      predefinedMessage: 'Test response',
      isUrgent: false,
    });

    contact = Contact.create(phone, name, config);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log security events when blocking group messages', () => {
    const groupMessage = new Message({
      id: MessageId.generate(),
      from: ContactId.fromString('+1234567890'),
      to: ContactId.fromString('+0987654321'),
      content: MessageContent.fromString('Group message'),
      timestamp: new Date(),
      type: MessageTypeVO.incoming(),
      isGroup: true,
    });

    autoResponseService.shouldRespond(groupMessage, contact);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[SECURITY] Auto-response blocked for group message')
    );
  });
});
