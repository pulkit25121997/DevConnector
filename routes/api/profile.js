const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');


// Load Validation
const ValidateProfileInput = require('../../validation/profile');
const ValidateExperienceInput = require('../../validation/experience');
const ValidateEducationInput = require('../../validation/education');


// Load Profile and User Model
const Profile = require('../../models/profile');
const User = require('../../models/users');


// @route GET /api/profile/test
// @desc Testing route for the profile routes
router.get('/test', function(req, res){
    res.json({
        msg: "Profile Works"
    });
});

// @route GET /api/profile
// @desc Get the current user profile
router.get('/', passport.authenticate('jwt', {session: false}), (req, res) => {
    
    const errors = {};
    
    Profile.findOne({user: req.user.id})
    .populate('user', ['name', 'avatar'])
    .then(profile => {
        if(!profile){
            errors.noprofile = 'There is no profile for the user';
            return res.status(404).json(errors)
        }
        res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});


// @route POST /api/profile
// @desc Create the User Profile
router.post ('/', passport.authenticate('jwt', {session: false}), (req, res) => {
    
    const {errors, isValid} = ValidateProfileInput(req.body);

    // Check Validation
    if(!isValid){
        return res.status(400).json(errors);
    }
    
    // Get the Profile Fields
    const profilefields = {};
    profilefields.user = req.user.id;
    if(req.body.handle) profilefields.handle = req.body.handle;
    if(req.body.company) profilefields.company = req.body.company;
    if(req.body.website) profilefields.website = req.body.website;
    if(req.body.location) profilefields.location = req.body.location;
    if(req.body.bio) profilefields.bio = req.body.bio;
    if(req.body.status) profilefields.status = req.body.status;
    if(req.body.githubusername) profilefields.githubusername = req.body.githubusername;

    //Skills - Split into array
    if(typeof req.body.skills != 'undefined'){
        profilefields.skills = req.body.skills.split(',');
    }

    // Social
    profilefields.social = {};
    if(req.body.youtube) profilefields.social.youtube = req.body.youtube;
    if(req.body.twitter) profilefields.social.twitter = req.body.twitter;
    if(req.body.linkedin) profilefields.social.linkedin = req.body.linkedin;
    if(req.body.facebook) profilefields.social.facebook = req.body.facebook;
    if(req.body.instagram) profilefields.social.instagram = req.body.instagram;

    Profile.findOne({user: req.user.id})
    .then(profile => {
        if(profile){
            // Update
            Profile.findOneAndUpdate({user: req.user.id}, {$set: profilefields}, {new: true})
            .then(profile => res.json(profile));
        } else{
            // Create
            // Check if handle exists
            Profile.findOne({handle: profilefields.handle}).then(profile => {
                if(profile){
                    errors.handle = 'This handle already exists';
                    res.status(400).json(errors);
                }

                // Save Profile
                new Profile(profilefields).save().then(profile => res.json(profile));
            });
        }
    });
});


// @route GET /api/profile/handle/:handle
// @desc Get Profile by Handle
router.get('/handle/:handle', (req, res) => {

    const errors = {};

    Profile.findOne({handle: req.params.handle})
    .populate('user', ['name', 'avatar'])
    .then(profile => {
        if(!profile){
            errors.noprofile = 'There is no profile for this user';
            res.status(404).json(errors);
        } else {
            res.status(200).json(profile);
        }
    })
    .catch(err => res.status(404).json(err));
});

// @route GET /api/profile/user/:user_id
// @desc Get Profile by user_id
router.get('/users/:user_id', (req, res) => {

    const errors = {};

    Profile.findOne({user: req.params.user_id})
    .populate('user', ['name', 'avatar']) 
    .then(profile => {
        if(!profile){
            errors.noprofile = 'There is no profile for this user';
            res.status(404).json(errors);
        } else {
            res.status(200).json(profile);
        }
    })
    .catch(err => res.status(404).json({profile: 'There is no profile for this user.'}));
});
 

// @route GET /api/profile/all
// @desc Get all Profiles
router.get('/all', (req, res) => {

    const errors = {};

    Profile.find()
    .populate('user', ['name', 'avatar'])
    .then(profiles => {
        if(!profiles){
            errors.noprofile = 'There are no profiles.';
            return res.status(404).json(errors);
        }

        res.json(profiles);
    })
    .catch(err => res.status(404).json({profile: 'There is no profiles.'}));
});

// @route POST /api/profile/experience
// @desc Add experience to the profile
router.post('/experience', passport.authenticate('jwt', {session: false}), (req, res) => {
    
    const {errors, isValid} = ValidateExperienceInput(req.body);

    // Check Validation
    if(!isValid){
        return res.status(400).json(errors);
    }
    
    Profile.findOne({user: req.user.id})
    .then(profile => {
        const newExp = {
            title: req.body.title,
            company: req.body.company,
            location: req.body.location,
            from: req.body.from,
            to: req.body.to,
            current: req.body.current,
            description: req.body.description
        }
        profile.experience.unshift(newExp);
        profile.save().then(profile => res.json(profile));
    });
});

// @route POST /api/profile/education
// @desc Add education to the profile
router.post('/education', passport.authenticate('jwt', {session: false}), (req, res) => {
    
    const {errors, isValid} = ValidateEducationInput(req.body);

    // Check Validation
    if(!isValid){
        return res.status(400).json(errors);
    }
    
    Profile.findOne({user: req.user.id})
    .then(profile => {
        const newEdu = {
            school: req.body.school,
            degree: req.body.degree,
            fieldofstudy: req.body.fieldofstudy,
            from: req.body.from,
            to: req.body.to,
            current: req.body.current,
            description: req.body.description
        }
        profile.education.unshift(newEdu);
        profile.save().then(profile => res.json(profile));
    });
});

// @route DELETE /api/profile/experience/:exp_id
// @desc Delete experience from profile
router.delete('/experience/:exp_id', passport.authenticate('jwt', {session: false}), (req, res) => {
    
    
    Profile.findOne({user: req.user.id})
    .then(profile => {
      // Get remove index
      const removeIndex = profile.experience
      .map(item => item.id)
      .indexOf(req.params.exp_id);
      
      // Splice out of the array
      profile.experience.splice(removeIndex, 1);

      profile.save().then(profile => res.json(profile));
    })
    .catch(err => res.status(404).json(err));
});

// @route DELETE /api/profile/education/:edu_id
// @desc Delete education from profile
router.delete('/education/:edu_id', passport.authenticate('jwt', {session: false}), (req, res) => {
    
    
    Profile.findOne({user: req.user.id})
    .then(profile => {
      // Get remove index
      const removeIndex = profile.education
      .map(item => item.id)
      .indexOf(req.params.edu_id);
      
      // Splice out of the array
      profile.education.splice(removeIndex, 1);

      profile.save().then(profile => res.json(profile));
    })
    .catch(err => res.status(404).json(err));
});

// @route DELETE /api/profile/
// @desc Delete User and Profile
router.delete('/', passport.authenticate('jwt', {session: false}), (req, res) => {
    Profile.findOneAndRemove({user: req.user.id})
    .then(() => {
        User.findByIdAndRemove({_id: req.user.id})
        .then(() => res.json({success: true}));
    });
});

module.exports = router;