const mongoose = require("mongoose");

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
        const { genre, author, minPrice, maxPrice, search, sort, order } = req.query;
        const filter = {};

        // Filter by genre
        if (genre) {
            filter.genre = new RegExp(genre.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        }

        // Filter by author
        if (author) {
            if (!mongoose.isValidObjectId(author)) {
                return res.status(400).json({ message: "Invalid author ID" });
            }
            filter.author = author;
        }

        // Validate price filters
        if ([minPrice, maxPrice].some(value =>
            value !== undefined && (String(value).trim() === "" ||
                !Number.isFinite(Number(value)) || Number(value) < 0)
        )) {
            return res.status(400).json({ message: "Invalid price filter" });
        }

        if (minPrice !== undefined && maxPrice !== undefined &&
            Number(minPrice) > Number(maxPrice)) {
            return res.status(400).json({
                message: "minPrice cannot be greater than maxPrice"
            });
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
            if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
        }

        // Search by title
        if (search) {
            filter.title = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        }

        // Sort results
        const allowedSort = ["price", "title", "publishedYear"];

        if (sort && !allowedSort.includes(sort)) {
            return res.status(400).json({ message: "Invalid sort field" });
        }

        if (order && !["asc", "desc"].includes(order)) {
            return res.status(400).json({ message: "Invalid sort order" });
        }

        const sortOption = sort ? { [sort]: order === "desc" ? -1 : 1 } : {};


        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 10);

        if (!Number.isInteger(page) || page < 1 ||
            !Number.isInteger(limit) || limit < 1) {
            return res.status(400).json({
                message: "Page and limit must be positive integers"
            });
        }

        const total = await Book.countDocuments(filter);

        const books = await Book.find(filter)
            .populate("author")
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({ page, limit, total, results: books });

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
