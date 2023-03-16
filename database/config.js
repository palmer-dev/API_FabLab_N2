// VARIABLE ENV
require('dotenv').config()

// SECURITY
const bcrypt = require("bcrypt");
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);

// IMPORT DES DATAS
const users = require("../data/users");
const stations = require("../data/stations");
const mesures = require("../data/mesures");

// CRYPTAGE DES MDP

// MONGO ===
const MONGO_URI = process.env.MONGO_URI;
const { MongoClient } = require('mongodb');

// Connection URL
const client = new MongoClient(MONGO_URI);

// Database Name
const dbName = 'fablab-meteo';



async function main() {
    // Use connect method to connect to the server
    // await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const userCollection = db.collection('users');
    const stationCollection = db.collection('stations');
    const mesureCollection = db.collection('mesures');

    // the following code examples can be pasted here...

    const generateUserCollection = () => users.length > 0 ? userCollection.insertMany(users.map(user => {
        return { ...user, password: bcrypt.hashSync(user.password, salt), 'createdAt': new Date() }
    })) : null;
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

    await regenerateDB();
    client.close();
}

const generateUserCollection = () => {
    const db = client.db(dbName);
    const userCollection = db.collection('users');
    users.length > 0 ? userCollection.insertMany(users.map(user => {
        return { ...user, password: bcrypt.hashSync(user.password, salt), 'createdAt': new Date() }
    })) : null
};


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

const getLastesMesuresForStationId = async (id = null) => {
    const db = client.db(dbName);
    const mesureCollection = db.collection('mesures');
    const ret = id != null ? await mesureCollection.aggregate([
        {
            '$match': {
                'id': id
            }
        }, {
            '$sort': {
                'timestamp': -1
            }
        }, {
            '$limit': 1
        }, {
            '$lookup': {
                'from': 'stations',
                'localField': 'id',
                'foreignField': 'identifiant',
                'as': 'station'
            }
        }, {
            '$unwind': '$station'
        }
    ]).toArray() : await mesureCollection.aggregate([
        {
            '$sort': {
                'timestamp': -1
            }
        },
        {
            '$limit': 1
        }, {
            '$lookup': {
                'from': 'stations',
                'localField': 'id',
                'foreignField': 'identifiant',
                'as': 'station'
            }
        }, {
            '$unwind': '$station'
        }
    ]).toArray();
    return ret[0];
}

const startConnection = async () => {
    await client.connect();
}

const authUser = async (username, password) => {
    const db = client.db(dbName);
    const userCollection = db.collection('users');
    const user = await userCollection.findOne({ username });
    const isLoggedIn = user != null ? bcrypt.compareSync(password, user.password) : false;
    // On retire le champs password de l'utilisateur renvoyé au client
    delete user.password;
    return isLoggedIn ? user : null
}

const getUserStations = async (userId) => {

}

// EXPORT DES FONCTIONS
module.exports = {
    generateUserCollection: generateUserCollection,
    startConnection: startConnection,
    authUser: authUser,
    saveNewMesure: saveNewMesure,
    getMesuresForStationId: getMesuresForStationId,
    getLastesMesuresForStationId: getLastesMesuresForStationId,
    getUserStations: getUserStations
}