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
  const date = new Date(req.body.date);
  const description = req.body.description;
  const duration = +req.body.duration;

  User.findById({ _id }).then(( userData ) => {
    if( !userData ){
      res.send("Could not find the user.");
      return;
    } 

    let newExercise = new Exercise({
      userId: _id,
      description,
      duration,
      date
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

app.get('/api/users/:_id/logs', async (req, res) => {

});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
