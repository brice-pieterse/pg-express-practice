import Client from '../database';

type orderStatus = 'open' | 'placed' | 'fulfilled' | 'cancelled';

export type Order = {
  id: number;
  userId: number;
  status: orderStatus;
  totalPrice: number;
  dateFulfilled: string;
};

export type OrderProduct = {
  id: number;
  fk_order_id: number;
  fk_prod_id: number;
  qty: number;
};

export class orderStore {
  async index(): Promise<Order[]> {
    try {
      const conn = await Client.connect();
      const sql = `SELECT * FROM orders`;
      const result = await conn.query(sql);
      conn.release();
      return result.rows;
    } catch (err) {
      throw new Error(`Could not get orders. Error ${err}`);
    }
  }

  async show(
    user_id: number,
    role: string,
    status: orderStatus,
    order_id?: number
  ): Promise<Order> {
    try {
      const conn = await Client.connect();
      let sql;
      let result;
      if (order_id) {
        sql = `SELECT * FROM orders WHERE fk_user_id = $1 and id = $2`;
        result = await conn.query(sql, [user_id, order_id]);
      } else {
        sql = `SELECT * FROM orders WHERE fk_user_id = $1 and status = $2`;
        result = await conn.query(sql, [user_id, status]);
      }
      conn.release();
      const order = result.rows[0];
      if (role === 'admin' || order.fk_user_id === user_id) {
        return order;
      } else {
        throw new Error(`Token bearer does not have access to this order.`);
      }
    } catch (err) {
      throw new Error(`Could not get orders. Error ${err}`);
    }
  }

  // create a starting order for new users, subsequently when orders are "placed"
  async create(userId: number): Promise<number> {
    try {
      const conn = await Client.connect();
      const sql = `INSERT INTO orders (fk_user_id, status, total, date_fulfilled) VALUES ($1, 'open', 0, NULL)`;
      const result = await conn.query(sql, [userId]);
      conn.release();
      return result.rowCount;
    } catch (err) {
      throw new Error(`Could not create a new order. Error: ${err}`);
    }
  }

  async addProduct(
    prodId: number,
    orderId: number,
    qty: number
  ): Promise<number> {
    try {
      const conn = await Client.connect();
      const sql =
        'INSERT INTO order_products (fk_order_id, fk_prod_id, qty) VALUES ($1, $2, $3)';
      const result = await conn.query(sql, [orderId, prodId, qty]);
      conn.release();
      return result.rowCount;
    } catch (err) {
      throw new Error(
        `Could not add product with id ${prodId} to order with id ${orderId}`
      );
    }
  }

  async indexProducts(orderId: number): Promise<OrderProduct[]> {
    try {
      const conn = await Client.connect();
      const sql = 'SELECT * FROM order_products WHERE fk_order_id = $1';
      const result = await conn.query(sql, [orderId]);
      conn.release();
      return result.rows;
    } catch (err) {
      throw new Error(
        `Could not index all products in order with id ${orderId}`
      );
    }
  }

  async verifyOwnership(userId: number, orderId: number): Promise<boolean> {
    try {
      const conn = await Client.connect();
      const sql = 'SELECT fk_user_id FROM orders WHERE id = $1';
      const result = await conn.query(sql, [orderId]);
      const order = result.rows[0];
      conn.release();
      if (order.fk_user_id === userId) {
        return true;
      } else return false;
    } catch (err) {
      return false;
    }
  }

  // updates status of order to "placed"
  async place(total: number, orderId: number, userId: number): Promise<number> {
    try {
      const conn = await Client.connect();
      const sql =
        "UPDATE orders SET status = 'placed', total = $1 WHERE id = $2 AND fk_user_id = $3";
      const result = await conn.query(sql, [total, orderId, userId]);
      conn.release();
      return result.rowCount;
    } catch (err) {
      throw new Error(`Could not place order with id: ${orderId}`);
    }
  }

  // updates status of order to "fulfilled", adds current date to date_fulfilled
  async fulfill(orderId: number): Promise<number> {
    try {
      const conn = await Client.connect();
      const date = new Date();
      const month = date.getUTCMonth() + 1;
      const day = date.getUTCDate();
      const year = date.getUTCFullYear();
      const newDate = year + '/' + month + '/' + day;
      const sql =
        "UPDATE orders SET status = 'fulfilled', date_fulfilled = $1 WHERE id = $2";
      const result = await conn.query(sql, [newDate, orderId]);
      conn.release();
      return result.rowCount;
    } catch (err) {
      throw new Error(`Could not fulfill order with id ${orderId}`);
    }
  }

  async cancel(orderId: number, userId: number): Promise<number> {
    try {
      const conn = await Client.connect();
      const sql =
        "UPDATE orders SET status = 'cancelled' WHERE id = $1 AND fk_user_id = $2";
      const result = await conn.query(sql, [orderId, userId]);
      conn.release();
      return result.rowCount;
    } catch (err) {
      throw new Error(
        `Could not cancel order with id ${orderId}. Error: ${err}`
      );
    }
  }
}
