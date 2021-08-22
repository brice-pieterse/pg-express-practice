/* dependencies _______________________________________________________________ */

import { userStore, General_User } from '../models/user';
import { rfTokenStore } from '../models/services/refreshToken';
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { store as orderStore } from './orders';

/* utils _______________________________________________________________ */

import { createRefreshToken } from '../util/refreshAuth';
import validatePass from '../util/passwordValidator';
import { limiter, signUpLimiter } from '../util/limiter';

/* stores _______________________________________________________________ */

export const store = new userStore();
const rfStore = new rfTokenStore();

/* handlers _______________________________________________________________ */

export const verifyUsers = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1] as string;
    jwt.verify(token, process.env.TOKEN_SECRET as string, (err, decoded) => {
      if (err) {
        throw new Error();
      }
      res.locals.user = decoded!.user;
    });
    next();
  } catch (err) {
    res.status(400).json({ errorType: 'invalid token' });
  }
};

export const verifyAdmins = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1] as string;
    jwt.verify(token, process.env.TOKEN_SECRET as string, (__, decoded) => {
      if (decoded!.user.role === 'admin') {
        res.locals.user = decoded!.user;
        next();
      } else throw new Error();
    });
  } catch (err) {
    res.status(400).json({ errorType: 'invalid token' });
  }
};

const authenticate = async (req: Request, res: Response) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const user = await store.authenticate(username, password);
    if (user) {
      // create new access token
      const token = jwt.sign(
        { user: user },
        process.env.TOKEN_SECRET as unknown as string,
        { expiresIn: '10m' }
      );
      // create new refresh_token
      const rfToken = createRefreshToken();
      // store refresh token in db
      await rfStore.addRefreshToken(user.id, rfToken.value);
      res.cookie('refresh_token', rfToken.value, {
        expires: rfToken.expiry,
        httpOnly: true,
        signed: true
      });
      res.json({
        user: user,
        access_token: token
      });
    } else throw new Error('no user');
  } catch (err) {
    if (err.message === 'no user') {
      res
        .status(400)
        .json({ errorType: 'no user with the provided username/password' });
    } else res.status(400).json({ errorType: 'server error' });
  }
};

const indexUsers = async (req: Request, res: Response) => {
  try {
    const users = await store.index();
    res.json({users: users});
  } catch (err) {
    res.status(400).json('Could not index users');
  }
};

const showUser = async (req: Request, res: Response) => {
  const username = req.params.username;
  try {
    const user = await store.show(username);
    res.json(user);
  } catch (err) {
    res.status(400).json('Could not get user');
  }
};

const createUser = async (req: Request, res: Response) => {
  const rfTest = req.params.rfTest;
  const user: General_User = {
    first_name: req.body.firstName,
    last_name: req.body.lastName,
    username: req.body.username,
    password: req.body.password
  };
  try {
    if (user.username.length > 30) {
      return res.status(400).json({ errorType: 'username' });
    } else if (user.password.length > 30 || !validatePass(user.password)) {
      return res.status(400).json({ errorType: 'password' });
    }
    // open new user account
    await store.create(user);
    const foundUser = await store.show(user.username);
    // first order for that user
    await orderStore.create(foundUser.id);
    // create access token
    const token = jwt.sign(
      { user: foundUser },
      process.env.TOKEN_SECRET as unknown as string,
      { expiresIn: '6m' }
    );
    // create refresh token
    const rf = createRefreshToken();
    await rfStore.addRefreshToken(foundUser.id, rf.value);
    // sends refresh token in response for testing purposes
    if (rfTest === 'rfTest') {
      res.status(200).json({
        user: foundUser.username,
        token: token,
        rf: rf.value
      });
    } else {
      res.cookie('refresh_token', rf.value, {
        expires: rf.expiry,
        httpOnly: true
      });
      res.status(200).json({
        user: foundUser.username,
        token: token
      });
    }
  } catch (err) {
    res.status(400).json({ errorType: 'create user' });
  }
};

const updateUser = async (req: Request, res: Response) => {
  const updatedUser: General_User = {
    first_name: req.body.firstName,
    last_name: req.body.lastName,
    username: req.body.username,
    password: req.body.newPassword
  };
  const oldPassword = req.body.oldPassword;
  const oldUsername = req.body.oldUsername;
  try {
    await store.update(updatedUser, oldPassword, oldUsername);
    const user = await store.show(updatedUser.username);
    res.json(user);
  } catch (err) {
    res.status(400).json({ errorType: 'update user' });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  try {
    const result = await store.delete(req.body.username, req.body.password);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ errorType: 'delete user' });
  }
};

/* routes _______________________________________________________________ */

const userRoutes = (app: express.Application) => {
  app.post('/users', signUpLimiter, createUser);
  app.post('/users/auth', limiter, authenticate);
  app.get('/users', limiter, verifyUsers, indexUsers);
  app.get('/users/:username', limiter, verifyUsers, showUser);
  app.put('/users/:username', verifyUsers, updateUser);
  app.delete('/users/:username', verifyUsers, deleteUser);

  // testing specific routes
  app.post('/users/:rfTest', signUpLimiter, createUser);
};

export default userRoutes;
