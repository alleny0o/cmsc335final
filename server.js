const path = require("path");
const fs = require("fs");
const express = require("express");
const app = express(); 
app.use('/static', express.static('css'));

const bodyParser = require("body-parser");

require("dotenv").config({ path: path.resolve(__dirname, '.env') }) 

let user = process.env.MONGO_DB_USERNAME;
let pass = process.env.MONGO_DB_PASSWORD;
let dbname = process.env.MONGO_DB_NAME;
let coll = process.env.MONGO_COLLECTION;

let uri = `mongodb+srv://${user}:${pass}@cluster0.jr7bm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
// console.log(uri);
const databaseAndCollection = {
    db: dbname,
    collection: coll,
};

const { MongoClient, ServerApiVersion } = require('mongodb');

if (process.argv.length != 3) {
    process.stdout.write(`Usage ${process.argv[1]} PortNumber`);
    process.exit(1);
  }
const portNumber = process.argv[2];

console.log(`web server started running at: http://localhost:${portNumber}`);
process.stdin.setEncoding("utf8");

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:false}))

app.get("/", (request, response) => {
    const variables = {
        port: portNumber
    }
    response.render("index",variables);
});

app.get("/searchLevel", (request, response) => {
    const variables = {
        port: portNumber
    }
    response.render("searchLevel",variables);
});

app.get("/characterLookup", (request, response) => {
    const variables = {
        port: portNumber
    }
    response.render("lookupPage",variables);
});
app.post("/findLevel", async (request, response) => {
    let { levelName } = request.body;

    try {
        let levels = await searchLevel(levelName);

        if (!levels || levels.length === 0) {
            return response.status(404).send("Level not found.");
        }

        let { _id, name, info } = levels[0];

        response.render("questionPage", {_id, name, info });
    } catch (error) {
        console.error("Error finding level:", error);
        response.status(500).send("An error occurred.");
    }
});


app.get("/addLevel", (request, response) => {
    const variables = {
        port: portNumber
    }
    response.render("addLevelPage",variables);
});


app.post("/processLevel", async (request, response) => {
    let {name, info } = request.body;
    let level = {name, info };
    try{
        await insertLevel(level);
        response.render("addLevelPageComplete",{name, info });
    }   catch (err) {
        console.error(err);
        response.status(500).send("Error saving level information.");
   }
});
app.listen(portNumber);

const prompt = "Type stop to shutdown the server: ";


process.stdout.write(prompt);
process.stdin.on("readable", function () {
    const dataInput = process.stdin.read();
    if (dataInput !== null) {
        const command = dataInput.trim();
        if (command === "stop") {
            process.stdout.write(`shutting down the server`);
            process.exit(0);
        } else {
            process.stdout.write(`invalid command: ${command}\n`);
        }
        process.stdout.write(prompt);
        process.stdin.resume();
    }
});

async function insertLevel(newLevel) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })
    try {
        await client.connect();
        const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newLevel);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

async function searchLevel(levelName) {
    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverApi: ServerApiVersion.v1,
    });

    try {

        await client.connect();

        const result = await client
            .db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .find({ name: levelName }) 
            .toArray();

        if (result.length === 0) {
            console.log(`No level found with the name "${levelName}"`);
            return null;
        }
        //console.log("Search results:", result);

        return result;
    } catch (e) {
        console.error("Error occurred while searching for level:", e);
        throw e;
    } finally {
        await client.close();
    }
}