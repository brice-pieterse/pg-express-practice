/* dependencies _______________________________________________________________ */

import { dashboardStore } from '../../models/services/dashboard';
import express, { Request, Response } from 'express';
import { verifyAdmins } from '../users';

/* stores _______________________________________________________________ */

const store = new dashboardStore();

/* handlers _______________________________________________________________ */

const getUserPurchases = async (req: Request, res: Response) => {
  let userId;
  const prods: string[] = []
  try {
    userId = req.params.id;
    const products = await store.getProductsOfUser(parseInt(userId));
    for (const product of products){
      prods.push(product.name)
    }
    res.json(prods);
  } catch (err) {
    res.status(400).json({ errorType: 'get user purchases' });
  }
};

const getMostPopular = async (req: Request, res: Response) => {
  try {
    const limit = req.params.limit;
    const products = await store.getMostPopular(parseInt(limit));
    res.json(products);
  } catch (err) {
    res.status(400).json({ errorType: 'get most popular' });
  }
};

const numberOfRecentOrders = async (req: Request, res: Response) => {
  try {
    const backdate = req.params.days;
    const recents = await store.getRecentOrders(parseInt(backdate));
    res.json(recents.length);
  } catch (err) {
    res.status(400).json({ errorType: 'get number of recent orders' });
  }
};

/* routes _______________________________________________________________ */

const dashboardRoutes = (app: express.Application) => {
  app.get('/user/:id/purchases', verifyAdmins, getUserPurchases);
  app.get('/products/ranking/:limit', verifyAdmins, getMostPopular);
  app.get('/orders/recent/:days', verifyAdmins, numberOfRecentOrders);
};

export default dashboardRoutes;
