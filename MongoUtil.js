const MongoClient = require('mongodb').MongoClient;

async function connect(mongoUri, dbName) {
    let client = await MongoClient.connect(mongoUri, {
        useUnifiedTopology: true
    });
    const db = client.db(dbName);
    return db;
}

module.exports = {
    connect
}