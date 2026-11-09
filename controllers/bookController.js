
const Book = require("../models/Book");
const Author = require("../models/Author");


const validateBook = (data) => {
    if (data.price !== undefined &&
        (data.price === null || typeof data.price !== "number" ||
            !Number.isFinite(data.price) || data.price <= 0)) {
        return "Price must be greater than zero";
    }

    if (data.publishedYear !== undefined &&
        (data.publishedYear === null ||
            !Number.isInteger(data.publishedYear) ||
            data.publishedYear < 1450 ||
            data.publishedYear > new Date().getFullYear())) {
        return "Publication year must be between 1450 and the current year";
    }

    return null;
};


exports.createBook = async (req, res) => {
    try {
        const error = validateBook(req.body);

        if (error) {
            return res.status(422).json({ message: error });
        }
        const { title, author } = req.body;

        const authorExists = await Author.findById(author);
        if (!authorExists) {
            return res.status(400).json({ message: "Author does not exist" });
        }

        const duplicate = await Book.findOne({
            author,
            title: { $regex: `^${title}$`, $options: "i" }
        });

        if (duplicate) {
            return res.status(409).json({ message: "Book title already exists for this author" });
        }

        const book = await Book.create(req.body);
        res.status(201).json(book);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


exports.getBooks = async (req, res) => {
    try {
        const books = await Book.find().populate("author");
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id).populate("author");
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }
        res.json(book);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


exports.updateBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }

        const error = validateBook(req.body);

        if (error) {
            return res.status(422).json({ message: error });
        }

        const author = req.body.author || book.author;
        const title = req.body.title || book.title;

        const authorExists = await Author.findById(author);
        if (!authorExists) {
            return res.status(400).json({ message: "Author does not exist" });
        }

        const duplicate = await Book.findOne({
            author,
            title: { $regex: `^${title}$`, $options: "i" },
            _id: { $ne: book._id }
        });

        if (duplicate) {
            return res.status(409).json({ message: "Book title already exists for this author" });
        }

        const updatedBook = await Book.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json(updatedBook);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


exports.deleteBook = async (req, res) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }
        res.json({ message: "Book deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
