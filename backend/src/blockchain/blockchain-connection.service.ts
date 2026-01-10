// src/blockchain/blockchain-connection.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { GearApi } from '@gear-js/api';
import { ConfigService } from '@nestjs/config';
import { Keyring } from '@polkadot/keyring';
import { GearKeyring } from '@gear-js/api';
import { SailsProgram } from './lib'; 

@Injectable()
export class BlockchainConnectionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BlockchainConnectionService.name);
  private gearApi: GearApi | null = null;
  private keyring: Keyring | null = null;
  private account: any = null;
  private sailsProgram: SailsProgram | null = null;
  private unsubNewBlocks: (() => void) | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const providerAddress = this.configService.get<string>('BLOCKCHAIN_PROVIDER') || 'wss://testnet.vara.network';
      
      this.logger.log(`Connecting to blockchain: ${providerAddress}`);
      
      // 1. Conectar a GearApi
      this.gearApi = await GearApi.create({
        providerAddress,
      });

      const [chain, nodeName, nodeVersion] = await Promise.all([
        this.gearApi.chain(),
        this.gearApi.nodeName(),
        this.gearApi.nodeVersion(),
      ]);

      this.logger.log(`Connected to chain ${chain} using ${nodeName} v${nodeVersion}`);
      
      // 2. Configurar cuenta
      this.keyring = new Keyring({ type: 'sr25519' });
      const seed = this.configService.get<string>('ACCOUNT_SEED');
      if (!seed) {
        throw new Error('ACCOUNT_SEED is not set');
      }
      this.account = this.keyring.addFromMnemonic(seed);
      this.logger.log(`Using account: ${this.account.address}`);
      
      // 3. Inicializar SailsProgram con tu contrato
      const programId = this.configService.get<`0x${string}`>('CONTRACT_ADDRESS');
      if (programId) {
        this.sailsProgram = new SailsProgram(this.gearApi, programId);
        this.logger.log(`SailsProgram initialized with contract: ${programId}`);
      } else {
        this.logger.warn('CONTRACT_ADDRESS not set, SailsProgram will be initialized without program ID');
        this.sailsProgram = new SailsProgram(this.gearApi);
      }

      this.logger.log('Blockchain connection established successfully');
      
    } catch (error) {
      this.logger.error('Failed to connect to blockchain:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.unsubNewBlocks) {
        this.unsubNewBlocks();
        this.logger.log('Unsubscribed from new blocks');
      }

      if (this.gearApi) {
        await this.gearApi.disconnect();
        this.logger.log('Disconnected from blockchain');
      }
    } catch (error) {
      this.logger.error('Error disconnecting from blockchain:', error);
    }
  }

  // ========== MÉTODOS PÚBLICOS ==========

  getApi(): GearApi {
    if (!this.gearApi) {
      throw new Error('Blockchain API is not initialized. Make sure the module has been initialized.');
    }
    return this.gearApi;
  }

  getSailsProgram(): SailsProgram {
    if (!this.sailsProgram) {
      throw new Error('SailsProgram is not initialized. Make sure the module has been initialized.');
    }
    return this.sailsProgram;
  }

  getAccount(): any {
    if (!this.account) {
      throw new Error('Account is not initialized. Make sure the module has been initialized.');
    }
    return this.account;
  }

  isConnected(): boolean {
    return this.gearApi !== null;
  }

  // Helper para convertir direcciones
  hexToActorId(hexAddress: string): Uint8Array {
    return this.keyring?.decodeAddress(hexAddress) || new Uint8Array();
  }

  // Obtener balance de cuenta
  async getBalance(address?: string): Promise<string> {
    if (!this.gearApi) throw new Error('API not connected');
    const addr = address || this.account.address;
    const balance = await this.gearApi.balance.find(addr);
    return balance.toString();
  }
}