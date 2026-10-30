const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Book title is required'],
        trim: true
    },

   author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author',
    required: [true, 'Author is required']
    },

    year: {
        type: Number,
        required: [true, 'Year is required'],
        min: [0, 'Year cannot be negative'],
        max: [new Date().getFullYear(), 'Year cannot be in the future']
    },

    genre: {
        type: String,
        required: [true, 'Genre is required'],
        trim: true
    },

    available: {
        type: Boolean,
        default: true
    }
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;