CREATE TABLE IF NOT EXISTS token_prices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    token_address VARCHAR(255) NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token_timestamp (token_address, timestamp)
); 