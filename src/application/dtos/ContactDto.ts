export interface ContactDto {
  id: string;
  phoneNumber: string;
  name: string;
  responseDelay: number;
  predefinedMessage?: string;
  isUrgent: boolean;
  autoResponseEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactDto {
  phoneNumber: string;
  name: string;
  responseDelay?: number;
  predefinedMessage?: string;
  isUrgent?: boolean;
  autoResponseEnabled?: boolean;
}

export interface UpdateContactDto {
  name?: string;
  responseDelay?: number;
  predefinedMessage?: string;
  isUrgent?: boolean;
  autoResponseEnabled?: boolean;
}

export interface ContactConfigurationDto {
  responseDelay: number;
  predefinedMessage?: string;
  isUrgent: boolean;
  autoResponseEnabled: boolean;
}