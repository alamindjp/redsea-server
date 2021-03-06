const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { query } = require('express');

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.BD_PASS}@cluster0.v0wrh.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        };
        req.decoded = decoded;
        next()
    })

}

async function run() {
    try {
        await client.connect();
        const productCollection = client.db('redsea_ltd').collection('products');
        const bookingCollection = client.db('redsea_ltd').collection('bookings');
        const userCollection = client.db('redsea_ltd').collection('users');
        const reviewCollection = client.db('redsea_ltd').collection('reviews');

        app.get('/product', async (req, res) => {
            const query = {};
            const products = await productCollection.find(query).toArray();
            res.send(products);
        });
        app.post('/product', verifyJWT, async (req, res) => {
            const product = req.body;
            const query = { name: product.name };
            const exists = await productCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, product: exists });
            }
            const result = await productCollection.insertOne(product);
            return res.send({ success: true, result });
        });
        app.delete('/product/delete/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(filter);
            res.send({ success: true, result });
        });
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const product = await productCollection.findOne(filter);
            res.send(product);
        });
        app.get('/booking/all', verifyJWT, async (req, res) => {
            const allBooking = await bookingCollection.find().toArray();
            res.send(allBooking);
        });

        app.get('/booking', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email === decodedEmail) {
                const query = { consumerEmail: email };
                const bookings = await bookingCollection.find(query).toArray();
                return res.send(bookings);
            }
            else {
                return res.status(403).send({ message: 'forbidden access' })
            }
        });
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { bookingId: booking.bookingId, bookingName: booking.bookingName, consumerEmail: booking.consumerEmail };
            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists });
            }
            const result = await bookingCollection.insertOne(booking);
            return res.send({ success: true, result });
        });
        app.get('/user', verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray()
            res.send(users);
        });
        app.get('/user/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await userCollection.findOne(query)
            res.send(user);
        });
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true, };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, this.process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token })
        });


        app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const adminRequester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: adminRequester });
            if (requesterAccount.role === 'admin') {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await userCollection.updateOne(filter, updateDoc);
                res.send(result)
            }
            else {
                res.status(403).send({ message: 'Forbidden' });
            }
        });
        app.get('/review', async (req, res) => {
            const review = await reviewCollection.find().toArray();
            res.send(review);
        });
        app.post('/review', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            return res.send(result);
        });




        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email })
            const isAdmin = user.role === 'admin';
            res.send(isAdmin)
        });
        app.get('/role/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email })
            const isUser = user.role === 'user';
            res.send(isUser)
        });

    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Welcome to RedSea website! thanks for visiting')
});

app.listen(port, () => {
    console.log(`RedSea App listening on port ${port}`)
});