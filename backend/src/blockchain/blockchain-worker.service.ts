import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockchainSyncService } from './blockchain-sync.service';
import { Queue, Worker } from 'bullmq';

@Injectable()
export class BlockchainWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BlockchainWorkerService.name);
  private syncQueue: Queue;
  private worker: Worker;
  private connection: { host: string; port: number; password?: string };

  constructor(
    private configService: ConfigService,
    private blockchainSyncService: BlockchainSyncService,
  ) {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.connection = this.parseRedisUrl(redisUrl);
    this.syncQueue = new Queue('blockchain-sync', {
      connection: this.connection,
    });
  }

  private parseRedisUrl(url: string): { host: string; port: number; password?: string } {
    try {
      const parsed = new URL(url);
      return {
        host: parsed.hostname || 'localhost',
        port: parsed.port ? parseInt(parsed.port, 10) : 6379,
        ...(parsed.password && { password: parsed.password }),
      };
    } catch {
      return {
        host: 'localhost',
        port: 6379,
      };
    }
  }

  async onModuleInit() {
    this.worker = new Worker(
      'blockchain-sync',
      async (job) => {
        try {
          switch (job.name) {
            case 'sync-event':
              await this.blockchainSyncService.syncEvent(job.data);
              break;
            case 'sync-ticket':
              await this.blockchainSyncService.syncTicket(job.data);
              break;
            case 'sync-resale':
              await this.blockchainSyncService.syncTicketResale(
                job.data.ticketId,
                job.data.seller,
                job.data.buyer,
                job.data.price,
              );
              break;
            default:
              this.logger.warn(`Unknown job type: ${job.name}`);
          }
        } catch (error) {
          this.logger.error(`Error processing job ${job.name}:`, error);
          throw error;
        }
      },
      {
        connection: this.connection,
        concurrency: 5,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed:`, err);
    });

    this.logger.log('Blockchain worker started');
  }

  async addSyncEventJob(eventData: any) {
    await this.syncQueue.add('sync-event', eventData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  async addSyncTicketJob(ticketData: any) {
    await this.syncQueue.add('sync-ticket', ticketData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  async addSyncResaleJob(resaleData: any) {
    await this.syncQueue.add('sync-resale', resaleData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  async onModuleDestroy() {
    await this.worker.close();
    await this.syncQueue.close();
  }
}

