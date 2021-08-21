import Client from '../database';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const pepper = process.env.BCRYPT_PASSWORD;
const saltRounds = process.env.SALT_ROUNDS as string;

export type User = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  password_digest: string;
  role: string;
};

// users with no id yet
export type General_User = {
  first_name: string;
  last_name: string;
  username: string;
  password: string;
  role?: string;
};

export class userStore {
  async index(): Promise<User[]> {
    try {
      const conn = await Client.connect();
      const sql = `SELECT * FROM users`;
      const result = await conn.query(sql);
      conn.release();
      return result.rows;
    } catch (err) {
      throw new Error(`Could not get all users. Error: ${err}`);
    }
  }

  async show(username: string, user_id?: number): Promise<User> {
    try {
      const conn = await Client.connect();
      let sql;
      let result;
      if (user_id) {
        sql = `SELECT * FROM users WHERE user_id = $1`;
        result = await conn.query(sql, [user_id]);
      } else {
        sql = `SELECT * FROM users WHERE username = $1`;
        result = await conn.query(sql, [username]);
      }
      conn.release();
      return result.rows[0];
    } catch (err) {
      throw new Error(
        `Could not find user with username ${username}. Error: ${err}`
      );
    }
  }

  async create(u: General_User, admin?: boolean): Promise<number> {
    try {
      const conn = await Client.connect();
      const sql = `INSERT INTO users (first_name, last_name, username, password_digest, role) VALUES ($1, $2, $3, $4, $5)`;
      const hash = bcrypt.hashSync(u.password + pepper, parseInt(saltRounds));
      let result;
      if (admin) {
        result = await conn.query(sql, [
          u.first_name,
          u.last_name,
          u.username,
          hash,
          'admin'
        ]);
      } else {
        result = await conn.query(sql, [
          u.first_name,
          u.last_name,
          u.username,
          hash,
          'user'
        ]);
      }
      conn.release();
      return result.rowCount;
    } catch (err) {
      throw new Error(`Could not create user. Error: ${err}`);
    }
  }

  // if return is null that means username was not found or password doesn't match
  async authenticate(username: string, password: string): Promise<User | null> {
    try {
      const conn = await Client.connect();
      const sql = `SELECT * FROM users WHERE username = $1`;
      const result = await conn.query(sql, [username]);
      conn.release();
      if (result.rows.length) {
        const user = result.rows[0];
        if (bcrypt.compareSync(password + pepper, user.password_digest)) {
          return user;
        } else return null;
      } else {
        return null;
      }
    } catch (err) {
      throw new Error(`Could not authenticate. Error: ${err}`);
    }
  }

  // only the authenticated user
  async update(
    newDetails: General_User,
    oldPass: string,
    oldUsername: string
  ): Promise<User> {
    try {
      const conn = await Client.connect();
      // compare current password_digest with oldPass
      const getSQL = 'SELECT password_digest FROM users WHERE username = $1';
      const getResult = await conn.query(getSQL, [oldUsername]);
      const result = getResult.rows[0];
      // oldPass is valid
      if (bcrypt.compareSync(oldPass + pepper, result.password_digest)) {
        // update user only if their username and password in db match the old username and hash
        const sql = `UPDATE users SET first_name = $1, last_name = $2, username = $3, password_digest = $4 WHERE username = $5`;
        const newPass = bcrypt.hashSync(
          newDetails.password + pepper,
          parseInt(saltRounds)
        );
        await conn.query(sql, [
          newDetails.first_name,
          newDetails.last_name,
          newDetails.username,
          newPass,
          oldUsername
        ]);
        conn.release();
        return result.rowCount;
      } else {
        conn.release();
        throw new Error('Old password does not match');
      }
    } catch (err) {
      throw new Error(`Could not update user. Error: ${err}`);
    }
  }

  // only the authenticated user
  async delete(username: string, password: string): Promise<number> {
    try {
      const conn = await Client.connect();
      const sql = `SELECT * FROM users WHERE username = $1`;
      const result = await conn.query(sql, [username]);
      if (result.rows.length) {
        const user = result.rows[0];
        if (bcrypt.compareSync(password + pepper, user.password_digest)) {
          const sql = `DELETE FROM users WHERE username = $1`;
          const result = await conn.query(sql, [username]);
          conn.release();
          return result.rowCount;
        } else {
          conn.release();
          throw new Error('Password/username combination is incorrect');
        }
      } else {
        conn.release();
        throw new Error('There are no users with the provided username');
      }
    } catch (err) {
      throw new Error(`Could not delete user. Error: ${err}`);
    }
  }
}
