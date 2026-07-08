const BorrowRecord = require('../models/borrowModel');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

const RECORD_PAGE_SIZE = 10;

exports.borrowBook = async (req, res) => {
    try {
        const user_id = req.user.id;
        const book_id = req.body.book_id;

        await BorrowRecord.create({ user_id, book_id });
        return res.status(201).json({ message: 'Checkout sequence completed successfully!' });
    } catch (err) {
        return res.status(400).json({ error: err.message || 'Transactional checkout error.' });
    }
};

exports.returnBook = async (req, res) => {
    try {
        const recordId = req.params.id;
        await BorrowRecord.returnBook(recordId);
        return res.json({ message: 'Book processed back into available library stock.' });
    } catch (err) {
        return res.status(400).json({ error: err.message || 'Return operation sequence interrupted.' });
    }
};

exports.viewUserHistory = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { page, limit, offset } = parsePagination(req.query, RECORD_PAGE_SIZE);
        const { rows, total } = await BorrowRecord.getHistoryByUser(user_id, { limit, offset });
        const pagination = buildPaginationMeta(total, page, limit);

        return res.json({ records: rows, pagination });
    } catch (err) {
        return res.status(500).json({ error: 'Archive streaming failed.' });
    }
};

exports.viewAllRecords = async (req, res) => {
    try {
        const { page, limit, offset } = parsePagination(req.query, RECORD_PAGE_SIZE);
        const { rows, total } = await BorrowRecord.getAllRecords({ limit, offset });
        const pagination = buildPaginationMeta(total, page, limit);

        return res.json({ records: rows, pagination });
    } catch (err) {
        return res.status(500).json({ error: 'Audit array retrieval exception.' });
    }
};
