import Client from '../../database';
import { Order } from '../../models/order';
import { Product } from '../../models/product';

// only authenticated admins can use these methods
export class dashboardStore {
  // get all products purchased by a user
  async getProductsOfUser(userId: number): Promise<{name: string}[]> {
    try {
      const conn = await Client.connect();
      const sql = `SELECT name FROM products AS p JOIN order_products AS op ON op.fk_prod_id = p.id JOIN orders AS o ON op.fk_order_id = o.id WHERE o.fk_user_id = $1 and o.status =  $2`;
      const result = await conn.query(sql, [userId, 'fulfilled']);
      conn.release();
      return result.rows;
    } catch (err) {
      throw new Error(
        `Could not get products purchased by user with id ${userId}. Error: ${err}`
      );
    }
  }

  async getMostPopular(limit: number): Promise<Product[]> {
    try {
      const conn = await Client.connect();
      const sql = 'SELECT * FROM products ORDER BY popularity DESC LIMIT $1';
      const result = await conn.query(sql, [limit]);
      conn.release();
      return result.rows;
    } catch (err) {
      throw new Error(`Could not get the ${limit} most popular products`);
    }
  }

  async getRecentOrders(backdays: number): Promise<Order[]> {
    try {
      const conn = await Client.connect();
      const sql =
        "SELECT * FROM orders WHERE status = 'fulfilled'";
      const result = await conn.query(sql);
      conn.release();
      return result.rows;
    } catch (err) {
      console.log(err)
      throw new Error(`Could not get orders as of ${backdays} days ago`);
    }
  }
}
