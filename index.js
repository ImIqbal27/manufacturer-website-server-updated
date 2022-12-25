const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, MongoRuntimeError, ObjectId } = require('mongodb');


app.use(cors());
app.use(express.json());
////////////////////////////////////////////////////////////////////////////////////
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v8tde.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
//////////////////////////// JWT ///////////////////////

// function verifyJWT(req, res, next) {
//     const authHeader = req.headers.authorization;
//     if (!authHeader) {
//         return res.status(401).send({ message: 'UnAuthorized access' });
//     }
//     const token = authHeader.split(' ')[1];
//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
//         if (err) {
//             return res.status(403).send({ message: 'Forbidden access' })
//         }
//         req.decoded = decoded;
//         next();
//     });
// }
////////////////////////////////////////////////////////////////////////
async function run() {
    try {
        await client.connect();
        const productCollection = client.db('manufacturer_website').collection('products');
        const orderCollection = client.db('manufacturer_website').collection('orders');
        const userCollection = client.db('manufacturer_website').collection('users');

        /////////////////// get all product/data from mongodb/ api /////////////////////
        app.get('/product', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });
        ///////////  for get single data/product from db on UI ////////////////////////
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productCollection.findOne(query);
            res.send(product);

        });
        ////////////////  order/post data on db by user  ///////////////////////////////////////
        app.post('/order', async (req, res) => {
            const newProduct = req.body;
            const result = await orderCollection.insertOne(newProduct);
            res.send(result);
        });
        ////////////////  order data from db on user/ email based  /////////////////////////////
        app.get('/order', verifyJWT, async (req, res) => {
            const userEmail = req.query.userEmail;
            const decodedEmail = req.decoded.email;
            if (userEmail == decodedEmail) {
                const query = { userEmail: userEmail };
                const orders = await orderCollection.find(query).toArray();
                res.send(orders);
            }
            else {
                return res.status(403).send({ message: 'Forbidden Access ! ! !' });
            }


        });
        /////////////////// put user  //////////////////////////////////////////////////////////
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1000h' })
            res.send({ result, token });
        });
        /////////////////// put admin user  //////////////////////////////////////////////////////////
        // app.put('/user/admin/:email', async (req, res) => {
        //     const email = req.params.email;
        //     const filter = { email: email };
        //     const updateDoc = {
        //         $set: { role: 'admin' },
        //     };
        //     const result = await userCollection.updateOne(filter, updateDoc);
        //     res.send(result);
        // });
        // ///////////////////////  create admin ///////////
        app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await userCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
            else {
                res.status(403).send({ message: 'Forbidden' });
            }
        });
        /////////////////////////// admin ////////////////////////////
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            console.log(user) ;
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin });

        })
        // ///////////////////  get all  user //////////////////////////////////////////////
        app.get('/user', verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        });
        /////////////////////////// /////////////////////////////////////////////////////






















    }
    finally {

    }

}






run().catch(console.dir);








/////////////////////////////////////////////////////////////////////////////////
app.get('/', (req, res) => {
    res.send('Hello Manufacturer Website updated !');
})

app.listen(port, () => {
    console.log(`Manufacturer Website listening on port ${port}`);
})

module.exports = app;