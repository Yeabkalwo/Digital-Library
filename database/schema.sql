DROP TABLE IF EXISTS borrow_records CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS authors CASCADE;
DROP TABLE IF EXISTS admin_requests CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_requests (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message TEXT,
    reviewed_by INT NULL REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE authors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    biography TEXT,
    birth_year INT,
    nationality VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    isbn VARCHAR(50) UNIQUE NOT NULL,
    author_id INT NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    publication_year INT,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'reserved')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE borrow_records (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    borrow_date TIMESTAMP NOT NULL DEFAULT NOW(),
    return_date TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned'))
);

INSERT INTO authors (name, biography, birth_year, nationality) VALUES
('J.K. Rowling', 'British author best known for the Harry Potter series.', 1965, 'British'),
('George R.R. Martin', 'American author best known for A Song of Ice and Fire.', 1948, 'American'),
('J.R.R. Tolkien', 'English writer and academic, author of The Lord of the Rings.', 1892, 'British'),
('Brandon Sanderson', 'Epic fantasy author renowned for the Cosmere universe and finishing The Wheel of Time.', 1975, 'American'),
('Guiltythree', 'Online web novelist best known for the internationally acclaimed dark fantasy web novel Shadow Slave.', 1994, 'International'),
('Frank Herbert', 'Acclaimed science fiction author who created the groundbreaking and complex Dune saga.', 1920, 'American'),
('Andrzej Sapkowski', 'Polish fantasy writer best known for his book series, The Witcher.', 1948, 'Polish'),
('Rebecca Yarros', 'Contemporary American fantasy author known for the bestselling Empyrean dragon-rider series.', 1981, 'American');

INSERT INTO books (title, isbn, author_id, publication_year, description, status) VALUES
('Harry Potter and the Sorcerer''s Stone', '9780590353427', 1, 1997, 'The first novel in the Harry Potter series.', 'available'),
('A Game of Thrones', '9780553103540', 2, 1996, 'The first novel in A Song of Ice and Fire.', 'available'),
('The Hobbit', '9780048231888', 3, 1937, 'A legendary fantasy novel.', 'borrowed'),
('The Way of Kings', '9780765326355', 4, 2010, 'Book one of the Stormlight Archive. An epic masterpiece set on the shattered, storm-torn world of Roshar.', 'available'),
('Words of Radiance', '9780765326362', 4, 2014, 'Book two of the Stormlight Archive. The Knights Radiant begin to gather as the Everstorm looms.', 'available'),
('Oathbringer', '9780765326379', 4, 2017, 'Book three of the Stormlight Archive. Dalinar Kholin faces the dark secrets of his past while trying to unite Roshar.', 'borrowed'),
('Rhythm of War', '9780765326386', 4, 2020, 'Book four of the Stormlight Archive. Technological innovations and an occupation of the tower city Urithiru change the war.', 'available'),
('Wind and Truth', '9781250319180', 4, 2024, 'Book five of the Stormlight Archive. The dramatic conclusion to the first main story arc of the Cosmere epic.', 'reserved'),
('Shadow Slave: The First Nightmare', '9781234567890', 5, 2022, 'Volume 1 of the web novel series. Follows Sunny as he awakens to the Nightmare Spell in a brutal magical world.', 'available'),
('Shadow Slave: The Forgotten Shore', '9781234567891', 5, 2023, 'Volume 2. Trapped in a cursed, ruined land, Sunny and his companions fight desperate battles against ancient terrors.', 'available'),
('Dune', '9780441172719', 6, 1965, 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, who would become the mysterious Muad''Dib.', 'available'),
('The Last Wish', '9780316029186', 7, 1993, 'Introducing Geralt of Rivia—a Witcher, a sorcerous assassin holding the line against monsters.', 'borrowed'),
('Fourth Wing', '9781649374042', 8, 2023, 'Enter the brutal world of a military college for dragon riders, where graduation means survival or death.', 'available');
