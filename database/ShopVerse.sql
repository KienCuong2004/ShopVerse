-- ShopVerse Database Schema & Sample Data
-- Created: 2025-01-11

-- Drop database if exists and create new one
-- WARNING: Dropping the entire database will erase ALL data.
DROP DATABASE IF EXISTS "ShopVerse";
CREATE DATABASE "ShopVerse";

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    role VARCHAR(20) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(255),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    discount_price DECIMAL(10, 2) CHECK (discount_price >= 0),
    stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
    sku VARCHAR(100) UNIQUE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    image_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK')),
    rating DECIMAL(3, 2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product images table (for multiple images per product)
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shopping cart table
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    shipping_address TEXT NOT NULL,
    shipping_phone VARCHAR(20),
    shipping_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED')),
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status VARCHAR(20) DEFAULT 'APPROVED' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id, order_id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert Users (password: 123456)
-- All passwords are BCrypt hashed for "123456"
-- BCrypt hash: $2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm
INSERT INTO users (username, email, password, full_name, phone, address, role) VALUES
('admin', 'admin@shopverse.com', '$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm', 'Administrator', '0123456789', '123 Admin Street, City', 'ADMIN'),
('john_doe', 'john.doe@example.com', '$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm', 'John Doe', '0987654321', '456 Main Street, District 1', 'USER'),
('jane_smith', 'jane.smith@example.com', '$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm', 'Jane Smith', '0912345678', '789 Oak Avenue, District 3', 'USER'),
('mike_wilson', 'mike.wilson@example.com', '$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm', 'Mike Wilson', '0923456789', '321 Pine Road, District 5', 'USER'),
('sarah_jones', 'sarah.jones@example.com', '$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm', 'Sarah Jones', '0934567890', '654 Elm Street, District 7', 'USER'),
('disabled_user', 'disabled.user@example.com', '$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm', 'Disabled User', '0945678901', '876 Fifth Avenue, District 9', 'USER'),
('admin_disabled', 'admin.disabled@example.com', '$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm', 'Admin Disabled', '0956789012', '987 Sixth Avenue, District 11', 'ADMIN'),
('user_disabled', 'user.disabled@example.com', '$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm', 'User Disabled', '0967890123', '109 Eighth Avenue, District 13', 'USER'),
('admin_disabled_user', 'admin.disabled.user@example.com', '$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm', 'Admin Disabled User', '0978901234', '120 Tenth Avenue, District 15', 'ADMIN'),
('user_disabled_admin', 'user.disabled.admin@example.com', '$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm', 'User Disabled Admin', '0989012345', '131 Twelfth Avenue, District 17', 'USER')
ON CONFLICT (username) DO NOTHING;

-- Insert Categories
INSERT INTO categories (name, description, image_url) VALUES
('Electronics', 'Electronic devices, gadgets, and accessories', 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece'),
('Clothing', 'Fashion apparel for men and women', 'https://images.unsplash.com/photo-1445205170230-053b83016050'),
('Books', 'Books, novels, and educational materials', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570'),
('Home & Garden', 'Home decor and garden supplies', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7'),
('Sports', 'Sports equipment and athletic gear', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b'),
('Toys & Games', 'Toys, board games, and entertainment', 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4')
ON CONFLICT (name) DO NOTHING;

-- Insert Sub-categories (optional)
DO $$
DECLARE
    electronics_id UUID;
    clothing_id UUID;
BEGIN
    SELECT id INTO electronics_id FROM categories WHERE name = 'Electronics' LIMIT 1;
    SELECT id INTO clothing_id FROM categories WHERE name = 'Clothing' LIMIT 1;
    
    INSERT INTO categories (name, description, parent_id) VALUES
    ('Smartphones', 'Mobile phones and accessories', electronics_id),
    ('Laptops', 'Laptop computers and accessories', electronics_id),
    ('Men''s Clothing', 'Clothing for men', clothing_id),
    ('Women''s Clothing', 'Clothing for women', clothing_id)
    ON CONFLICT (name) DO NOTHING;
END $$;

-- Insert Products
DO $$
DECLARE
    smartphones_id UUID;
    laptops_id UUID;
    electronics_id UUID;
    mens_clothing_id UUID;
    womens_clothing_id UUID;
    books_id UUID;
    home_garden_id UUID;
    sports_id UUID;
    toys_games_id UUID;
BEGIN
    SELECT id INTO smartphones_id FROM categories WHERE name = 'Smartphones' LIMIT 1;
    SELECT id INTO laptops_id FROM categories WHERE name = 'Laptops' LIMIT 1;
    SELECT id INTO electronics_id FROM categories WHERE name = 'Electronics' LIMIT 1;
    SELECT id INTO mens_clothing_id FROM categories WHERE name = 'Men''s Clothing' LIMIT 1;
    SELECT id INTO womens_clothing_id FROM categories WHERE name = 'Women''s Clothing' LIMIT 1;
    SELECT id INTO books_id FROM categories WHERE name = 'Books' LIMIT 1;
    SELECT id INTO home_garden_id FROM categories WHERE name = 'Home & Garden' LIMIT 1;
    SELECT id INTO sports_id FROM categories WHERE name = 'Sports' LIMIT 1;
    SELECT id INTO toys_games_id FROM categories WHERE name = 'Toys & Games' LIMIT 1;
    
    INSERT INTO products (name, description, price, discount_price, stock_quantity, sku, category_id, image_url, status, rating, total_reviews) VALUES
    -- Electronics
    ('iPhone 15 Pro', 'Latest iPhone with A17 Pro chip, 256GB storage', 29990000, 27990000, 50, 'IPH15PRO256', smartphones_id, '/assets/images/products/iphone-15-pro-main.jpg', 'ACTIVE', 4.8, 125),
    ('MacBook Pro 16"', 'M3 Max chip, 32GB RAM, 1TB SSD', 69990000, NULL, 25, 'MBP16M3MAX', laptops_id, '/assets/images/products/macbook-pro-16-main.jpg', 'ACTIVE', 4.9, 89),
    ('Samsung Galaxy S24 Ultra', '200MP camera, 512GB storage, S Pen included', 25990000, 23990000, 30, 'SGAL24U512', smartphones_id, '/assets/images/products/samsung-galaxy-s24-ultra-main.jpg', 'ACTIVE', 4.7, 156),
    ('AirPods Pro 2', 'Active noise cancellation, spatial audio', 5490000, 4990000, 100, 'AIRPODSPRO2', electronics_id, '/assets/images/products/airpods-pro-2-main.jpg', 'ACTIVE', 4.6, 203),
    ('Sony WH-1000XM5', 'Industry-leading noise canceling headphones', 7990000, 7290000, 40, 'SONYWH1000XM5', electronics_id, '/assets/images/products/sony-wh-1000xm5-main.jpg', 'ACTIVE', 4.8, 178),
    -- Clothing
    ('Classic White T-Shirt', '100% cotton, comfortable fit', 299000, NULL, 200, 'TSHIRT-WHITE', mens_clothing_id, '/assets/images/products/classic-white-t-shirt-main.jpg', 'ACTIVE', 4.5, 89),
    ('Denim Jeans', 'Slim fit, stretchable denim', 899000, 749000, 150, 'JEANS-SLIM', mens_clothing_id, '/assets/images/products/denim-jeans-main.jpg', 'ACTIVE', 4.4, 112),
    ('Summer Dress', 'Lightweight floral print dress', 1199000, 999000, 80, 'DRESS-SUMMER', womens_clothing_id, '/assets/images/products/summer-dress-main.jpg', 'ACTIVE', 4.6, 134),
    -- Books
    ('The Great Gatsby', 'Classic American novel by F. Scott Fitzgerald', 169000, NULL, 300, 'BOOK-GGATSBY', books_id, '/assets/images/products/the-great-gatsby-main.jpg', 'ACTIVE', 4.8, 456),
    ('Harry Potter Box Set', 'Complete 7-book collection', 1299000, 1099000, 75, 'BOOK-HPBOXSET', books_id, '/assets/images/products/harry-potter-box-set-main.jpg', 'ACTIVE', 4.9, 567),
    -- Home & Garden
    ('Ceramic Plant Pot', 'Set of 3 decorative plant pots', 459000, 399000, 200, 'POT-CERAMIC3', home_garden_id, '/assets/images/products/ceramic-plant-pot-main.jpg', 'ACTIVE', 4.5, 123),
    ('LED Desk Lamp', 'Adjustable brightness, USB charging port', 659000, 599000, 120, 'LAMP-LEDDESK', home_garden_id, '/assets/images/products/led-desk-lamp-main.jpg', 'ACTIVE', 4.4, 98),
    -- Sports
    ('Yoga Mat', 'Premium non-slip yoga mat, 6mm thickness', 399000, NULL, 180, 'SPORT-YOGAMAT', sports_id, '/assets/images/products/yoga-mat-main.jpg', 'ACTIVE', 4.6, 145),
    ('Running Shoes', 'Lightweight running shoes with cushioning', 1499000, 1299000, 100, 'SHOES-RUNNING', sports_id, '/assets/images/products/running-shoes-main.jpg', 'ACTIVE', 4.7, 189),
    -- Toys & Games
    ('Chess Set', 'Wooden chess set with board', 699000, 629000, 90, 'TOY-CHESSSET', toys_games_id, '/assets/images/products/chess-set-main.jpg', 'ACTIVE', 4.5, 78),
    ('Lego Creator Set', 'Lego building blocks set with 500 pieces', 1199000, NULL, 150, 'TOY-LEGO500', toys_games_id, '/assets/images/products/lego-creator-set-main.jpg', 'ACTIVE', 4.8, 234)
    ON CONFLICT (sku) DO NOTHING;
END $$;

-- Insert Product Images
INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES
((SELECT id FROM products WHERE name = 'iPhone 15 Pro' LIMIT 1), '/assets/images/products/iphone-15-pro-main.jpg', TRUE, 0),
((SELECT id FROM products WHERE name = 'iPhone 15 Pro' LIMIT 1), '/assets/images/products/iphone-15-pro-1.jpg', FALSE, 1),
((SELECT id FROM products WHERE name = 'iPhone 15 Pro' LIMIT 1), '/assets/images/products/iphone-15-pro-2.jpg', FALSE, 2),
((SELECT id FROM products WHERE name = 'iPhone 15 Pro' LIMIT 1), '/assets/images/products/iphone-15-pro-3.jpg', FALSE, 3),
((SELECT id FROM products WHERE name = 'iPhone 15 Pro' LIMIT 1), '/assets/images/products/iphone-15-pro-4.jpg', FALSE, 4),
((SELECT id FROM products WHERE name = 'MacBook Pro 16"' LIMIT 1), '/assets/images/products/macbook-pro-16-main.jpg', TRUE, 0),
((SELECT id FROM products WHERE name = 'MacBook Pro 16"' LIMIT 1), '/assets/images/products/macbook-pro-16-1.jpg', FALSE, 1),
((SELECT id FROM products WHERE name = 'MacBook Pro 16"' LIMIT 1), '/assets/images/products/macbook-pro-16-2.jpg', FALSE, 2),
((SELECT id FROM products WHERE name = 'MacBook Pro 16"' LIMIT 1), '/assets/images/products/macbook-pro-16-3.jpg', FALSE, 3),
((SELECT id FROM products WHERE name = 'MacBook Pro 16"' LIMIT 1), '/assets/images/products/macbook-pro-16-4.jpg', FALSE, 4),
((SELECT id FROM products WHERE name = 'Samsung Galaxy S24 Ultra' LIMIT 1), '/assets/images/products/samsung-galaxy-s24-ultra-main.jpg', TRUE, 0),
((SELECT id FROM products WHERE name = 'Samsung Galaxy S24 Ultra' LIMIT 1), '/assets/images/products/samsung-galaxy-s24-ultra-1.jpg', FALSE, 1),
((SELECT id FROM products WHERE name = 'Samsung Galaxy S24 Ultra' LIMIT 1), '/assets/images/products/samsung-galaxy-s24-ultra-2.jpg', FALSE, 2),
((SELECT id FROM products WHERE name = 'Samsung Galaxy S24 Ultra' LIMIT 1), '/assets/images/products/samsung-galaxy-s24-ultra-3.jpg', FALSE, 3),
((SELECT id FROM products WHERE name = 'Samsung Galaxy S24 Ultra' LIMIT 1), '/assets/images/products/samsung-galaxy-s24-ultra-4.jpg', FALSE, 4),
((SELECT id FROM products WHERE name = 'AirPods Pro 2' LIMIT 1), '/assets/images/products/airpods-pro-2-main.jpg', TRUE, 0),
((SELECT id FROM products WHERE name = 'AirPods Pro 2' LIMIT 1), '/assets/images/products/airpods-pro-2-1.jpg', FALSE, 1),
((SELECT id FROM products WHERE name = 'AirPods Pro 2' LIMIT 1), '/assets/images/products/airpods-pro-2-2.jpg', FALSE, 2),
((SELECT id FROM products WHERE name = 'AirPods Pro 2' LIMIT 1), '/assets/images/products/airpods-pro-2-3.jpg', FALSE, 3),
((SELECT id FROM products WHERE name = 'AirPods Pro 2' LIMIT 1), '/assets/images/products/airpods-pro-2-4.jpg', FALSE, 4),
((SELECT id FROM products WHERE name = 'Sony WH-1000XM5' LIMIT 1), '/assets/images/products/sony-wh-1000xm5-main.jpg', TRUE, 0),
((SELECT id FROM products WHERE name = 'Sony WH-1000XM5' LIMIT 1), '/assets/images/products/sony-wh-1000xm5-1.jpg', FALSE, 1),
((SELECT id FROM products WHERE name = 'Sony WH-1000XM5' LIMIT 1), '/assets/images/products/sony-wh-1000xm5-2.jpg', FALSE, 2),
((SELECT id FROM products WHERE name = 'Sony WH-1000XM5' LIMIT 1), '/assets/images/products/sony-wh-1000xm5-3.jpg', FALSE, 3),
((SELECT id FROM products WHERE name = 'Sony WH-1000XM5' LIMIT 1), '/assets/images/products/sony-wh-1000xm5-4.jpg', FALSE, 4),
((SELECT id FROM products WHERE name = 'Classic White T-Shirt' LIMIT 1), '/assets/images/products/classic-white-t-shirt-main.jpg', TRUE, 0),
((SELECT id FROM products WHERE name = 'Classic White T-Shirt' LIMIT 1), '/assets/images/products/classic-white-t-shirt-1.jpg', FALSE, 1),
((SELECT id FROM products WHERE name = 'Classic White T-Shirt' LIMIT 1), '/assets/images/products/classic-white-t-shirt-2.jpg', FALSE, 2),
((SELECT id FROM products WHERE name = 'Classic White T-Shirt' LIMIT 1), '/assets/images/products/classic-white-t-shirt-3.jpg', FALSE, 3),
((SELECT id FROM products WHERE name = 'Classic White T-Shirt' LIMIT 1), '/assets/images/products/classic-white-t-shirt-4.jpg', FALSE, 4),
((SELECT id FROM products WHERE name = 'Denim Jeans' LIMIT 1), '/assets/images/products/denim-jeans-main.jpg', TRUE, 0),
((SELECT id FROM products WHERE name = 'Denim Jeans' LIMIT 1), '/assets/images/products/denim-jeans-1.jpg', FALSE, 1),
((SELECT id FROM products WHERE name = 'Denim Jeans' LIMIT 1), '/assets/images/products/denim-jeans-2.jpg', FALSE, 2),
((SELECT id FROM products WHERE name = 'Denim Jeans' LIMIT 1), '/assets/images/products/denim-jeans-3.jpg', FALSE, 3),
((SELECT id FROM products WHERE name = 'Denim Jeans' LIMIT 1), '/assets/images/products/denim-jeans-4.jpg', FALSE, 4),
((SELECT id FROM products WHERE name = 'Summer Dress' LIMIT 1), '/assets/images/products/summer-dress-main.jpg', TRUE, 0),
((SELECT id FROM products WHERE name = 'Summer Dress' LIMIT 1), '/assets/images/products/summer-dress-1.jpg', FALSE, 1),
((SELECT id FROM products WHERE name = 'Summer Dress' LIMIT 1), '/assets/images/products/summer-dress-2.jpg', FALSE, 2),
((SELECT id FROM products WHERE name = 'Summer Dress' LIMIT 1), '/assets/images/products/summer-dress-3.jpg', FALSE, 3),
((SELECT id FROM products WHERE name = 'Summer Dress' LIMIT 1), '/assets/images/products/summer-dress-4.jpg', FALSE, 4),
((SELECT id FROM products WHERE name = 'Leather Jacket' LIMIT 1), '/assets/images/products/leather-jacket-main.jpg', TRUE, 0),
((SELECT id FROM products WHERE name = 'Leather Jacket' LIMIT 1), '/assets/images/products/leather-jacket-1.jpg', FALSE, 1),
((SELECT id FROM products WHERE name = 'Leather Jacket' LIMIT 1), '/assets/images/products/leather-jacket-2.jpg', FALSE, 2),
((SELECT id FROM products WHERE name = 'Leather Jacket' LIMIT 1), '/assets/images/products/leather-jacket-3.jpg', FALSE, 3),
((SELECT id FROM products WHERE name = 'Leather Jacket' LIMIT 1), '/assets/images/products/leather-jacket-4.jpg', FALSE, 4),
((SELECT id FROM products WHERE name = 'The Great Gatsby' LIMIT 1), '/assets/images/products/the-great-gatsby-main.jpg', TRUE, 0),
((SELECT id FROM products WHERE name = 'The Great Gatsby' LIMIT 1), '/assets/images/products/the-great-gatsby-1.jpg', FALSE, 1),
((SELECT id FROM products WHERE name = 'The Great Gatsby' LIMIT 1), '/assets/images/products/the-great-gatsby-2.jpg', FALSE, 2),
((SELECT id FROM products WHERE name = 'The Great Gatsby' LIMIT 1), '/assets/images/products/the-great-gatsby-3.jpg', FALSE, 3),
((SELECT id FROM products WHERE name = 'The Great Gatsby' LIMIT 1), '/assets/images/products/the-great-gatsby-4.jpg', FALSE, 4),
((SELECT id FROM products WHERE name = 'Harry Potter Box Set' LIMIT 1), '/assets/images/products/harry-potter-box-set-main.jpg', TRUE, 0),
((SELECT id FROM products WHERE name = 'Harry Potter Box Set' LIMIT 1), '/assets/images/products/harry-potter-box-set-1.jpg', FALSE, 1),
((SELECT id FROM products WHERE name = 'Harry Potter Box Set' LIMIT 1), '/assets/images/products/harry-potter-box-set-2.jpg', FALSE, 2),
((SELECT id FROM products WHERE name = 'Harry Potter Box Set' LIMIT 1), '/assets/images/products/harry-potter-box-set-3.jpg', FALSE, 3),
((SELECT id FROM products WHERE name = 'Harry Potter Box Set' LIMIT 1), '/assets/images/products/harry-potter-box-set-4.jpg', FALSE, 4),
((SELECT id FROM products WHERE name = 'Ceramic Plant Pot' LIMIT 1), '/assets/images/products/ceramic-plant-pot-main.jpg', TRUE, 0),
((SELECT id FROM products WHERE name = 'Ceramic Plant Pot' LIMIT 1), '/assets/images/products/ceramic-plant-pot-1.jpg', FALSE, 1),
((SELECT id FROM products WHERE name = 'Ceramic Plant Pot' LIMIT 1), '/assets/images/products/ceramic-plant-pot-2.jpg', FALSE, 2),
((SELECT id FROM products WHERE name = 'Ceramic Plant Pot' LIMIT 1), '/assets/images/products/ceramic-plant-pot-3.jpg', FALSE, 3),
((SELECT id FROM products WHERE name = 'Ceramic Plant Pot' LIMIT 1), '/assets/images/products/ceramic-plant-pot-4.jpg', FALSE, 4),
((SELECT id FROM products WHERE name = 'LED Desk Lamp' LIMIT 1), '/assets/images/products/led-desk-lamp-main.jpg', TRUE, 0),
((SELECT id FROM products WHERE name = 'LED Desk Lamp' LIMIT 1), '/assets/images/products/led-desk-lamp-1.jpg', FALSE, 1),
((SELECT id FROM products WHERE name = 'LED Desk Lamp' LIMIT 1), '/assets/images/products/led-desk-lamp-2.jpg', FALSE, 2),
((SELECT id FROM products WHERE name = 'LED Desk Lamp' LIMIT 1), '/assets/images/products/led-desk-lamp-3.jpg', FALSE, 3),
((SELECT id FROM products WHERE name = 'LED Desk Lamp' LIMIT 1), '/assets/images/products/led-desk-lamp-4.jpg', FALSE, 4),
((SELECT id FROM products WHERE name = 'Yoga Mat' LIMIT 1), '/assets/images/products/yoga-mat-main.jpg', TRUE, 0),
((SELECT id FROM products WHERE name = 'Yoga Mat' LIMIT 1), '/assets/images/products/yoga-mat-1.jpg', FALSE, 1),
((SELECT id FROM products WHERE name = 'Yoga Mat' LIMIT 1), '/assets/images/products/yoga-mat-2.jpg', FALSE, 2),
((SELECT id FROM products WHERE name = 'Yoga Mat' LIMIT 1), '/assets/images/products/yoga-mat-3.jpg', FALSE, 3),
((SELECT id FROM products WHERE name = 'Yoga Mat' LIMIT 1), '/assets/images/products/yoga-mat-4.jpg', FALSE, 4),
((SELECT id FROM products WHERE name = 'Running Shoes' LIMIT 1), '/assets/images/products/running-shoes-main.jpg', TRUE, 0),
((SELECT id FROM products WHERE name = 'Running Shoes' LIMIT 1), '/assets/images/products/running-shoes-1.jpg', FALSE, 1),
((SELECT id FROM products WHERE name = 'Running Shoes' LIMIT 1), '/assets/images/products/running-shoes-2.jpg', FALSE, 2),
((SELECT id FROM products WHERE name = 'Running Shoes' LIMIT 1), '/assets/images/products/running-shoes-3.jpg', FALSE, 3),
((SELECT id FROM products WHERE name = 'Running Shoes' LIMIT 1), '/assets/images/products/running-shoes-4.jpg', FALSE, 4),
((SELECT id FROM products WHERE name = 'Chess Set' LIMIT 1), '/assets/images/products/chess-set-main.jpg', TRUE, 0),
((SELECT id FROM products WHERE name = 'Chess Set' LIMIT 1), '/assets/images/products/chess-set-1.jpg', FALSE, 1),
((SELECT id FROM products WHERE name = 'Chess Set' LIMIT 1), '/assets/images/products/chess-set-2.jpg', FALSE, 2),
((SELECT id FROM products WHERE name = 'Chess Set' LIMIT 1), '/assets/images/products/chess-set-3.jpg', FALSE, 3),
((SELECT id FROM products WHERE name = 'Chess Set' LIMIT 1), '/assets/images/products/chess-set-4.jpg', FALSE, 4),
((SELECT id FROM products WHERE name = 'Lego Creator Set' LIMIT 1), '/assets/images/products/lego-creator-set-main.jpg', TRUE, 0),
((SELECT id FROM products WHERE name = 'Lego Creator Set' LIMIT 1), '/assets/images/products/lego-creator-set-1.jpg', FALSE, 1),
((SELECT id FROM products WHERE name = 'Lego Creator Set' LIMIT 1), '/assets/images/products/lego-creator-set-2.jpg', FALSE, 2),
((SELECT id FROM products WHERE name = 'Lego Creator Set' LIMIT 1), '/assets/images/products/lego-creator-set-3.jpg', FALSE, 3),
((SELECT id FROM products WHERE name = 'Lego Creator Set' LIMIT 1), '/assets/images/products/lego-creator-set-4.jpg', FALSE, 4)
ON CONFLICT DO NOTHING;

-- Insert Cart Items
INSERT INTO cart_items (user_id, product_id, quantity) VALUES
((SELECT id FROM users WHERE username = 'john_doe' LIMIT 1), (SELECT id FROM products WHERE name = 'iPhone 15 Pro' LIMIT 1), 1),
((SELECT id FROM users WHERE username = 'john_doe' LIMIT 1), (SELECT id FROM products WHERE name = 'AirPods Pro 2' LIMIT 1), 2),
((SELECT id FROM users WHERE username = 'jane_smith' LIMIT 1), (SELECT id FROM products WHERE name = 'Summer Dress' LIMIT 1), 1),
((SELECT id FROM users WHERE username = 'jane_smith' LIMIT 1), (SELECT id FROM products WHERE name = 'Ceramic Plant Pot' LIMIT 1), 3),
((SELECT id FROM users WHERE username = 'mike_wilson' LIMIT 1), (SELECT id FROM products WHERE name = 'MacBook Pro 16"' LIMIT 1), 1)
ON CONFLICT (user_id, product_id) DO NOTHING;

-- Insert Orders
INSERT INTO orders (user_id, order_number, total_amount, shipping_address, shipping_phone, shipping_name, status, payment_method, payment_status, notes) VALUES
((SELECT id FROM users WHERE username = 'john_doe' LIMIT 1), 'ORD-2025-001', 149.98, '456 Main Street, District 1', '0987654321', 'John Doe', 'DELIVERED', 'CREDIT_CARD', 'PAID', 'Please deliver before 5 PM'),
((SELECT id FROM users WHERE username = 'jane_smith' LIMIT 1), 'ORD-2025-002', 79.98, '789 Oak Avenue, District 3', '0912345678', 'Jane Smith', 'SHIPPED', 'PAYPAL', 'PAID', NULL),
((SELECT id FROM users WHERE username = 'mike_wilson' LIMIT 1), 'ORD-2025-003', 2499.99, '321 Pine Road, District 5', '0923456789', 'Mike Wilson', 'PROCESSING', 'CREDIT_CARD', 'PAID', NULL),
((SELECT id FROM users WHERE username = 'sarah_jones' LIMIT 1), 'ORD-2025-004', 124.97, '654 Elm Street, District 7', '0934567890', 'Sarah Jones', 'CONFIRMED', 'BANK_TRANSFER', 'PENDING', 'Will pay after confirmation'),
((SELECT id FROM users WHERE username = 'john_doe' LIMIT 1), 'ORD-2025-005', 49.99, '456 Main Street, District 1', '0987654321', 'John Doe', 'PENDING', 'CREDIT_CARD', 'PENDING', NULL)
ON CONFLICT (order_number) DO NOTHING;

-- Insert Order Items
INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal) VALUES
((SELECT id FROM orders WHERE order_number = 'ORD-2025-001' LIMIT 1), (SELECT id FROM products WHERE name = 'AirPods Pro 2' LIMIT 1), 'AirPods Pro 2', 199.99, 1, 199.99),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-001' LIMIT 1), (SELECT id FROM products WHERE name = 'Running Shoes' LIMIT 1), 'Running Shoes', 79.99, 1, 79.99),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-002' LIMIT 1), (SELECT id FROM products WHERE name = 'Summer Dress' LIMIT 1), 'Summer Dress', 49.99, 1, 49.99),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-002' LIMIT 1), (SELECT id FROM products WHERE name = 'Ceramic Plant Pot' LIMIT 1), 'Ceramic Plant Pot', 19.99, 1, 19.99),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-003' LIMIT 1), (SELECT id FROM products WHERE name = 'MacBook Pro 16"' LIMIT 1), 'MacBook Pro 16"', 2499.99, 1, 2499.99),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-004' LIMIT 1), (SELECT id FROM products WHERE name = 'Chess Set' LIMIT 1), 'Chess Set', 34.99, 2, 69.98),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-004' LIMIT 1), (SELECT id FROM products WHERE name = 'Yoga Mat' LIMIT 1), 'Yoga Mat', 29.99, 1, 29.99);

