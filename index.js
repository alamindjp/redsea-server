const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { query } = require('express');

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.BD_PASS}@cluster0.v0wrh.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const productCollection = client.db('redsea_ltd').collection('products');
        const bookingCollection = client.db('redsea_ltd').collection('bookings');

        app.get('/product', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productCollection.findOne(query);
            res.send(product)
        });
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { bookingId:booking.bookingId, bookingName:booking.bookingName, consumerEmail:booking.consumerEmail}
            const exists = await bookingCollection.findOne(query)
            if (exists) {
                return res.send({success: false,booking:exists})
            }
            const result = await bookingCollection.insertOne(booking);
           return res.send({success: true, result});
        });
    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Welcome to RedSea website!')
});

app.listen(port, () => {
    console.log(`RedSea App listening on port ${port}`)
});