const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');


const Post = require('../../models/posts');
const Profile = require('../../models/profile');
const validatePostInput = require('../../validation/post')

// @route GET /api/posts/test
// @desc Testing route for the posts route
router.get('/test', function(req, res){
    res.json({
        msg: "Posts Works"
    }); 
});

// @route GET /api/posts
// @desc Get Posts
router.get('/', (req,res) => {
    Post.find().sort({date: -1})
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({noPostsFound: 'No Posts Found'}));
});

// @route GET /api/posts/:id
// @desc Get Posts by id
router.get('/:id', (req, res)=> {
    Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err => res.status(404).json({noPostFound: 'No Posts Found with that ID'}));
});


// @route POST /api/posts
// @desc Create Post
router.post('/', passport.authenticate('jwt', {session: false}), (req, res) => {
    const {errors, isValid} = validatePostInput(req.body);

    //Check Validation
    if(!isValid){
        // If any errors , send 400 with errors object
        return res.status(400).json(errors);
    }

    const newPost = new Post({
        text: req.body.text,
        name: req.body.name,
        avatar: req.body.avatar,
        user: req.user.id
    });

    newPost.save().then(post => res.json(post));
});

// @route DELETE /api/posts/:id
// @desc Delete Posts by id
router.delete('/:id', passport.authenticate('jwt', {session:false}), (req, res) => {
    Profile.findOne({user: req.user.id})
    .then(profile => {
        Post.findById(req.params.id)
        .then(post => {
            // Check for Post Owner
            if(post.user.toString() !== req.user.id){
                res.status(401).json({notAuthorized: 'User not Authorized'});
            }

            // Delete
            post.remove()
            .then(() => res.json({success: true }));
        })
        .catch(err => res.status(404).json({PostNotFound: 'No posts found'}));
    }); 
});

// @route POST /api/posts/unlike/:id
// @desc Unlike Post
router.post('like/:id', passport.authenticate('jwt', {session: false}), (req, res) => {
    Profile.findOne({user: req.user.id}).then(profile => {
        Post.findById(req.params.id)
        .then(post => {
            if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0){
                return res.status(400).json({notLiked: 'You have not liked this post'});
            }
            // Get remove index
            const removeIndex = post.likes.map(item => item.user.toString()).indexOf(req.user.id);
            //Splice out of array
            post.likes.splice(removeIndex, 1);
            //Save
            post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({PostNotFound: 'No posts Found'}));
    });
});

// @route POST /api/posts/like/:id
// @desc like Post
router.post('like/:id', passport.authenticate('jwt', {session: false}), (req, res) => {
    Profile.findOne({user: req.user.id}).then(profile => {
        Post.findById(req.params.id)
        .then(post => {
            if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0){
                return res.status(400).json({alreadyLiked: 'User already liked this post'});
            }
            // Add the user id to the Likes array
            post.likes.unshift({user: req.user.id}); 

            posts.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({PostNotFound: 'No posts Found'}));
    });
});

// @route POST /api/posts/comment/:id
// @desc Add comment to post
router.delete('/comment/:id/:comment_id', passport.authenticate('jwt', {session: false}), (req, res) => {
    
    const {errors, isValid} = validatePostInput(req.body);
    //Check Validation
    if(!isValid){
        // If any errors , send 400 with errors object
        return res.status(400).json(errors);
    }
    Post.findById(req.params.id)
    .then(post => {
        const newComment = {
            text: req.body.text,
            name: req.user.name,
            avatar: req.body.avatar,
            user: req.user.id
        }
        // Add comments to array
        post.comments.unshift(newComment);
        //Save
        post.save().then(post => res.json(post));
    })
    .catch(err => res.status(404).json({PostNotFound: 'No Posts Found'}));
});

// @route DELETE /api/posts/comment/:id/:comment_id
// @desc Remove comments
router.delete('/:id', passport.authenticate('jwt', {session:false}), (req, res) => {
    
    Post.findById(req.params.id)
    .then(post => {
        // Check to see if the comment exists
        if(posts.comments.filter(comment => comment._id.toString() === req.params.comment_id).length === 0){
            return res.status(404).json({commentNotExists: "Comment does not exist!"});
        }

        const removeIndex = post.comment
        .map(item => item._id.toString())
        .indexOf(req.params.comment_id);

        // Splice comment out of the array
        post.comments.splice(removeIndex, 1);

        posts.save().then(post => res.json(post));
    })
    .catch(err => res.status(404).json({postNotFound: "No Post Found"}));
});


module.exports = router; 