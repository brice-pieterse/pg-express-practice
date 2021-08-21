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