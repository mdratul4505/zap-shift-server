const express = require('express')
const cors = require("cors");
const app = express()
require('dotenv').config()
const { MongoClient, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000
const stripe = require('stripe')(process.env.STRIPE_SECRET);

// middle ware
app.use(express.json())
app.use(cors()); 






const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mj89i6p.mongodb.net/?appName=Cluster0`;

// Create a new MongoClient
const client = new MongoClient(uri);

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db('zap_shift_db')
    const parcelCollection = db.collection('parcels')
    // parcel api
    
    app.get('/parcels', async (req, res) =>{
      const query = {};

      const {email} = req.query
      if(email){
        query.SenderEmail = email;
      }

      const options = {sort : {createAt: -1 }}
      const cursor = parcelCollection.find(query , options)
      const result = await cursor.toArray();
      res.send(result)
    })

    // payment parcel api
    app.get('/parcels/:id', async (req, res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await parcelCollection.findOne(query);
      res.send(result )
    })

    app.post('/parcels', async (req, res)=>{
      const parcel  = req.body;
      parcel.createAt = new Date();
      const result = await parcelCollection.insertOne(parcel)
      res.send(result)
    })


    app.delete('/parcels/:id' , async (req , res) =>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await parcelCollection.deleteOne(query)
      res.send(result)
    })








    // payment related apis
    app.post('/create-checkout-session', async (req , res) =>{
      const paymentInfo = req.body;
      const amount = parseInt(paymentInfo.cost) * 100;

      const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        // Provide the exact Price ID (for example, price_1234) of the product you want to sell
        price_data:{
          currency:'USD',
          unit_amount: amount,
          product_data:{
            name: paymentInfo.parcelName
          }

        },
        
        quantity: 1,
      },
    ],
    customer_email: paymentInfo.SenderEmail,
    mode: 'payment',
    metadata:{
      parcelId: paymentInfo.parcelId
    },
    success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-succes`,
    cancel_url: `${process.env.SITE_DOMAIN}/dashboard/payment-cancelled`,
  })
  console.log(session)
  res.send({url:session.url})
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
  res.send('Zap is shifting shifting!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
