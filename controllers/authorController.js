
const Author = require("../models/Author");
const Book = require("../models/Book");


exports.createAuthor = async (req, res) => {
    try {
        const author = await Author.create(req.body);
        res.status(201).json(author);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAuthors = async (req, res) => {
    try {
        const authors = await Author.find();
        res.json(authors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAuthor = async (req, res) => {
    try {
        const author = await Author.findById(req.params.id);
        if (!author) {
            return res.status(404).json({ message: "Author not found" });
        }
        res.json(author);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateAuthor = async (req, res) => {
    try {
        const author = await Author.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!author) {
            return res.status(404).json({ message: "Author not found" });
        }
        res.json(author);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


exports.deleteAuthor = async (req, res) => {
    try {
        const author = await Author.findById(req.params.id);

        if (!author) {
            return res.status(404).json({ message: "Author not found" });
        }

        const hasBooks = await Book.exists({ author: req.params.id });

        if (hasBooks) {
            return res.status(409).json({
                message: "Cannot delete author with existing books"
            });
        }

        await Author.findByIdAndDelete(req.params.id);

        res.json({ message: "Author deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};



exports.getAuthorBooks = async (req, res) => {
    try {
        const author = await Author.findById(req.params.id);

        if (!author) {
            return res.status(404).json({ message: "Author not found" });
        }

        const books = await Book.find({ author: req.params.id });
        res.json(books);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

