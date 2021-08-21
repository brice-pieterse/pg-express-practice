import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import orderRoutes from './handlers/orders';
import userRoutes from './handlers/users';
import productRoutes from './handlers/products';
import dashboardRoutes from './handlers/services/dashboard_handler';
import rfTokenRoutes from './handlers/services/rfToken_handler';

dotenv.config();

const app: express.Application = express();
const { COOKIE_SECRET } = process.env;

app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser(COOKIE_SECRET));

// cors config
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Allow-Access-Control-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.header('Allow-Control-Allow-Methods', 'GET, PUT, POST, PATCH, DELETE');
    return res.status(200).json({});
  }
  next();
});

orderRoutes(app);
userRoutes(app);
productRoutes(app);
dashboardRoutes(app);
rfTokenRoutes(app);

app.listen(3000);

export default app;
