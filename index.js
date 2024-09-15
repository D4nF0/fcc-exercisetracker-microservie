const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/*
const { MongoClient } = require('mongodb');
const client = new MongoClient( process.env.MONGO_URI );
const db = client.db('exerciseTracker');
const logs = db.collection('userLogs');
*/

const mongoose = require('mongoose');
mongoose.connect( process.env.MONGO_URI ).then( () => {
  console.log( 'Connected to MongoDB' );
}).catch((err) => {
  console.log(err);
});
const db = mongoose.connection;

const Schema = mongoose.Schema;
const logSchema = new Schema({
  username: {
    type: String, 
    require: true,
    unique: true
  },
  count: {
    type: Number,
  },
  log: {
    type: [{
      description: String,
      duration: Number,
      date: String
    }]
  },
});
const Log = mongoose.model( "userLog", logSchema );

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res) => {
  
});

app.post('/api/users/:_id/exercises', (req, res) => {


});

app.get('/api/users/:_id/logs?[from][&to][&limit]', (req, res) => {


});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
