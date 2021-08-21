import { Order, orderStore } from '../models/order';
import supertest from 'supertest';
import app from '../server';
import { User, userStore } from '../models/user';
import { Product, productStore } from '../models/product';
import Client from '../database';

const request = supertest(app);
const product_store = new productStore();
const order_store = new orderStore();
const user_store = new userStore();

const Brice = {
  first_name: 'brice',
  last_name: 'pieterse',
  username: 'bpiet',
  password: 'example1'
};

const Admin = {
  first_name: 'admin',
  last_name: 'user',
  username: 'adminMan',
  password: 'example10'
};

const AdminCredentials = {
  username: 'adminMan',
  password: 'example10'
};

const BriceCredentials = {
  username: 'bpiet',
  password: 'example1'
};

const ProductExample = {
  productName: 'Game of Thrones',
  price: 50,
  description: 'Best show ever, but season 8 was meh'
};

describe('Test Order Model', () => {
  afterAll(async () => {
    const conn = await Client.connect();
    const clearProducts = 'DELETE FROM products';
    const clearOrders = 'DELETE FROM orders';
    const clearUsers = 'DELETE FROM users';
    const clearOrderProducts = 'DELETE FROM order_products';
    await conn.query(clearProducts);
    await conn.query(clearOrders);
    await conn.query(clearUsers);
    await conn.query(clearOrderProducts);
  });

  let adminId: number;
  let product: Product;
  let order: Order;

  it('should return a list of orders', async () => {
    const orders = await order_store.index();
    expect(orders).toEqual([]);
  });

  it('should create a user who needs an order', async () => {
    const insert = await user_store.create(Brice);
    expect(insert).toEqual(1);
  });

  it('should create an order', async () => {
    const insert = await order_store.create(1);
    expect(insert).toBeDefined();
  });

  it('should show the order', async () => {
    const o = await order_store.show(1, 'user', 'open');
    expect(o.status).toEqual('open');
    order = o;
  });

  it('should create an administrator', async () => {
    const admin = await user_store.create(Admin, true);
    expect(admin).toBeDefined();
  });

  it('should get the admin', async () => {
    const admin = await user_store.show(Admin.username);
    expect(admin.username).toEqual(Admin.username);
    adminId = admin.id;
  });

  it('should create a product', async () => {
    const product = await product_store.create(
      'Game of Thrones',
      50,
      'Best show ever',
      adminId
    );
    expect(product).toBeDefined();
  });

  it('should get the product', async () => {
    const prod = await product_store.show(0, 'Game of Thrones');
    expect(prod.price).toEqual(50);
    product = prod;
  });

  it('should add a product to the order', async () => {
    const insert = await order_store.addProduct(product.id, 1, 1);
    expect(insert).toBeDefined();
  });

  it('should index all of the products', async () => {
    const products = await product_store.index();
    expect(products.length).toBe(1);
  });

  it('should verify the owner of the order', async () => {
    const verify = await order_store.verifyOwnership(1, order.id);
    expect(verify).toBe(true);
  });

  it('should place the order', async () => {
    const place = await order_store.place(50, order.id, 1);
    expect(place).toBeDefined();
  });

  it('should fulfill the order', async () => {
    const fulfill = await order_store.fulfill(order.id);
    expect(fulfill).toBeDefined();
  });

  it('should cancel the order', async () => {
    const cancelled = await order_store.cancel(order.id, 1);
    expect(cancelled).toBeDefined();
  });
});

describe('Test Order Handlers', () => {
  let user: User;
  let userOrder: Order;
  let acToken: string;

  let adminAcToken: string;

  let exampleProductId: string;

  afterAll(async () => {
    const conn = await Client.connect();
    const clearProducts = 'DELETE FROM products';
    const clearOrders = 'DELETE FROM orders';
    const clearUsers = 'DELETE FROM users';
    const clearOrderProducts = 'DELETE FROM order_products';
    await conn.query(clearProducts);
    await conn.query(clearOrders);
    await conn.query(clearUsers);
    await conn.query(clearOrderProducts);
  });

  it('should create a user for restricted handlers', async () => {
    const user = await user_store.create(Brice);
    expect(user).toBeDefined();
  });

  it('should create an admin for admin-only handlers', async () => {
    const user = await user_store.create(Admin, true);
    expect(user).toBeDefined();
  });

  it('should get the newly created user', async () => {
    const u = await user_store.show(Brice.username);
    user = u;
  });

  it('should create an order for that user', async () => {
    const order = await order_store.create(user.id);
    expect(order).toBeDefined();
  });

  it('should get that order', async () => {
    const order = await order_store.show(user.id, 'user', 'open');
    expect(order.status).toEqual('open');
    userOrder = order;
  });

  it('should get an access token for the user', async () => {
    const response = await request
      .post('/users/auth')
      .send(BriceCredentials)
      .expect(200);
    acToken = response.body.access_token;
  });

  it('should get the newly created admin', async () => {
    const u = await user_store.show(Admin.username)
    expect(u.first_name).toEqual('admin')
  });

  it('should get an access token for the admin', async () => {
    const response = await request
      .post('/users/auth')
      .send(AdminCredentials)
      .expect(200);
    expect(response.body.access_token).toBeDefined();
    adminAcToken = response.body.access_token;
  });

  it('should use that access token to access all orders', async () => {
    const response = await request
      .get('/orders')
      .auth(adminAcToken, { type: 'bearer' })
      .expect(200);
    expect(response.body.length).toEqual(1);
  });

  it('should use the access token of user to get one of their orders', async () => {
    const response = await request
      .get(`/orders/${userOrder.id}`)
      .auth(acToken, { type: 'bearer' })
      .expect(200);
    expect(response.body.id).toEqual(userOrder.id);
  });

  it('should use the admin access token to create a product', async () => {
    await request
      .post('/products')
      .auth(adminAcToken, { type: 'bearer' })
      .send(ProductExample)
      .expect(200);
  });

  it('should get the newly created product', async () => {
    const response = await request
      .get('/products/0')
      .send({ prodName: ProductExample.productName })
      .expect(200);
    expect(response.body.name).toEqual(ProductExample.productName);
    exampleProductId = response.body.id;
  });

  it('should add a product (quantity 2) to userOrder', async () => {
    await request
      .post(`/orders/${userOrder.id}/products`)
      .auth(acToken, { type: 'bearer' })
      .send({
        prodId: exampleProductId,
        userId: user.id,
        qty: 2,
        orderId: userOrder.id
      })
      .expect(200);
  });

  it('should place the order with 2 products in it', async () => {
    const response = await request
      .put(`/orders/${userOrder.id}/place`)
      .auth(acToken, { type: 'bearer' })
      .expect(200);
    expect(response).toBeDefined();
  });

  it('should now show a total for the order that was placed', async () => {
    const response = await request
      .get(`/orders/${userOrder.id}`)
      .auth(acToken, { type: 'bearer' })
      .expect(200);
    expect(response.body.status).toEqual('placed');
  });

  it('should fulfill the order that the user just placed above...fast delivery', async () => {
    const response = await request
      .put(`/orders/${userOrder.id}/fulfill`)
      .auth(adminAcToken, { type: 'bearer' })
      .expect(200);
    expect(response.body).toBeDefined();
  });

  it('should now show a date the order was fulfilled', async () => {
    const response = await request
      .get(`/orders/${userOrder.id}`)
      .auth(acToken, { type: 'bearer' })
      .expect(200);
    expect(response.body.status).toEqual('fulfilled');
    expect(response.body.date_fulfilled).toBeDefined();
  });
});
