export interface TimerDto {
  id: string;
  contactId: string;
  messageId: string;
  expiresAt: Date;
  createdAt: Date;
  isActive: boolean;
  remainingSeconds: number;
}

export interface CreateTimerDto {
  contactId: string;
  messageId: string;
  delayInSeconds: number;
}

export interface TimerStatsDto {
  totalActive: number;
  totalExpired: number;
  averageResponseTime: number;
}