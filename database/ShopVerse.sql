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
    display_order INT DEFAULT 0 NOT NULL,
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
    admin_notes TEXT,
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
('admin', 'admin@shopverse.vn', '$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm', 'Quản trị viên ShopVerse', '0981000000', 'Tầng 10, 123 Phố Huế, Hai Bà Trưng, Hà Nội', 'ADMIN'),
('nguyen_van_anh', 'nguyenvananh@shopverse.vn', '$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm', 'Nguyễn Văn Anh', '0987654321', 'Số 12 Nguyễn Chí Thanh, Đống Đa, Hà Nội', 'USER'),
('tran_thi_lan', 'tranthilan@shopverse.vn', '$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm', 'Trần Thị Lan', '0912345678', 'Số 45 Lạc Long Quân, Tây Hồ, Hà Nội', 'USER'),
('pham_duc_minh', 'phamducminh@shopverse.vn', '$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm', 'Phạm Đức Minh', '0905123456', 'Số 88 Kim Mã, Ba Đình, Hà Nội', 'USER'),
('le_thu_hien', 'lethuhien@shopverse.vn', '$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm', 'Lê Thu Hiền', '0932123456', 'Số 27 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội', 'USER'),
('do_viet_binh', 'dovietbinh@shopverse.vn', '$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm', 'Đỗ Việt Bình', '0973456789', 'Số 60 Nguyễn Trãi, Thanh Xuân, Hà Nội', 'USER'),
('admin_tam_nghi', 'admin.tamnghi@shopverse.vn', '$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm', 'Admin Tạm Nghỉ', '0964567890', 'Số 18 Lê Văn Lương, Thanh Xuân, Hà Nội', 'ADMIN'),
('pham_thu_ha', 'phamthuha@shopverse.vn', '$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm', 'Phạm Thu Hà', '0945678901', 'Số 210 Đội Cấn, Ba Đình, Hà Nội', 'USER'),
('nguyen_thanh_trung', 'nguyenthanhtrung@shopverse.vn', '$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm', 'Nguyễn Thành Trung', '0856789012', 'Số 75 Cầu Giấy, Cầu Giấy, Hà Nội', 'ADMIN'),
('tran_minh_quan', 'tranminhquan@shopverse.vn', '$2a$10$yRqAvl.XyhIsEb5vQK3hBOJ20qRBY0Buh6sFJ62iRNuF0xLrPeJLm', 'Trần Minh Quân', '0837890123', 'Số 32 Giải Phóng, Hai Bà Trưng, Hà Nội', 'USER')
ON CONFLICT (username) DO NOTHING;

