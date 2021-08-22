/* dependencies _______________________________________________________________ */

import { orderStore } from '../models/order';
import { productStore } from '../models/product';
import express, { Request, Response } from 'express';
import { verifyAdmins, verifyUsers, store as user_store } from './users';

/* utils _______________________________________________________________ */

import { limiter } from '../util/limiter';

/* stores _______________________________________________________________ */

export const store = new orderStore();

/* handlers _______________________________________________________________ */

// restricted to admins
const index = async (req: Request, res: Response) => {
  try {
    const orders = await store.index();
    res.json(orders);
  } catch (err) {
    res.status(400).json({ errorType: 'index orders' });
  }
};

// restricted to the user this order belongs to, or admins
const show = async (req: Request, res: Response) => {
  let orderId;
  let order;
  try {
    orderId = req.params.id;
    const user = res.locals.user;
    // order can be queried using orderId
    if (orderId) {
      order = await store.show(user.id, 'user', 'open', parseInt(orderId));
    }
    // or just the order that's open for that user
    else {
      order = await store.show(user.id, 'user', 'open');
    }
    res.json(order);
  } catch (err) {
    res.status(400).json({ errorType: 'show order' });
  }
};

// restricted to the user this order belongs to
const placeOrder = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const userId = res.locals.user.id;
    // Gets all order_products with this order id
    const productsInOrder = await store.indexProducts(parseInt(orderId));
    const prodStore = new productStore();
    let orderTotal = 0;
    // loops through order_products and adds their total to the order total
    for (const orderProd of productsInOrder) {
      const product = await prodStore.show(orderProd.fk_prod_id);
      const total = product.price * orderProd.qty;
      orderTotal += total;
    }
    // Marks the order as placed, updates it's total, opens a fresh order for future
    const placedOrder = await store.place(
      orderTotal,
      parseInt(orderId),
      parseInt(userId)
    );
    await store.create(parseInt(userId));
    res.json(placedOrder);
  } catch (err) {
    res.status(400).json({ errorType: 'place order' });
  }
};

// restricted to admins, once fulfilled adds +1 to each product's popularity
const fulfillOrder = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const result = store.fulfill(parseInt(orderId));
    result
      .then(async (fulfilledOrder) => {
        const prodStore = new productStore();
        const productsInOrder = await store.indexProducts(parseInt(orderId));
        for (const prod of productsInOrder) {
          const prodId = prod.fk_prod_id;
          // increments the popularity of the product with this id
          await prodStore.tallyPurchase(prodId);
        }
        return fulfilledOrder;
      })
      .then((result) => {
        res.json(result);
      });
  } catch (err) {
    res.status(400).json({ errorType: 'fulfill order' });
  }
};

// restricted to the user this order belongs to, only if order is in "placed" status
const cancelOrder = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const userId = res.locals.user.id;
    const order = await store.cancel(parseInt(orderId), parseInt(userId));
    res.json(order);
  } catch (err) {
    res.status(400).json({ errorType: 'cancel order' });
  }
};

// restricted to the user this order belongs to, or admins
const getCurrentOrderByUser = async (req: Request, res: Response) => {
  try {
    const username = req.params.username
    // username must match the user making req, unless req is from an admin
    if (username !== res.locals.user.username && res.locals.user.role !== 'admin'){
      throw new Error();
    }
    const user = await user_store.show(username)
    const userRole = res.locals.user.role
    const order = await store.show(user.id, userRole, 'open')
    res.json(order)
  }
  catch (err){
    res.status(400).json({errorType: 'Get current order of user'})
  }
}

// restricted to the user this order belongs to, or admins
const getFulfilledOrdersByUser = async (req: Request, res: Response) => {
  try {
    const username = req.params.username
    // username must match the user making req, unless req is from an admin
    if (username !== res.locals.user.username && res.locals.user.role !== 'admin'){
      throw new Error();
    }
    const userRole = res.locals.user.role
    const user = await user_store.show(username)
    const order = await store.show(user.id, userRole, 'fulfilled')
    res.json(order)
  }
  catch (err){
    res.status(400).json({errorType: 'Get current order of user'})
  }
}

// restricted to the user this order belongs to
const addToOrder = async (req: Request, res: Response) => {
  try {
    const prodId = req.body.prodId;
    const userId = res.locals.user.id;
    const qty = req.body.qty;
    const orderId = req.params.id;
    const ownership = await store.verifyOwnership(userId, parseInt(orderId));
    // verified the auth user is the owner of this order id
    if (ownership) {
      const orderProduct = store.addProduct(
        parseInt(prodId),
        parseInt(orderId),
        parseInt(qty)
      );
      res.json(orderProduct);
    } else
      throw new Error('Authenticated user is not the owner of this order id');
  } catch (err) {
    res.status(400).json({ errorType: 'add to order' });
  }
};

/* routes _______________________________________________________________ */

const orderRoutes = (app: express.Application) => {
  app.get('/orders', verifyAdmins, index);
  app.get('/orders/:id', limiter, verifyUsers, show);
  app.get('/orders/:username/current', verifyUsers, getCurrentOrderByUser);
  app.get('/orders/:username/fulfilled', verifyUsers, getFulfilledOrdersByUser);
  app.put('/orders/:id/place', limiter, verifyUsers, placeOrder);
  app.put('/orders/:id/fulfill', limiter, verifyAdmins, fulfillOrder);
  app.post('/orders/:id/products', limiter, verifyUsers, addToOrder);
  app.delete('/orders/:id', verifyUsers, cancelOrder);
};

export default orderRoutes;
