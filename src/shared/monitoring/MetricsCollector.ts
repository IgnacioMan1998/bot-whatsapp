import { injectable, inject } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';

export interface Metrics {
  // System metrics
  uptime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };

  // Application metrics
  totalMessages: number;
  messagesPerMinute: number;
  totalContacts: number;
  activeTimers: number;
  
  // Performance metrics
  averageResponseTime: number;
  errorRate: number;
  
  // WhatsApp metrics
  whatsappStatus: 'connected' | 'disconnected' | 'connecting';
  qrCodeGenerations: number;
  reconnections: number;
}

@injectable()
export class MetricsCollector {
  private metrics: Partial<Metrics> = {};
  private messageCount: number = 0;
  private errorCount: number = 0;
  private totalRequests: number = 0;
  private responseTimeSum: number = 0;
  private lastMinuteMessages: number[] = [];
  private qrGenerations: number = 0;
  private reconnectionCount: number = 0;

  constructor(
    @inject(TYPES.Logger) private logger: Logger
  ) {
    this.initializeMetrics();
    this.startPeriodicCollection();
  }

  private initializeMetrics(): void {
    this.metrics = {
      uptime: 0,
      memoryUsage: { used: 0, total: 0, percentage: 0 },
      cpuUsage: { user: 0, system: 0 },
      totalMessages: 0,
      messagesPerMinute: 0,
      totalContacts: 0,
      activeTimers: 0,
      averageResponseTime: 0,
      errorRate: 0,
      whatsappStatus: 'disconnected',
      qrCodeGenerations: 0,
      reconnections: 0,
    };
  }

  private startPeriodicCollection(): void {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Clean up old message counts every minute
    setInterval(() => {
      this.cleanupMessageCounts();
    }, 60000);
  }

  private collectSystemMetrics(): void {
    // System uptime
    this.metrics.uptime = process.uptime();

    // Memory usage
    const memUsage = process.memoryUsage();
    this.metrics.memoryUsage = {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
    };

    // CPU usage
    const cpuUsage = process.cpuUsage();
    this.metrics.cpuUsage = {
      user: cpuUsage.user,
      system: cpuUsage.system,
    };

    // Calculate error rate
    this.metrics.errorRate = this.totalRequests > 0 
      ? (this.errorCount / this.totalRequests) * 100 
      : 0;

    // Calculate average response time
    this.metrics.averageResponseTime = this.totalRequests > 0 
      ? this.responseTimeSum / this.totalRequests 
      : 0;

    // Messages per minute
    this.metrics.messagesPerMinute = this.lastMinuteMessages.reduce((sum, count) => sum + count, 0);

    // Update counters
    this.metrics.qrCodeGenerations = this.qrGenerations;
    this.metrics.reconnections = this.reconnectionCount;
  }

  private cleanupMessageCounts(): void {
    // Keep only the last 60 seconds of message counts
    if (this.lastMinuteMessages.length >= 60) {
      this.lastMinuteMessages.shift();
    }
    this.lastMinuteMessages.push(0); // Add new slot for current second
  }

  // Public methods for updating metrics
  public recordMessage(): void {
    this.messageCount++;
    this.metrics.totalMessages = this.messageCount;
    
    // Increment current second's message count
    if (this.lastMinuteMessages.length > 0) {
      this.lastMinuteMessages[this.lastMinuteMessages.length - 1]++;
    }
  }

  public recordError(): void {
    this.errorCount++;
  }

  public recordRequest(responseTime: number): void {
    this.totalRequests++;
    this.responseTimeSum += responseTime;
  }

  public recordQRGeneration(): void {
    this.qrGenerations++;
  }

  public recordReconnection(): void {
    this.reconnectionCount++;
  }

  public updateWhatsAppStatus(status: 'connected' | 'disconnected' | 'connecting'): void {
    this.metrics.whatsappStatus = status;
  }

  public updateContactCount(count: number): void {
    this.metrics.totalContacts = count;
  }

  public updateActiveTimers(count: number): void {
    this.metrics.activeTimers = count;
  }

  public getMetrics(): Metrics {
    this.collectSystemMetrics(); // Get fresh system metrics
    return { ...this.metrics } as Metrics;
  }

  public getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    issues: string[];
  } {
    const checks = {
      memoryUsage: this.metrics.memoryUsage!.percentage < 90,
      errorRate: this.metrics.errorRate! < 5,
      whatsappConnected: this.metrics.whatsappStatus === 'connected',
      uptime: this.metrics.uptime! > 60, // At least 1 minute uptime
    };

    const issues: string[] = [];
    
    if (!checks.memoryUsage) {
      issues.push(`High memory usage: ${this.metrics.memoryUsage!.percentage.toFixed(1)}%`);
    }
    
    if (!checks.errorRate) {
      issues.push(`High error rate: ${this.metrics.errorRate!.toFixed(1)}%`);
    }
    
    if (!checks.whatsappConnected) {
      issues.push(`WhatsApp not connected: ${this.metrics.whatsappStatus}`);
    }

    const healthyChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.values(checks).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyChecks === totalChecks) {
      status = 'healthy';
    } else if (healthyChecks >= totalChecks * 0.7) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return { status, checks, issues };
  }

  public reset(): void {
    this.messageCount = 0;
    this.errorCount = 0;
    this.totalRequests = 0;
    this.responseTimeSum = 0;
    this.lastMinuteMessages = [];
    this.qrGenerations = 0;
    this.reconnectionCount = 0;
    this.initializeMetrics();
  }
}