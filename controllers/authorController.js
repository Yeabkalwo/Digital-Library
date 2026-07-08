const Author = require('../models/authorModel');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

const AUTHOR_PAGE_SIZE = 6;

exports.listAuthors = async (req, res) => {
    try {
        const { page, limit, offset } = parsePagination(req.query, AUTHOR_PAGE_SIZE);
        const { rows, total } = await Author.getPaginated({ page, limit, offset });
        const pagination = buildPaginationMeta(total, page, limit);

        return res.json({ authors: rows, pagination });
    } catch (err) {
        return res.status(500).json({ error: 'Could not open index reference arrays.' });
    }
};

exports.postCreateAuthor = async (req, res) => {
    try {
        const { name, biography, birth_year, nationality } = req.body;
        await Author.create({ name, biography, birth_year, nationality });
        return res.status(201).json({ message: 'Author signature saved.' });
    } catch (err) {
        return res.status(500).json({ error: 'Structural compilation error.' });
    }
};

exports.getEditAuthor = async (req, res) => {
    try {
        const author = await Author.findById(req.params.id);
        if (!author) {
            return res.status(404).json({ error: 'Author reference missing.' });
        }
        return res.json({ author });
    } catch (err) {
        return res.status(500).json({ error: 'Rendering exception caught.' });
    }
};

exports.postEditAuthor = async (req, res) => {
    try {
        const { name, biography, birth_year, nationality } = req.body;
        await Author.update(req.params.id, { name, biography, birth_year, nationality });
        return res.json({ message: 'Biographical datasets successfully modified.' });
    } catch (err) {
        return res.status(500).json({ error: 'Database submission rejection failure.' });
    }
};

exports.deleteAuthor = async (req, res) => {
    try {
        await Author.delete(req.params.id);
        return res.json({ message: 'Author node cleared cleanly.' });
    } catch (err) {
        return res.status(500).json({ error: 'Deletion integrity blockade violation.' });
    }
};
