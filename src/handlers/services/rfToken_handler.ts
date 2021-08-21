/* dependencies _______________________________________________________________ */

import express, { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { rfTokenStore } from '../../models/services/refreshToken';
import { userStore } from '../../models/user';
import { verifyUsers } from '../users';

/* utils _______________________________________________________________ */

import { createRefreshToken } from '../../util/refreshAuth';

/* stores _______________________________________________________________ */

const rfStore = new rfTokenStore();
const usersStore = new userStore();

/* handlers _______________________________________________________________ */

const validateRF = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // gets RF
    const refresh_token: string = req.signedCookies['refresh_token'];
    await rfStore.validateRefreshToken(refresh_token);
    next();
  } catch (err) {
    res.status(400).json({ errorType: 'invalid RF token' });
  }
};

const refreshAuth = async (req: Request, res: Response) => {
  const rfTest = req.params.rfTest;
  try {
    const oldRF: string = req.signedCookies['refresh_token'];
    const userId = req.params.id;

    // generates a new refresh token to replace it (refresh token rotation)
    const newRF = createRefreshToken();

    // refresh token rotation
    await rfStore.updateRefreshToken(parseInt(userId), oldRF, newRF.value);

    // send a new access token along with the new refresh token
    const user = await usersStore.show('__', parseInt(userId));
    const token = jwt.sign(
      { user: user },
      process.env.TOKEN_SECRET as unknown as string,
      { expiresIn: '6m' }
    );

    if (rfTest === 'rfTest') {
      res.json({
        user: user,
        access_token: token,
        rf: newRF.value
      });
    } else {
      res.cookie('refresh_token', newRF.value, {
        expires: newRF.expiry,
        httpOnly: true,
        signed: true
      });
      res.json({
        user: user,
        access_token: token
      });
    }
  } catch (err) {
    res.status(400).json({ errorType: 'no refresh token' });
  }
};

/* routes _______________________________________________________________ */

const rfTokenRoutes = (app: express.Application) => {
  app.get('/users/:id/refresh_auth', verifyUsers, validateRF, refreshAuth);
  // testing specific routes
  app.get(
    '/users/:id/refresh_auth/:rfTest',
    verifyUsers,
    validateRF,
    refreshAuth
  );
};

export default rfTokenRoutes;
