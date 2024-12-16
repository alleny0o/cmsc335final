const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion } = require("mongodb");

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = express();

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: false }));

// Middleware to dynamically set baseUrl for templates
app.use((req, res, next) => {
    res.locals.baseUrl = `${req.protocol}://${req.get("host")}`;
    next();
});

// MongoDB Configuration
const user = process.env.MONGO_DB_USERNAME;
const pass = process.env.MONGO_DB_PASSWORD;
const dbname = process.env.MONGO_DB_NAME;
const coll = process.env.MONGO_COLLECTION;

const uri = `mongodb+srv://${user}:${pass}@cluster0.jr7bm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const databaseAndCollection = {
    db: dbname,
    collection: coll,
};

// View Engine
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

// Routes
app.get("/", (req, res) => res.render("index"));

app.get("/searchLevel", (req, res) => res.render("searchLevel"));

app.get("/characterLookup", (req, res) => res.render("lookupPage"));

app.post("/findLevel", async (req, res) => {
    const { levelName } = req.body;

    try {
        const levels = await searchLevel(levelName);

        if (!levels || levels.length === 0) {
            return res.status(404).send("Level not found.");
        }

        const { _id, name, info } = levels[0];
        res.render("questionPage", { _id, name, info });
    } catch (err) {
        console.error("Error finding level:", err);
        res.status(500).send("An error occurred.");
    }
});

app.get("/addLevel", (req, res) => res.render("addLevelPage"));

app.post("/processLevel", async (req, res) => {
    const { name, info } = req.body;

    try {
        await insertLevel({ name, info });
        res.render("addLevelPageComplete", { name, info });
    } catch (err) {
        console.error("Error saving level information:", err);
        res.status(500).send("Error saving level information.");
    }
});

// Server Setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// MongoDB Functions
async function insertLevel(newLevel) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    try {
        await client.connect();
        await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newLevel);
    } finally {
        await client.close();
    }
}

async function searchLevel(levelName) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    try {
        await client.connect();
        const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find({ name: levelName }).toArray();
        return result;
    } finally {
        await client.close();
    }
}
