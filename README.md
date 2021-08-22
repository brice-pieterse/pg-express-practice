# Storefront Backend Project

## Overview

The goal was to build a simple RESTful API for an online storefront, complete with users, administrators, products, and orders. The project gave me a chance to practice authentication (JWT, refresh tokens), postgreSQL, database migrations, and integration + endpoint testing with Jasmine and Supertest.

## Usage

To get started, setup a .env file complete with the following variables:

```
ENV=DEV

DB_USERNAME=
DB_PASSWORD=

DEV_DB_HOST=
TEST_DB_HOST=

DEV_DB=
TEST_DB=udacity_test

BCRYPT_PASSWORD=
TOKEN_SECRET=
COOKIE_SECRET=

SALT_ROUNDS=
```

To run the migrations on your DEV database, make sure to set up a dev database in advance and add it's name, host, username, and password to the .env variables above, then:

```
db-migrate --env dev up
```

To run tests and get an overview of the endpoints and functionality:

```
npm run test
```

This will run the following script on testDb (configured in the databse.json file), which uses the variables TEST_DB_HOST and TEST_DB=udacity_test from the .env file above. If you want to change the TEST_DB name in the .env file, make sure to update the name in the following script:

```
npx tsc && db-migrate db:create udacity_test && db-migrate --env testDb up && ENV=TEST jasmine && db-migrate db:drop udacity_test
```

## Api Endpoints

#### Products
- Index (GET '/products')
- Show (args: product id) (GET '/products/:id')
- Create [token required - Admin User only] (POST '/products')
- Update [token required - Admin User only] (args: product id) (PUT '/products/:id')
- Delete [token required - Admin User only] (args: product id) (DELETE '/products/:id')

#### Users
- Index [token required] (GET '/users')
- Show [token required] (GET '/users/:username') (args: username)
- Create [token required] (POST '/users')
- Authenticate (POST '/users/auth')
- Update [token required] (PUT '/users/:username')
- Delete [token required] (DELETE '/users/:username')

#### Orders
- Index [token required - Admin User only] (GET '/orders')
- Show [token required] (args: order id) (GET '/orders/:id')
- Current Order by user (args: user id)[token required] (GET '/orders/:username/current')
- Completed Orders by user (args: user id)[token required] (GET '/orders/:username/fulfilled')
- Place an order (args: order id) [token required] (PUT '/orders/:id/place')
- Fulfill an order (args: order id) [token required - Admin User only] (PUT '/orders/:id/fulfill')
- Add to an order (args: order id) [token required] (POST '/orders/:id/products')
- Cancel an order (args: order id) [token required] (DELETE '/orders/:id')

#### Refresh Token
- Get a new access token and refresh token using current refresh token [cookie required: 'refresh_token'] (GET '/users/:id/refresh_auth')

#### Dashboard/Services (EXTRAS)
- Get User Purchases [token required - Admin User only] (GET '/user/:id/purchases')
- Get Most Popular Products [token required - Admin User only] (GET '/products/ranking/:limit')
- Get Number Recent Orders [token required - Admin User only] (GET '/orders/recent/:timeline')