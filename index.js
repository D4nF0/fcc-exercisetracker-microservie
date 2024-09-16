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
    default: 0
  },
  log: {
    type: [{
      _id: false,
      description: String,
      duration: Number,
      date: String
    }]
  },
}, { versionKey: false });
const Log = mongoose.model( "userLog", logSchema );

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
  const username = req.body.username;
  
  Log.findOne({ username }).then(( data ) => {
    if( data ){
      res.json({
        username: data.username,
        _id: data._id
      });
    } else {
      let newUser = new Log( { username } );

      newUser.save().then(( data ) => {
        res.json({
          username: data.username,
          _id: data._id
        });
      }).catch(( err ) => console.log( err ));
    }
  }).catch(( err ) => console.log( err ));
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const _id = req.params._id;
  const date = new Date(req.body.date).toDateString();
  const description = req.body.description;
  const duration = +req.body.duration;

  Log.findById({ _id }).then(( data ) => {
    data.count += 1;
    data.log.push({
      description,
      duration,
      date
    });

    data.save().then(( data ) => {
      res.json({
        _id: data._id,
        username: data.username,
        date: data.log[ data.count-1 ].date,
        duration: data.log[ data.count-1 ].duration,
        description: data.log[ data.count-1 ].description
      });
    }).catch(( err ) => console.log( err ));

  }).catch(( err ) => console.log( err ));
});

app.get('/api/users/:_id/logs?[from][&to][&limit]', (req, res) => {


});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
