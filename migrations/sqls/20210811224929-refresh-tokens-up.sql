/* Replace with your SQL commands */
CREATE TABLE refresh_tokens (id SERIAL PRIMARY KEY, value TEXT, created_at date DEFAULT NOW()::DATE, fk_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE);