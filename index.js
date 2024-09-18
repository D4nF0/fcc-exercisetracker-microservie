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
  _id: false,
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

  Log.findById({ _id }).then(( data ) => {
    if( !data ){
      res.send("Could not find the user.");
      return;
    } 

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
        date: data.log[ data.count-1 ].date.toDateString(),
        duration: data.log[ data.count-1 ].duration,
        description: data.log[ data.count-1 ].description
      });
    }).catch(( err ) => console.log( err ));

  }).catch(( err ) => console.log( err ));
});

app.get('/api/users/:_id/logs', async (req, res) => {

/*  
  const { limit, from, to } = req.query;
  const _id = req.params._id;

  Log.findById({ _id }).then(( data ) => {
    if( !data ){
      res.send("Could not find the user.")      
      return;
    }
    console.log( data );
    const log = data.log;
    console.log( log );
    log.map(( e ) => {
      console.log( e );

    })


  }).catch(( err ) => console.log( err ));
*/


  const _id = req.params._id;
  const user = await Log.findById({ _id });
  if( !user ){
    res.send("Could not find the user.");
    return;
  };

  const { limit, from, to } = req.query;
  let dateObj = {};
  let filter = {
    _id,
    log: [{}]
  };

  if( from ) dateObj["$gte"] = new Date(from);
  if( to ) dateObj["$lte"] = new Date(to);
  if( from || to ) filter.log.date = dateObj;
  console.log( filter );

  const data = await Log.find( filter ).limit( +limit ?? 100 ).exec();
  console.log( data );

  const log = data.map( e => {
    console.log( e );

    return {
      description: e.log.description,
      duration: e.log.duration,
      date: e.log.date
    }
  });
  console.log( log );

  res.json({
    _id: data._id,
    username: data.username,
    from,
    to,
    limit,
    count: data.count,
    log
  });

});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
