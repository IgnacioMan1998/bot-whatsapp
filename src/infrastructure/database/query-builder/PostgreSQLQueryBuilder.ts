import { BaseQueryBuilder } from './BaseQueryBuilder';

export class PostgreSQLQueryBuilder extends BaseQueryBuilder {
  build(): { sql: string; params: any[] } {
    let sql = '';
    let params: any[] = [];

    switch (this._operation) {
      case 'SELECT':
        sql = `SELECT ${this._columns.join(', ')} FROM ${this._table}`;
        break;

      case 'INSERT':
        const insertColumns = Object.keys(this._values);
        const insertPlaceholders = insertColumns.map((_, index) => `$${index + 1}`).join(', ');
        sql = `INSERT INTO ${this._table} (${insertColumns.join(', ')}) VALUES (${insertPlaceholders}) RETURNING id`;
        params = Object.values(this._values);
        break;

      case 'UPDATE':
        const setClause = Object.keys(this._setValues)
          .map((key, index) => `${key} = $${index + 1}`)
          .join(', ');
        sql = `UPDATE ${this._table} SET ${setClause}`;
        params = Object.values(this._setValues);
        break;

      case 'DELETE':
        sql = `DELETE FROM ${this._table}`;
        break;
    }

    // Add WHERE clause (adjust parameter indices for PostgreSQL)
    const whereResult = this.buildWhereClause();
    if (whereResult.clause) {
      // Convert ? placeholders to $n format for PostgreSQL
      let whereClause = whereResult.clause;
      let paramIndex = params.length + 1;
      
      whereResult.params.forEach(() => {
        whereClause = whereClause.replace('?', `$${paramIndex}`);
        paramIndex++;
      });
      
      sql += ` ${whereClause}`;
      params.push(...whereResult.params);
    }

    // Add ORDER BY
    if (this._orderByClause) {
      sql += ` ${this._orderByClause}`;
    }

    // Add LIMIT and OFFSET
    sql += this.buildLimitOffset();

    return { sql, params };
  }
}