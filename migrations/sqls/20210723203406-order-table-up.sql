/* Replace with your SQL commands */
CREATE TABLE orders (id SERIAL PRIMARY KEY, fk_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, status VARCHAR(50), total INTEGER, date_fulfilled date);