-- Insert Categories
INSERT INTO categories (name, description, image_url, display_order) VALUES
('Electronics', 'Electronic devices, gadgets, and accessories', '/assets/images/categories/electronics.jpg', 0),
('Clothing', 'Fashion apparel for men and women', '/assets/images/categories/clothing.jpg', 1),
('Books', 'Books, novels, and educational materials', '/assets/images/categories/books.jpg', 2),
('Home & Garden', 'Home decor and garden supplies', '/assets/images/categories/home-garden.jpg', 3),
('Sports', 'Sports equipment and athletic gear', '/assets/images/categories/sports.jpg', 4),
('Toys & Games', 'Toys, board games, and entertainment', '/assets/images/categories/toys-games.jpg', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert Sub-categories (optional)
DO $$
DECLARE
    electronics_id UUID;
    clothing_id UUID;
BEGIN
    SELECT id INTO electronics_id FROM categories WHERE name = 'Electronics' LIMIT 1;
    SELECT id INTO clothing_id FROM categories WHERE name = 'Clothing' LIMIT 1;
    
    INSERT INTO categories (name, description, parent_id, display_order) VALUES
    ('Smartphones', 'Mobile phones and accessories', electronics_id, 0),
    ('Laptops', 'Laptop computers and accessories', electronics_id, 1),
    ('Men''s Clothing', 'Clothing for men', clothing_id, 0),
    ('Women''s Clothing', 'Clothing for women', clothing_id, 1)
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
((SELECT id FROM users WHERE username = 'nguyen_van_anh' LIMIT 1), (SELECT id FROM products WHERE name = 'iPhone 15 Pro' LIMIT 1), 1),
((SELECT id FROM users WHERE username = 'nguyen_van_anh' LIMIT 1), (SELECT id FROM products WHERE name = 'AirPods Pro 2' LIMIT 1), 2),
((SELECT id FROM users WHERE username = 'tran_thi_lan' LIMIT 1), (SELECT id FROM products WHERE name = 'Summer Dress' LIMIT 1), 1),
((SELECT id FROM users WHERE username = 'tran_thi_lan' LIMIT 1), (SELECT id FROM products WHERE name = 'Ceramic Plant Pot' LIMIT 1), 3),
((SELECT id FROM users WHERE username = 'pham_duc_minh' LIMIT 1), (SELECT id FROM products WHERE name = 'MacBook Pro 16"' LIMIT 1), 1),
((SELECT id FROM users WHERE username = 'do_viet_binh' LIMIT 1), (SELECT id FROM products WHERE name = 'Chess Set' LIMIT 1), 2),
((SELECT id FROM users WHERE username = 'do_viet_binh' LIMIT 1), (SELECT id FROM products WHERE name = 'Yoga Mat' LIMIT 1), 1),
((SELECT id FROM users WHERE username = 'pham_thu_ha' LIMIT 1), (SELECT id FROM products WHERE name = 'Sony WH-1000XM5' LIMIT 1), 1),
((SELECT id FROM users WHERE username = 'nguyen_thanh_trung' LIMIT 1), (SELECT id FROM products WHERE name = 'Samsung Galaxy S24 Ultra' LIMIT 1), 1),
((SELECT id FROM users WHERE username = 'tran_minh_quan' LIMIT 1), (SELECT id FROM products WHERE name = 'Classic White T-Shirt' LIMIT 1), 2),
((SELECT id FROM users WHERE username = 'pham_thu_ha' LIMIT 1), (SELECT id FROM products WHERE name = 'AirPods Pro 2' LIMIT 1), 1)
ON CONFLICT (user_id, product_id) DO NOTHING;

-- Insert Orders
INSERT INTO orders (user_id, order_number, total_amount, shipping_address, shipping_phone, shipping_name, status, payment_method, payment_status, notes, admin_notes) VALUES
((SELECT id FROM users WHERE username = 'nguyen_van_anh' LIMIT 1), 'ORD-2025-001', 6289000, 'Số 12 Nguyễn Chí Thanh, Đống Đa, Hà Nội', '0987654321', 'Nguyễn Văn Anh', 'DELIVERED', 'CREDIT_CARD', 'PAID', 'Vui lòng giao trước 17h', 'Đơn hàng đã giao thành công'),
((SELECT id FROM users WHERE username = 'tran_thi_lan' LIMIT 1), 'ORD-2025-002', 2196000, 'Số 45 Lạc Long Quân, Tây Hồ, Hà Nội', '0912345678', 'Trần Thị Lan', 'SHIPPED', 'PAYPAL', 'PAID', NULL, 'Đang vận chuyển bởi GHN'),
((SELECT id FROM users WHERE username = 'pham_duc_minh' LIMIT 1), 'ORD-2025-003', 69990000, 'Số 88 Kim Mã, Ba Đình, Hà Nội', '0905123456', 'Phạm Đức Minh', 'PROCESSING', 'CREDIT_CARD', 'PAID', NULL, 'Chuẩn bị đóng gói'),
((SELECT id FROM users WHERE username = 'le_thu_hien' LIMIT 1), 'ORD-2025-004', 1657000, 'Số 27 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội', '0932123456', 'Lê Thu Hiền', 'CONFIRMED', 'BANK_TRANSFER', 'PENDING', 'Sẽ thanh toán sau khi xác nhận', 'Khách hẹn chuyển khoản sau'),
((SELECT id FROM users WHERE username = 'nguyen_van_anh' LIMIT 1), 'ORD-2025-005', 1598000, 'Số 12 Nguyễn Chí Thanh, Đống Đa, Hà Nội', '0987654321', 'Nguyễn Văn Anh', 'PENDING', 'CREDIT_CARD', 'PENDING', NULL, 'Khách đang cân nhắc sản phẩm'),
((SELECT id FROM users WHERE username = 'do_viet_binh' LIMIT 1), 'ORD-2025-006', 1428000, 'Số 60 Nguyễn Trãi, Thanh Xuân, Hà Nội', '0973456789', 'Đỗ Việt Bình', 'DELIVERED', 'MOMO', 'PAID', 'Đã thanh toán trước', 'Giao thành công sáng nay'),
((SELECT id FROM users WHERE username = 'pham_thu_ha' LIMIT 1), 'ORD-2025-007', 3990000, 'Số 210 Đội Cấn, Ba Đình, Hà Nội', '0945678901', 'Phạm Thu Hà', 'CANCELLED', 'CREDIT_CARD', 'REFUNDED', 'Khách yêu cầu hủy đơn', 'Đã hoàn tiền cho khách'),
((SELECT id FROM users WHERE username = 'nguyen_thanh_trung' LIMIT 1), 'ORD-2025-008', 7990000, 'Số 75 Cầu Giấy, Cầu Giấy, Hà Nội', '0856789012', 'Nguyễn Thành Trung', 'DELIVERED', 'CREDIT_CARD', 'PAID', 'Đơn ưu tiên giao nhanh', 'Khách đánh giá rất hài lòng'),
((SELECT id FROM users WHERE username = 'tran_minh_quan' LIMIT 1), 'ORD-2025-009', 1099000, 'Số 32 Giải Phóng, Hai Bà Trưng, Hà Nội', '0837890123', 'Trần Minh Quân', 'SHIPPED', 'BANK_TRANSFER', 'PENDING', 'Đã đóng gói, chờ thanh toán', 'Đã nhắc khách thanh toán'),
((SELECT id FROM users WHERE username = 'pham_thu_ha' LIMIT 1), 'ORD-2025-010', 5490000, 'Số 210 Đội Cấn, Ba Đình, Hà Nội', '0945678901', 'Phạm Thu Hà', 'PROCESSING', 'PAYPAL', 'PAID', 'Đơn hàng đặt thêm phụ kiện', 'Chuẩn bị kiểm tra chất lượng')
ON CONFLICT (order_number) DO NOTHING;

-- Insert Order Items
INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal) VALUES
((SELECT id FROM orders WHERE order_number = 'ORD-2025-001' LIMIT 1), (SELECT id FROM products WHERE name = 'AirPods Pro 2' LIMIT 1), 'AirPods Pro 2', 4990000, 1, 4990000),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-001' LIMIT 1), (SELECT id FROM products WHERE name = 'Running Shoes' LIMIT 1), 'Running Shoes', 1299000, 1, 1299000),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-002' LIMIT 1), (SELECT id FROM products WHERE name = 'Summer Dress' LIMIT 1), 'Summer Dress', 999000, 1, 999000),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-002' LIMIT 1), (SELECT id FROM products WHERE name = 'Ceramic Plant Pot' LIMIT 1), 'Ceramic Plant Pot', 399000, 3, 1197000),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-003' LIMIT 1), (SELECT id FROM products WHERE name = 'MacBook Pro 16"' LIMIT 1), 'MacBook Pro 16"', 69990000, 1, 69990000),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-004' LIMIT 1), (SELECT id FROM products WHERE name = 'Chess Set' LIMIT 1), 'Chess Set', 629000, 2, 1258000),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-004' LIMIT 1), (SELECT id FROM products WHERE name = 'Yoga Mat' LIMIT 1), 'Yoga Mat', 399000, 1, 399000),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-006' LIMIT 1), (SELECT id FROM products WHERE name = 'Chess Set' LIMIT 1), 'Chess Set', 629000, 2, 1258000),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-006' LIMIT 1), (SELECT id FROM products WHERE name = 'Yoga Mat' LIMIT 1), 'Yoga Mat', 399000, 1, 399000),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-007' LIMIT 1), (SELECT id FROM products WHERE name = 'Sony WH-1000XM5' LIMIT 1), 'Sony WH-1000XM5', 7990000, 1, 7990000),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-008' LIMIT 1), (SELECT id FROM products WHERE name = 'Samsung Galaxy S24 Ultra' LIMIT 1), 'Samsung Galaxy S24 Ultra', 23990000, 1, 23990000),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-008' LIMIT 1), (SELECT id FROM products WHERE name = 'AirPods Pro 2' LIMIT 1), 'AirPods Pro 2', 4990000, 1, 4990000),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-009' LIMIT 1), (SELECT id FROM products WHERE name = 'Classic White T-Shirt' LIMIT 1), 'Classic White T-Shirt', 299000, 2, 598000),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-010' LIMIT 1), (SELECT id FROM products WHERE name = 'AirPods Pro 2' LIMIT 1), 'AirPods Pro 2', 4990000, 1, 4990000),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-010' LIMIT 1), (SELECT id FROM products WHERE name = 'LED Desk Lamp' LIMIT 1), 'LED Desk Lamp', 599000, 1, 599000);

