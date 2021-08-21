import Client from '../../database';

export type RF_Token = {
  id: number;
  value: string;
  created_at: string;
  fk_user_id: number;
};

export class rfTokenStore {
  // keep track of refresh tokens
  async addRefreshToken(userId: number, rf: string) {
    try {
      const conn = await Client.connect();
      const sql =
        'INSERT INTO refresh_tokens (fk_user_id, value) VALUES ($1, $2)';
      const result = await conn.query(sql, [userId, rf]);
      conn.release();
      return result.rows[0];
    } catch (err) {
      throw new Error(`create RF err`);
    }
  }

  // for refresh token rotation
  async updateRefreshToken(userId: number, oldRf: string, newRf: string) {
    try {
      const conn = await Client.connect();
      const deleteSQL =
        'DELETE FROM refresh_tokens WHERE value = $1 AND fk_user_id = $2';
      await conn.query(deleteSQL, [oldRf, userId]);
      const newSQL =
        'INSERT INTO refresh_tokens (fk_user_id, value) values ($1, $2)';
      const result = await conn.query(newSQL, [userId, newRf]);
      conn.release();
      return result.rowCount;
    } catch (err) {
      throw new Error(`update RF err`);
    }
  }

  // check that the refresh token exists
  async validateRefreshToken(rf: string): Promise<string> {
    try {
      const conn = await Client.connect();
      const sql =
        'SELECT value, created_at FROM refresh_tokens WHERE value = $1';
      const result = await conn.query(sql, [rf]);
      if (result.rows) {
        // make sure the refresh token is less than 100 days old
        const createdAt = Date.parse(result.rows[0].created_at);
        const clock = new Date();
        const ageLimit = clock.setDate(clock.getDate() - 100);
        if (createdAt > ageLimit) {
          conn.release();
          return result.rows[0].value;
        } else {
          const deleteSQL = 'DELETE FROM refresh_tokens WHERE value = $1';
          await conn.query(deleteSQL, [rf]);
          conn.release();
          throw new Error();
        }
      } else {
        conn.release();
        throw new Error();
      }
    } catch (err) {
      throw new Error('validate RF err');
    }
  }
}
