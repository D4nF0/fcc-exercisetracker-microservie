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

const userSchema = new Schema({
  username: {
    type: String, 
    require: true,
    unique: true
  },
}, { versionKey: false });
const User = mongoose.model( "user", userSchema);

const exerciseSchema = new Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date
}, { versionKey: false });
const Exercise = mongoose.model( "exercise", exerciseSchema );

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
  const username = req.body.username;
  
  User.findOne({ username }).then(( data ) => {
    if( data ){
      res.json({
        username: data.username,
        _id: data._id
      });
    } else {
      let newUser = new User( { username } );

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
  const { date, description, duration} = req.body;

  User.findById({ _id }).then(( userData ) => {
    if( !userData ){
      res.send("Could not find the user.");
      return;
    } 

    let newExercise = new Exercise({
      userId: _id,
      description,
      duration,
      date: date ? new Date(date) : new Date()
    });

    newExercise.save().then(( exerciseData ) => {
      res.json({
        _id: exerciseData.userId,
        username: userData.username,
        date: exerciseData.date.toDateString(),
        duration: exerciseData.duration,
        description: exerciseData.description
      });
    }).catch(( err ) => console.log( err ));

  }).catch(( err ) => console.log( err ));
});

app.get('/api/users/:_id/logs', (req, res) => {
  const { limit, from, to } = req.query;
  const _id = req.params._id;
  
  let dateObj = {};
  let filter = {
    userId: _id,
  };

  User.findById({ _id }).then(( userData ) => {
    if( !userData ){
      res.send("Could not find the user.");
      return;
    }

    if( from ) dateObj["$gte"] = new Date(from);
    if( to ) dateObj["$lte"] = new Date(to);
    if( from || to ) filter.date = dateObj;

    Exercise.find( filter ).limit( +limit ?? 500 ).then(( exerciseData ) => {
      const log = exerciseData.map( e => {
        return {
          description: e.description,
          duration: e.duration,
          date: e.date.toDateString()
        }
      });
      console.log( exerciseData );
      console.log( log );

      res.json({
        _id: userData._id,
        username: userData.username,
        from,
        to,
        limit,
        count: log.length,
        log
      });

    }).catch(( err ) => console.log( err ));

  }).catch(( err ) => console.log( err ));

});

app.get('/api/users', (req, res) => {
  User.find().then(( userData ) => {
    if( !userData ){
      res.send("No user found.")
    } else {
      res.json( userData );
    }

  }).catch(( err ) => console.log( err ))
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
