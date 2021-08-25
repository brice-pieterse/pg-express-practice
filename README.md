# Storefront Backend Project

## Overview

The goal was to build a simple RESTful API for an online storefront, complete with users, administrators, products, and orders. The project gave me a chance to practice authentication (JWT, refresh tokens), postgreSQL, database migrations, and integration + endpoint testing with Jasmine and Supertest.

## ENV setup

To get started, setup a .env file complete with the following variables:

```
ENV=DEV

DB_USERNAME=udacity
DB_PASSWORD=password123

DEV_DB_HOST=localhost
TEST_DB_HOST=localhost

DEV_DB=udacity_shop
TEST_DB=udacity_test

BCRYPT_PASSWORD=udacity_rocks_alot
TOKEN_SECRET=udacity_fufacity
COOKIE_SECRET=udacity_cookie

SALT_ROUNDS=10
```


## Database Setup

Start by creating a user to connect to the database:

```
CREATE USER udacity WITH PASSWORD 'password123'
```

Set up the database:

```
CREATE DATABASE udacity_shop;
CREATE DATABASE udacity_test;
```

Then:

```
GRANT ALL PRIVILEGES ON DATABASE udacity_shop TO udacity 
GRANT ALL PRIVILEGES ON DATABASE udacity_test TO udacity 
```

Make sure to drop the test database before running the npm test script since the test script will create the test database before dropping it at the end.


## NPM Scripts

To run the migrations on your DEV database, make sure to add the database name, host, username, and password to the .env variables above, then:

```
db-migrate --env dev up
```

To run tests and get an overview of the endpoints and functionality:

```
npm run test
```

This will run the following script on testDb (configured in the database.json file, using ENV variables TEST_DB_HOST and TEST_DB=udacity_test). If you want to change the TEST_DB name in the .env file, make sure to update udacity_test to another name in the following script. 

REMINDER: if you created udacity_test database prior to this, drop it before running this script since the script will create it from scratch:

```
npx tsc && db-migrate db:create udacity_test && db-migrate --env testDb up && ENV=TEST jasmine && db-migrate db:drop udacity_test
```