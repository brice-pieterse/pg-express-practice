/* dependencies _______________________________________________________________ */

import { productStore } from '../models/product';
import express, { Request, Response } from 'express';
import { verifyAdmins } from './users';

/* utils _______________________________________________________________ */

import { limiter } from '../util/limiter';

/* stores _______________________________________________________________ */

const store = new productStore();

/* handlers _______________________________________________________________ */

const index = async (req: Request, res: Response) => {
  try {
    const products = await store.index();
    res.json(products);
  } catch (err) {
    res.status(400).json({ errorType: 'index products' });
  }
};

const show = async (req: Request, res: Response) => {
  let prodId;
  try {
    prodId = parseInt(req.params.id);
    let product;
    if (req.body.prodName) {
      product = await store.show(0, req.body.prodName);
    } else {
      product = await store.show(prodId);
    }
    res.json(product);
  } catch (err) {
    res.status(400).json({ errorType: 'show product' });
  }
};

const create = async (req: Request, res: Response) => {
  const prodName = req.body.productName;
  const price: number = parseInt(req.body.price);
  const description = req.body.description;
  const adminId: number = parseInt(res.locals.user.id);

  try {
    const product = await store.create(prodName, price, description, adminId);
    res.json(product);
  } catch (err) {
    res.status(400).json({ errorType: 'create product' });
  }
};

const update = async (req: Request, res: Response) => {
  let prodId;
  try {
    prodId = req.params.id;
    const name = req.body.prodName;
    const price = req.body.price;
    const description = req.body.description;
    const adminId = res.locals.user.id;
    const product = await store.update(
      parseInt(prodId),
      name,
      price,
      description,
      parseInt(adminId)
    );
    res.json(product);
  } catch (err) {
    res.status(400).json({ errorType: 'update product' });
  }
};

const deleteProd = async (req: Request, res: Response) => {
  let prodId;
  try {
    prodId = req.params.id;
    const adminId = res.locals.user.id;
    const result = await store.delete(parseInt(prodId), parseInt(adminId));
    res.json(result);
  } catch (err) {
    res.status(400).json({ errorType: 'delete product' });
  }
};

/* routes _______________________________________________________________ */

const productRoutes = (app: express.Application) => {
  app.get('/products', limiter, index);
  app.get('/products/:id', limiter, show);
  app.post('/products', verifyAdmins, create);
  app.put('/products/:id', verifyAdmins, update);
  app.delete('/products/:id', verifyAdmins, deleteProd);
};

export default productRoutes;