-- Insert Reviews
INSERT INTO reviews (user_id, product_id, order_id, rating, comment, status) VALUES
((SELECT id FROM users WHERE username = 'john_doe' LIMIT 1), (SELECT id FROM products WHERE name = 'AirPods Pro 2' LIMIT 1), (SELECT id FROM orders WHERE order_number = 'ORD-2025-001' LIMIT 1), 5, 'Amazing sound quality and noise cancellation!', 'APPROVED'),
((SELECT id FROM users WHERE username = 'jane_smith' LIMIT 1), (SELECT id FROM products WHERE name = 'Summer Dress' LIMIT 1), (SELECT id FROM orders WHERE order_number = 'ORD-2025-002' LIMIT 1), 4, 'Beautiful dress, perfect for summer. Fits well.', 'APPROVED'),
((SELECT id FROM users WHERE username = 'mike_wilson' LIMIT 1), (SELECT id FROM products WHERE name = 'MacBook Pro 16"' LIMIT 1), (SELECT id FROM orders WHERE order_number = 'ORD-2025-003' LIMIT 1), 5, 'Powerful machine, handles everything I throw at it. Highly recommend!', 'APPROVED'),
((SELECT id FROM users WHERE username = 'sarah_jones' LIMIT 1), (SELECT id FROM products WHERE name = 'Chess Set' LIMIT 1), (SELECT id FROM orders WHERE order_number = 'ORD-2025-004' LIMIT 1), 4, 'Good quality pieces, board is nice. Great value for money.', 'APPROVED'),
((SELECT id FROM users WHERE username = 'john_doe' LIMIT 1), (SELECT id FROM products WHERE name = 'Running Shoes' LIMIT 1), (SELECT id FROM orders WHERE order_number = 'ORD-2025-001' LIMIT 1), 4, 'Comfortable and lightweight. Good for daily runs.', 'APPROVED'),
((SELECT id FROM users WHERE username = 'jane_smith' LIMIT 1), (SELECT id FROM products WHERE name = 'Ceramic Plant Pot' LIMIT 1), (SELECT id FROM orders WHERE order_number = 'ORD-2025-002' LIMIT 1), 5, 'Love these pots! They look great with my plants.', 'APPROVED'),
((SELECT id FROM users WHERE username = 'mike_wilson' LIMIT 1), (SELECT id FROM products WHERE name = 'iPhone 15 Pro' LIMIT 1), NULL, 5, 'Best phone I''ve ever owned. Camera is incredible!', 'APPROVED'),
((SELECT id FROM users WHERE username = 'sarah_jones' LIMIT 1), (SELECT id FROM products WHERE name = 'Yoga Mat' LIMIT 1), (SELECT id FROM orders WHERE order_number = 'ORD-2025-004' LIMIT 1), 4, 'Good mat, comfortable. Could be thicker but works well.', 'APPROVED')
ON CONFLICT (user_id, product_id, order_id) DO NOTHING;

