// VARIABLE ENV
require('dotenv').config()

// IMPORT DES DATAS
const users = require("../data/users");
const stations = require("../data/stations");
const mesures = require("../data/mesures");

// MONGO ===
const MONGO_URI = process.env.MONGO_URI;
const { MongoClient } = require('mongodb');

// Connection URL
const client = new MongoClient(MONGO_URI);

// Database Name
const dbName = 'fablab-meteo';



async function main() {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const userCollection = db.collection('users');
    const stationCollection = db.collection('stations');
    const mesureCollection = db.collection('mesures');

    // the following code examples can be pasted here...

    const generateUserCollection = () => users.length > 0 ? userCollection.insertMany(users.map(user => { return { ...user, 'createdAt': new Date() } })) : null;
    const generateStationCollection = () => stations.length > 0 ? stationCollection.insertMany(stations) : null;
    const generateMesureCollection = () => mesures.length > 0 ? mesureCollection.insertMany(mesures.map(mes => { return { ...mes, timestamp: new Date(mes.timestamp) } })) : null;
    const dropUserCollection = () => userCollection.deleteMany({})
    const dropStationCollection = () => stationCollection.deleteMany({});
    const dropMesureCollection = () => mesureCollection.deleteMany({});

    const regenerateDB = async () => {
        // CLEAN DB
        await dropUserCollection();
        await dropStationCollection();
        await dropMesureCollection();
        // POPULATE DB
        await generateUserCollection();
        await generateStationCollection();
        await generateMesureCollection();
    }

    await regenerateDB()
    client.close();
}


const saveNewMesure = async (data) => {
    const db = client.db(dbName);
    const mesureCollection = db.collection('mesures');
    const ret = await mesureCollection.insertOne({ ...data, timestamp: new Date(data.timestamp) });
    return ret;
}

const getMesuresForStationId = async (id = null) => {
    const db = client.db(dbName);
    const mesureCollection = db.collection('mesures');
    const ret = id != null ? await mesureCollection.find({ identifiant: id }).toArray() : await mesureCollection.find({}).toArray();
    return ret;
}

const startConnection = async () => {
    await client.connect();
}

module.exports = {
    main: main,
    startConnection: startConnection,
    saveNewMesure: saveNewMesure,
    getMesuresForStationId: getMesuresForStationId
}