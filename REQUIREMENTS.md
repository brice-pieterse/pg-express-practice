# API Requirements
The company stakeholders want to create an online storefront to showcase their great product ideas. Users need to be able to browse an index of all products, see the specifics of a single product, and add products to an order that they can view in a cart page. You have been tasked with building the API that will support this application, and your coworker is building the frontend.

These are the notes from a meeting with the frontend developer that describe what endpoints the API needs to supply, as well as data shapes the frontend and backend have agreed meet the requirements of the application. 

## API Endpoints

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


## Data Shapes
#### Product
-  id
- name
- price
- [OPTIONAL] category

#### User
- id
- firstName
- lastName
- password

#### Orders
- id
- id of each product in the order
- quantity of each product in the order
- user_id
- status of order (active or complete)


## Database Schema

#### users
- id INTEGER (PRIMARY KEY)
- first_name VARCHAR(50)
- last_name VARCHAR(50)
- username VARCHAR(30)
- password_digest TEXT
- role VARCHAR(20)

#### orders
- id INTEGER (PRIMARY KEY)
- fk_user_id INTEGER  (FOREIGN KEY referencing users id)
- status VARCHAR(50)
- total INTEGER
- date_fulfilled DATE

#### products
- id INTEGER (PRIMARY KEY)
- name VARCHAR(50)
- price INTEGER
- description TEXT
- admin_fk_id INTEGER (FOREIGN KEY referencing users id)
- popularity INTEGER

#### order_products
- id INTEGER (PRIMARY KEY)
- fk_order_id INTEGER (FOREIGN KEY referencing orders id)
- fk_prod_id INTEGER (FOREIGN KEY referencing products id)
- qty INTEGER

#### refresh_tokens
- id INTEGER (PRIMARY KEY)
- value TEXT
- created_at DATE
- fk_user_id INTEGER (FOREIGN KEY referencing users id)