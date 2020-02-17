const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');

// Load input Validation
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

const User = require('../../models/users');

// @route GET /api/users/test
// @desc Testing route for the users routes
router.get('/test', function(req, res){
    res.json({
        msg: "Users Works"
    });
});

// @route GET /api/users/register
// @desc Route for registering User
router.post('/register', function(req, res){

    const {errors, isValid} = validateRegisterInput(req.body);
    // Check Validation
    if(!isValid){
        return res.status(400).json(errors);
    }

    User.findOne({email: req.body.email})
    .then(function(user){
        if(user){
            errors.email = 'Email Already Exists';
            return res.status(400).json(errors); 
        } else {

            const avatar = gravatar.url(req.body.email, {s:'200',r: 'pg', d:'mm'});
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                avatar,
                password: req.body.password
            });

            bcrypt.genSalt(10, function(err, salt){
                bcrypt.hash(newUser.password, salt, function(err, hash){
                    if(err) throw err;
                    newUser.password = hash;
                    newUser.save()
                    .then(user => res.json(user))
                    .catch(err => console.log(err));
                }); 
            });
        }
    })
});

// @route GET /api/users/login
// @desc Route for Login User / Returning JWT Token
router.post('/login', function(req, res){
    
    const {errors, isValid} = validateLoginInput(req.body);
    // Check Validation
    if(!isValid){
        return res.status(400).json(errors);
    }
    const email = req.body.email;
    const password = req.body.password;

    // Find User by Email
    User.findOne({email})
    .then(function(user){
        // Check for User
        if(!user){
            errors.email = 'User not found';
            return res.status(404).json(errors);
        }
        // Check for Password
        bcrypt.compare(password, user.password).then(isMatch => {
            if(isMatch){
                //res.json({msg: 'Success'});
                //User Matched
                const payload = {id: user.id, name: user.name, avatar: user.avatar} // JWT Payload
                // Sign Token
                jwt.sign(payload, keys.secretOrKey, {expiresIn: 3600}, function(err, token){
                    res.json({success: true, token: 'Bearer ' + token});
                });
            } else {
                errors.password = 'Password Incorrect';
                res.status(400).json(errors);
            }
        }); 
    });
});

// @route GET /api/users/current
// @desc Return the current user
router.get('/current', passport.authenticate('jwt', {session: false}), (req, res) => {
    res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
    });
})

   
module.exports = router;