import Client from '../database';

export type Product = {
  id: number;
  name: string;
  price: number;
  description: string;
  admin_fk: number;
  popularity: number;
};

export type General_Product = {
  name: string;
  price: number;
  description: string;
  admin_fk: number;
};

export class productStore {
  // Get all products
  async index(): Promise<Product[]> {
    try {
      const conn = await Client.connect();
      const sql = 'SELECT * FROM products';
      const result = await conn.query(sql);
      conn.release();
      return result.rows;
    } catch (err) {
      throw new Error(`Could not get products. Error: ${err}`);
    }
  }

  // Get one product
  async show(prodId: number, name?: string): Promise<Product> {
    try {
      const conn = await Client.connect();
      let sql;
      let result;
      if (name) {
        sql = `SELECT * FROM products WHERE name = $1`;
        result = await conn.query(sql, [name]);
      } else {
        sql = `SELECT * FROM products WHERE id = $1`;
        result = await conn.query(sql, [prodId]);
      }
      conn.release();
      return result.rows[0];
    } catch (err) {
      throw new Error(
        `Could not get product with id: ${prodId}. Error: ${err}`
      );
    }
  }

  // only authenticated admins -> -> handler restriction
  async create(
    prodName: string,
    price: number,
    description: string,
    adminId: number
  ): Promise<number> {
    try {
      const conn = await Client.connect();
      const sql = `INSERT INTO products (name, price, description, admin_fk_id, popularity) VALUES ($1, $2, $3, $4, 0)`;
      const result = await conn.query(sql, [
        prodName,
        price,
        description,
        adminId
      ]);
      conn.release();
      return result.rowCount;
    } catch (err) {
      throw new Error(`Could not create a new product. Error: ${err}`);
    }
  }

  // only authenticated admins owner of the product -> -> handler restriction
  async update(
    prodId: number,
    prodName: string,
    price: number,
    description: string,
    adminId: number
  ): Promise<Product> {
    try {
      const conn = await Client.connect();
      const sql = `UPDATE products SET name = $1, price = $2, description = $3 WHERE id = ${prodId} AND admin_fk = ${adminId}`;
      const result = await conn.query(sql, [prodName, price, description]);
      conn.release();
      return result.rows[0];
    } catch (err) {
      throw new Error(
        `Could not update product with id ${prodId}. Error: ${err}`
      );
    }
  }

  async tallyPurchase(prodId: number): Promise<Product> {
    try {
      const conn = await Client.connect();
      const sql =
        'UPDATE products SET popularity = popularity + $1 WHERE id = $2';
      const result = await conn.query(sql, [1, prodId]);
      conn.release();
      return result.rows[0];
    } catch (err) {
      throw new Error(
        `Could not increment the popularity of product with id: ${prodId}`
      );
    }
  }

  // only authenticated admins owner of the product -> handler restriction
  async delete(prodId: number, adminId: number): Promise<Product> {
    try {
      const conn = await Client.connect();
      const sql = `DELETE FROM products WHERE id = ${prodId} AND admin_fk = ${adminId}`;
      const result = await conn.query(sql);
      conn.release();
      return result.rows[0];
    } catch (err) {
      throw new Error(
        `Could not delete product with id ${prodId}. Error: ${err}`
      );
    }
  }
}
