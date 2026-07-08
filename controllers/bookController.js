const Book = require('../models/bookModel');
const Author = require('../models/authorModel');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

const BOOK_PAGE_SIZE = 6;

async function fetchBooks(req) {
    const search = req.query.search || '';
    const status = req.query.status || '';
    const { page, limit, offset } = parsePagination(req.query, BOOK_PAGE_SIZE);
    const { rows, total } = await Book.getPaginated({ search, status, page, limit, offset });
    const pagination = buildPaginationMeta(total, page, limit);

    return { books: rows, search, searchQuery: search, statusFilter: status, pagination };
}

exports.listBooks = async (req, res) => {
    try {
        return res.json(await fetchBooks(req));
    } catch (err) {
        return res.status(500).json({ error: 'Could not access the library catalog.' });
    }
};

exports.adminDashboard = async (req, res) => {
    try {
        return res.json(await fetchBooks(req));
    } catch (err) {
        return res.status(500).json({ error: 'Failed loading administrative management dashboard.' });
    }
};

exports.getCreateBook = async (req, res) => {
    try {
        const authors = await Author.getAll();
        return res.json({ authors });
    } catch (err) {
        return res.status(500).json({ error: 'Author dependency retrieval exception.' });
    }
};

exports.postCreateBook = async (req, res) => {
    try {
        const { title, isbn, author_id, publication_year, description, status } = req.body;
        await Book.create({ title, isbn, author_id, publication_year, description, status });

        return res.status(201).json({ message: 'Book added to database inventory ledger successfully.' });
    } catch (err) {
        return res.status(500).json({ error: 'Failed building inventory index node. Verify unique ISBN constraints.' });
    }
};

exports.getEditBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        const authors = await Author.getAll();

        if (!book) {
            return res.status(404).json({ error: 'Requested book item lookup failed inside structural models.' });
        }

        return res.json({ book, authors });
    } catch (err) {
        return res.status(500).json({ error: 'Exception displaying management interface interfaces.' });
    }
};

exports.postEditBook = async (req, res) => {
    try {
        const { title, isbn, author_id, publication_year, description, status } = req.body;
        await Book.update(req.params.id, { title, isbn, author_id, publication_year, description, status });

        return res.json({ message: 'Book modifications saved successfully.' });
    } catch (err) {
        return res.status(500).json({ error: 'Failed database stream update execution.' });
    }
};

exports.deleteBook = async (req, res) => {
    try {
        await Book.delete(req.params.id);
        return res.json({ message: 'Resource book node cleared permanently.' });
    } catch (err) {
        return res.status(500).json({ error: 'Resource cleanup execution error. Book might be tied to borrow logs.' });
    }
};