-- Insert Payments
INSERT INTO payments (order_id, payment_method, transaction_id, amount, status, payment_date) VALUES
((SELECT id FROM orders WHERE order_number = 'ORD-2025-001' LIMIT 1), 'CREDIT_CARD', 'TXN-2025-001', 149.98, 'SUCCESS', '2025-01-10 10:30:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-002' LIMIT 1), 'PAYPAL', 'PP-2025-002', 79.98, 'SUCCESS', '2025-01-10 14:20:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-003' LIMIT 1), 'CREDIT_CARD', 'TXN-2025-003', 2499.99, 'SUCCESS', '2025-01-11 09:15:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-004' LIMIT 1), 'BANK_TRANSFER', NULL, 124.97, 'PENDING', NULL),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-005' LIMIT 1), 'CREDIT_CARD', NULL, 49.99, 'PENDING', NULL)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE users IS 'Store user accounts information';
COMMENT ON TABLE categories IS 'Product categories';
COMMENT ON TABLE products IS 'Product catalog';
COMMENT ON TABLE product_images IS 'Product images gallery';
COMMENT ON TABLE cart_items IS 'Shopping cart items';
COMMENT ON TABLE orders IS 'Customer orders';
COMMENT ON TABLE order_items IS 'Order line items';
COMMENT ON TABLE reviews IS 'Product reviews and ratings';
COMMENT ON TABLE payments IS 'Payment transactions';

-- ============================================
-- PASSWORD INFORMATION
-- ============================================
-- All user passwords are HARDCODED to: 123456
-- BCrypt hash: $2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm
-- This hash is compatible with Spring Security BCryptPasswordEncoder
-- Hash was generated and verified using /api/test/hash endpoint
-- 
-- IMPORTANT: When running this SQL script, all users will have password "123456"
-- 
-- To verify password in Spring Boot:
-- BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
-- boolean matches = encoder.matches("123456", "$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm");
--
-- To update existing users in database, run this UPDATE statement:
-- UPDATE users SET password = '$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm' WHERE password != '$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm';