-- Insert Reviews
INSERT INTO reviews (user_id, product_id, order_id, rating, comment, status) VALUES
((SELECT id FROM users WHERE username = 'nguyen_van_anh' LIMIT 1), (SELECT id FROM products WHERE name = 'AirPods Pro 2' LIMIT 1), (SELECT id FROM orders WHERE order_number = 'ORD-2025-001' LIMIT 1), 5, 'Âm thanh tuyệt vời và chống ồn rất tốt!', 'APPROVED'),
((SELECT id FROM users WHERE username = 'tran_thi_lan' LIMIT 1), (SELECT id FROM products WHERE name = 'Summer Dress' LIMIT 1), (SELECT id FROM orders WHERE order_number = 'ORD-2025-002' LIMIT 1), 4, 'Váy đẹp, mặc mát và vừa vặn với mình.', 'APPROVED'),
((SELECT id FROM users WHERE username = 'pham_duc_minh' LIMIT 1), (SELECT id FROM products WHERE name = 'MacBook Pro 16"' LIMIT 1), (SELECT id FROM orders WHERE order_number = 'ORD-2025-003' LIMIT 1), 5, 'Hiệu năng rất mạnh, xử lý công việc mượt mà.', 'APPROVED'),
((SELECT id FROM users WHERE username = 'le_thu_hien' LIMIT 1), (SELECT id FROM products WHERE name = 'Chess Set' LIMIT 1), (SELECT id FROM orders WHERE order_number = 'ORD-2025-004' LIMIT 1), 4, 'Bộ cờ đẹp, gỗ chắc chắn. Rất đáng mua.', 'APPROVED'),
((SELECT id FROM users WHERE username = 'nguyen_van_anh' LIMIT 1), (SELECT id FROM products WHERE name = 'Running Shoes' LIMIT 1), (SELECT id FROM orders WHERE order_number = 'ORD-2025-001' LIMIT 1), 4, 'Giày nhẹ, chạy êm chân, phù hợp tập luyện hằng ngày.', 'APPROVED'),
((SELECT id FROM users WHERE username = 'tran_thi_lan' LIMIT 1), (SELECT id FROM products WHERE name = 'Ceramic Plant Pot' LIMIT 1), (SELECT id FROM orders WHERE order_number = 'ORD-2025-002' LIMIT 1), 5, 'Chậu sứ rất đẹp, phù hợp với không gian phòng khách.', 'APPROVED'),
((SELECT id FROM users WHERE username = 'pham_duc_minh' LIMIT 1), (SELECT id FROM products WHERE name = 'iPhone 15 Pro' LIMIT 1), NULL, 5, 'Camera quá đẹp, hiệu năng mượt, pin đủ dùng cả ngày.', 'APPROVED'),
((SELECT id FROM users WHERE username = 'le_thu_hien' LIMIT 1), (SELECT id FROM products WHERE name = 'Yoga Mat' LIMIT 1), (SELECT id FROM orders WHERE order_number = 'ORD-2025-004' LIMIT 1), 4, 'Thảm tập êm, bám tốt. Giá hợp lý.', 'APPROVED')
ON CONFLICT (user_id, product_id, order_id) DO NOTHING;

