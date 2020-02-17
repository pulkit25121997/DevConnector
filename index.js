const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser'); 
const passport = require('passport');

const users = require('./routes/api/users');
const profile = require('./routes/api/profile');
const posts = require('./routes/api/posts');

const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// DB Configuration
const db = require('./config/keys').MongoURL;
// Setting Connection to MongoDB
mongoose.connect(db, {useNewUrlParser: true}).then(function(){
    console.log("Database Successfully Connected");
}).catch(function(err){
    console.log(err); 
});

// Passport MiddleWare
app.use(passport.initialize());
// Passport Config
require('./config/passport')(passport);

app.get('/', function(req, res){
    res.send("Hello MotherFuckers!");
})

// Use routes
app.use('/api/users', users);
app.use('/api/profile', profile);
app.use('/api/posts', posts);

const port = process.env.PORT || 5000 ;

app.listen(port, function(){
    console.log("Server is Running");
});
