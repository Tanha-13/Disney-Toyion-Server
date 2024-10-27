const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//middleware
app.use(cors());
app.use(express.json());

//mongoDB connection

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2twmdg3.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const toysCollection = client.db("toys").collection("toysCollection");


    //get data for all toys page using pagination
    app.get("/allToys", async (req, res) => {
      const page = parseInt(req.query.page) || 0;
      const limit = parseInt(req.query.limit) || 20;
      const skip = page * limit;
      const result = await toysCollection
        .find()
        .skip(skip)
        .limit(limit)
        .toArray();
      res.send(result);
    });
    
    //total toys count
    app.get("/totalToys", async (req, res) => {
      const result = await toysCollection.estimatedDocumentCount();
      res.send({ totalToys: result });
    });
    app.get("/featuredToys", async (req, res) => {
      const result = await toysCollection.find().sort({price:-1}).limit(4).toArray();
      res.send(result); 
    })

    // get data per user and sort data in ascending and descending
    app.get("/myToys", async (req, res) => {
      const email = req.query.email;
      const sortToy = req.query.sortToy;
      let query = { sellerEmail: email };
      if (sortToy === "ascending") {
        const result = await toysCollection.find(query).sort({ price: 1 }).toArray();
        res.send(result);
      } else if (sortToy === "descending") {
        const result = await toysCollection.find(query).sort({ price: -1 }).toArray();
        res.send(result);
      } else {
        const result = await toysCollection.find(query).toArray();
        res.send(result);
      }
    });


    // get data for toyName property for search field
    app.get("/searchToys/:search", async (req, res) => {
      const search = req.params.search;
      console.log(search);
      const query = {
        toyName: { $regex: search, $options: "i" },
      };
      const result = await toysCollection.find(query).toArray();
      res.send(result);
    });

    // get category wise upto 3 data
    app.get("/shopByCategory/:category", async (req, res) => {
      let query = {};
      if (req.params?.category) {
        query = { category: req.params.category };
      }
      const result = await toysCollection.find(query).limit(3).toArray();
      res.send(result);
    });

    // get data for update toy details
    app.get("/updateToy/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.findOne(query);
      res.send(result);
    });
    
    // get data for toy details
    app.get('/viewDetails/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.findOne(query);
      res.send(result);
    })

    // receive data from client side, send them to server and send response to client
    app.post("/addToys", async (req, res) => {
      const toys = req.body;
      toys.createdAt = new Date();
      const result = await toysCollection.insertOne(toys);
      res.send(result);
    });

    // update data 
    app.put("/updateToy/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedToy = req.body;
      const toy = {
        $set: {
          toyName: updatedToy.toyName,
          photo: updatedToy.photo,
          price: updatedToy.price,
          quantity: updatedToy.quantity,
          category: updatedToy.category,
          rating: updatedToy.rating,
          description: updatedToy.description,
        },
      };
      const result = await toysCollection.updateOne(query, toy, options);
      res.send(result);
    });


    // delete any data
    app.delete("/myToys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server for disney toyion is running");
});
app.listen(port, () => {
  console.log(`server is running on ${port}`);
});
