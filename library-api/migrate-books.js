const dns = require('node:dns');

dns.setServers(['172.20.10.1']);

require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
    dbName: 'library_db'
})
.then(async () => {
    console.log('Connected to MongoDB Atlas');

    const booksCollection = mongoose.connection.collection('books');

    const oldBooks = await booksCollection
        .find({
            _id: {
                $in: [1, 2, 3, 4, 5]
            }
        })
        .toArray();

    console.log(`Found ${oldBooks.length} old books`);

    for (const oldBook of oldBooks) {
        const newBook = {
            title: oldBook.title,
            author: oldBook.author,
            year: oldBook.year,
            genre: oldBook.genre,
            available: oldBook.available,
            __v: oldBook.__v || 0
        };

        const result = await booksCollection.insertOne(newBook);

        await booksCollection.deleteOne({
            _id: oldBook._id
        });

        console.log(
            `Migrated "${oldBook.title}" -> ${result.insertedId}`
        );
    }

    console.log('Migration completed successfully');

    await mongoose.disconnect();
})
.catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
});