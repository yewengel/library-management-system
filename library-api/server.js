const dns = require('node:dns');

if (process.env.NODE_ENV !== 'production') {
    dns.setServers(['172.20.10.1']);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Book = require('./models/Book');
const Author = require('./models/Author');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
    dbName: 'library_db'
})
    .then(() => {
        console.log('Connected to MongoDB Atlas - library_db');
    })
    .catch((err) => {
        console.log('MongoDB connection error:', err.message);
    });

app.use((req, res, next) => {
    const timestamp = new Date().toISOString();

    console.log(
        `[${timestamp}] ${req.method} ${req.url}`
    );

    next();
});


function isLibrarian(req, res, next) {
    if (!req.query.role) {
        return res.status(401).json({
            error: "Authentication required"
        });
    }

    if (req.query.role !== "librarian") {
        return res.status(403).json({
            error: "Access denied. Librarian only"
        });
    }

    next();
}


app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            error: 'Username and password are required'
        });
    }

    if (
        username === process.env.LIBRARIAN_USERNAME &&
        password === process.env.LIBRARIAN_PASSWORD
    ) {
        return res.status(200).json({
            message: 'Login successful',
            username: username,
            role: 'librarian'
        });
    }

    return res.status(401).json({
        error: 'Invalid username or password'
    });
});

app.get('/api/books', async (req, res) => {
    try {
        const filter = {};

        if (req.query.genre) {
            filter.genre = req.query.genre;
        }

        if (req.query.available !== undefined) {
            if (!['true', 'false'].includes(req.query.available)) {
                return res.status(400).json({
                    error: "Invalid available value. Use true or false"
                });
            }

            filter.available = req.query.available === 'true';
        }

        const books = await Book.find(filter)
            .populate('author');

        return res.status(200).json(books);

    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
});

app.get('/api/books/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id)
            .populate('author');

        if (!book) {
            return res.status(404).json({
                error: "Book not found"
            });
        }

        return res.status(200).json(book);

    } catch (error) {
        return res.status(400).json({
            error: "Invalid book ID"
        });
    }
});

app.post('/api/books', isLibrarian, async (req, res) => {
    try {
        const {
            title,
            author,
            year,
            genre,
            available
        } = req.body;

        const newBook = await Book.create({
            title,
            author,
            year,
            genre,
            available
        });

        res.location(`/api/books/${newBook._id}`);

        return res.status(201).json(newBook);

    } catch (error) {
        return res.status(400).json({
            error: error.message
        });
    }
});


app.put('/api/books/:id', isLibrarian, async (req, res) => {
    try {
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({
                error: "Provide at least one field to update"
            });
        }

        const updatedBook = await Book.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedBook) {
            return res.status(404).json({
                error: "Book not found"
            });
        }

        return res.status(200).json(updatedBook);

    } catch (error) {
        return res.status(400).json({
            error: error.message
        });
    }
});


app.put('/api/books/:id/borrow', isLibrarian, async (req, res) => {
    try {
        console.log("Borrow request ID:", req.params.id);

        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({
                error: "Book not found"
            });
        }

        if (!book.available) {
            return res.status(400).json({
                error: "Book is already borrowed"
            });
        }

        book.available = false;

        await book.save();

        return res.status(200).json({
            message: "Book borrowed successfully",
            book
        });

    } catch (error) {
        console.log("Borrow error:", error.message);

        return res.status(400).json({
            error: "Invalid book ID"
        });
    }
});

app.put('/api/books/:id/return', isLibrarian, async (req, res) => {
    try {
        console.log("Return request ID:", req.params.id);

        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({
                error: "Book not found"
            });
        }

        if (book.available) {
            return res.status(400).json({
                error: "Book is already available"
            });
        }

        book.available = true;

        await book.save();

        return res.status(200).json({
            message: "Book returned successfully",
            book
        });

    } catch (error) {
        console.log("Return error:", error.message);

        return res.status(400).json({
            error: "Invalid book ID"
        });
    }
});

app.delete('/api/books/:id', isLibrarian, async (req, res) => {
    try {
        const deletedBook = await Book.findByIdAndDelete(
            req.params.id
        );

        if (!deletedBook) {
            return res.status(404).json({
                error: "Book not found"
            });
        }

        return res.status(204).send();

    } catch (error) {
        return res.status(400).json({
            error: "Invalid book ID"
        });
    }
});

app.get('/api/authors', async (req, res) => {
    try {
        const authors = await Author.find();

        return res.status(200).json(authors);

    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
});

app.post('/api/authors', isLibrarian, async (req, res) => {
    try {
        if (!req.body.name || !req.body.name.trim()) {
            return res.status(400).json({
                error: "Author name is required"
            });
        }

        const author = await Author.create({
            name: req.body.name.trim()
        });

        return res.status(201).json(author);

    } catch (error) {
        return res.status(400).json({
            error: error.message
        });
    }
});

app.put('/api/authors/:id', isLibrarian, async (req, res) => {
    try {
        if (!req.body.name || !req.body.name.trim()) {
            return res.status(400).json({
                error: "Author name is required"
            });
        }

        const updatedAuthor = await Author.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name.trim()
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedAuthor) {
            return res.status(404).json({
                error: "Author not found"
            });
        }

        return res.status(200).json(updatedAuthor);

    } catch (error) {
        return res.status(400).json({
            error: error.message
        });
    }
});

app.delete('/api/authors/:id', isLibrarian, async (req, res) => {
    try {
        const author = await Author.findById(req.params.id);

        if (!author) {
            return res.status(404).json({
                error: "Author not found"
            });
        }

        const booksByAuthor = await Book.countDocuments({
            author: req.params.id
        });

        if (booksByAuthor > 0) {
            return res.status(400).json({
                error: `Cannot delete ${author.name}. This author has ${booksByAuthor} book(s) assigned to them.`
            });
        }

        await Author.findByIdAndDelete(req.params.id);

        return res.status(204).send();

    } catch (error) {
        return res.status(400).json({
            error: "Invalid author ID"
        });
    }
});

app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.url}`
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(
        `Library API running on http://localhost:${PORT}`
    );
});