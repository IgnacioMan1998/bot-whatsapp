export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  insertId?: string | number;
}

export interface QueryBuilder {
  select(table: string): QueryBuilder;
  insert(table: string): QueryBuilder;
  update(table: string): QueryBuilder;
  delete(table: string): QueryBuilder;
  where(condition: string, value?: any): QueryBuilder;
  whereIn(column: string, values: any[]): QueryBuilder;
  orderBy(column: string, direction?: 'ASC' | 'DESC'): QueryBuilder;
  limit(count: number): QueryBuilder;
  offset(count: number): QueryBuilder;
  values(data: Record<string, any>): QueryBuilder;
  set(data: Record<string, any>): QueryBuilder;
  build(): { sql: string; params: any[] };
}

export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T>(sql: string, params?: any[]): Promise<QueryResult<T>>;
  queryOne<T>(sql: string, params?: any[]): Promise<T | null>;
  execute(sql: string, params?: any[]): Promise<{ affectedRows: number; insertId?: any }>;
  transaction<T>(operation: (adapter: DatabaseAdapter) => Promise<T>): Promise<T>;
  createQueryBuilder(): QueryBuilder;
  migrate(): Promise<void>;
  healthCheck(): Promise<boolean>;
}