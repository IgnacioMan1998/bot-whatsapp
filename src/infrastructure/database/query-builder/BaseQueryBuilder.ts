import { QueryBuilder } from '../interfaces/DatabaseAdapter';

export abstract class BaseQueryBuilder implements QueryBuilder {
  protected _table: string = '';
  protected _operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' = 'SELECT';
  protected _columns: string[] = ['*'];
  protected _whereConditions: Array<{ condition: string; value: any }> = [];
  protected _orderByClause: string = '';
  protected _limitClause: number | null = null;
  protected _offsetClause: number | null = null;
  protected _values: Record<string, any> = {};
  protected _setValues: Record<string, any> = {};

  select(table: string): QueryBuilder {
    this._operation = 'SELECT';
    this._table = table;
    return this;
  }

  insert(table: string): QueryBuilder {
    this._operation = 'INSERT';
    this._table = table;
    return this;
  }

  update(table: string): QueryBuilder {
    this._operation = 'UPDATE';
    this._table = table;
    return this;
  }

  delete(table: string): QueryBuilder {
    this._operation = 'DELETE';
    this._table = table;
    return this;
  }

  where(condition: string, value?: any): QueryBuilder {
    this._whereConditions.push({ condition, value });
    return this;
  }

  whereIn(column: string, values: any[]): QueryBuilder {
    const placeholders = values.map(() => '?').join(', ');
    const condition = `${column} IN (${placeholders})`;
    values.forEach(value => {
      this._whereConditions.push({ condition: '', value });
    });
    this._whereConditions.push({ condition, value: null });
    return this;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder {
    this._orderByClause = `ORDER BY ${column} ${direction}`;
    return this;
  }

  limit(count: number): QueryBuilder {
    this._limitClause = count;
    return this;
  }

  offset(count: number): QueryBuilder {
    this._offsetClause = count;
    return this;
  }

  values(data: Record<string, any>): QueryBuilder {
    this._values = data;
    return this;
  }

  set(data: Record<string, any>): QueryBuilder {
    this._setValues = data;
    return this;
  }

  abstract build(): { sql: string; params: any[] };

  protected buildWhereClause(): { clause: string; params: any[] } {
    if (this._whereConditions.length === 0) {
      return { clause: '', params: [] };
    }

    const conditions: string[] = [];
    const params: any[] = [];

    this._whereConditions.forEach(({ condition, value }) => {
      if (condition && !condition.includes('IN (')) {
        conditions.push(condition);
        if (value !== null && value !== undefined) {
          params.push(value);
        }
      } else if (condition.includes('IN (')) {
        conditions.push(condition);
      } else if (value !== null && value !== undefined) {
        params.push(value);
      }
    });

    return {
      clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  protected buildLimitOffset(): string {
    let clause = '';
    if (this._limitClause !== null) {
      clause += ` LIMIT ${this._limitClause}`;
    }
    if (this._offsetClause !== null) {
      clause += ` OFFSET ${this._offsetClause}`;
    }
    return clause;
  }
}