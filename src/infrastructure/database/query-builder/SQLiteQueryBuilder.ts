import { BaseQueryBuilder } from './BaseQueryBuilder';

export class SQLiteQueryBuilder extends BaseQueryBuilder {
  build(): { sql: string; params: any[] } {
    let sql = '';
    let params: any[] = [];

    switch (this._operation) {
      case 'SELECT':
        sql = `SELECT ${this._columns.join(', ')} FROM ${this._table}`;
        break;

      case 'INSERT':
        const insertColumns = Object.keys(this._values);
        const insertPlaceholders = insertColumns.map(() => '?').join(', ');
        sql = `INSERT INTO ${this._table} (${insertColumns.join(', ')}) VALUES (${insertPlaceholders})`;
        params = Object.values(this._values);
        break;

      case 'UPDATE':
        const setClause = Object.keys(this._setValues)
          .map(key => `${key} = ?`)
          .join(', ');
        sql = `UPDATE ${this._table} SET ${setClause}`;
        params = Object.values(this._setValues);
        break;

      case 'DELETE':
        sql = `DELETE FROM ${this._table}`;
        break;
    }

    // Add WHERE clause
    const whereResult = this.buildWhereClause();
    if (whereResult.clause) {
      sql += ` ${whereResult.clause}`;
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