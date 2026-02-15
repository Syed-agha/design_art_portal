create database design_arts_portal;
use design_arts_portal;
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
select* from admins;
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_order_no VARCHAR(100) NOT NULL UNIQUE,
  product_code VARCHAR(100) NOT NULL UNIQUE,
  current_status ENUM('printing', 'pasting', 'lamination', 'cutting', 'packing', 'dispatch') NOT NULL DEFAULT 'printing',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_orders_admin
    FOREIGN KEY (created_by)
    REFERENCES admins(id)
    ON DELETE RESTRICT
);
select* from orders;
ALTER TABLE orders
MODIFY purchase_order_no VARCHAR(100) NULL,
MODIFY product_code VARCHAR(100) NULL;

CREATE TABLE dispatch_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  dispatch_mode ENUM('van', 'tcs', 'blty') NOT NULL,
  dispatch_datetime DATETIME NOT NULL,
  tracking_number VARCHAR(100) NULL,
  blty_slip_no VARCHAR(100) NULL,

  CONSTRAINT fk_dispatch_order
    FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE
);
select* from dispatch_details;
CREATE INDEX idx_po_no ON orders(purchase_order_no);
CREATE INDEX idx_product_code ON orders(product_code);