-- Insert Payments
INSERT INTO payments (order_id, payment_method, transaction_id, amount, status, payment_date) VALUES
((SELECT id FROM orders WHERE order_number = 'ORD-2025-001' LIMIT 1), 'CREDIT_CARD', 'TXN-2025-001', 6289000, 'SUCCESS', '2025-01-10 10:30:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-002' LIMIT 1), 'PAYPAL', 'PP-2025-002', 2196000, 'SUCCESS', '2025-01-10 14:20:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-003' LIMIT 1), 'CREDIT_CARD', 'TXN-2025-003', 69990000, 'SUCCESS', '2025-01-11 09:15:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-004' LIMIT 1), 'BANK_TRANSFER', NULL, 0, 'PENDING', NULL),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-005' LIMIT 1), 'CREDIT_CARD', NULL, 0, 'PENDING', NULL),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-006' LIMIT 1), 'MOMO', 'MOMO-2025-006', 1428000, 'SUCCESS', '2025-01-12 08:45:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-007' LIMIT 1), 'CREDIT_CARD', 'TXN-2025-007', 7990000, 'REFUNDED', '2025-01-12 09:20:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-008' LIMIT 1), 'CREDIT_CARD', 'TXN-2025-008', 28980000, 'SUCCESS', '2025-01-12 11:05:00'),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-009' LIMIT 1), 'BANK_TRANSFER', NULL, 0, 'PENDING', NULL),
((SELECT id FROM orders WHERE order_number = 'ORD-2025-010' LIMIT 1), 'PAYPAL', 'PP-2025-010', 5490000, 'SUCCESS', '2025-01-12 15:30:00')
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
