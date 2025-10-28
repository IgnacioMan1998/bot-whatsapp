import { DatabaseAdapter } from './interfaces/DatabaseAdapter';
import { SQLiteDatabaseAdapter } from './adapters/SQLiteDatabaseAdapter';
import { PostgreSQLDatabaseAdapter, PostgreSQLConfig } from './adapters/PostgreSQLDatabaseAdapter';
import { DatabaseConfig } from '@shared/types';
import { InfrastructureError } from '@shared/types';

export class DatabaseFactory {
  static create(config: DatabaseConfig): DatabaseAdapter {
    switch (config.type) {
      case 'sqlite':
        if (!config.sqlite) {
          throw new InfrastructureError('SQLite configuration is required when type is sqlite');
        }
        return new SQLiteDatabaseAdapter(config.sqlite.path);

      case 'postgresql':
        if (!config.postgresql) {
          throw new InfrastructureError('PostgreSQL configuration is required when type is postgresql');
        }
        
        const pgConfig: PostgreSQLConfig = {
          host: config.postgresql.host,
          port: config.postgresql.port,
          database: config.postgresql.database,
          username: config.postgresql.username,
          password: config.postgresql.password,
          ssl: config.postgresql.ssl,
          poolSize: config.postgresql.poolSize,
          connectionTimeout: config.postgresql.connectionTimeout,
        };
        
        return new PostgreSQLDatabaseAdapter(pgConfig);

      default:
        throw new InfrastructureError(`Unsupported database type: ${config.type}`);
    }
  }

  static async createAndConnect(config: DatabaseConfig): Promise<DatabaseAdapter> {
    const adapter = DatabaseFactory.create(config);
    await adapter.connect();
    return adapter;
  }

  static async createConnectAndMigrate(config: DatabaseConfig): Promise<DatabaseAdapter> {
    const adapter = await DatabaseFactory.createAndConnect(config);
    await adapter.migrate();
    return adapter;
  }
}