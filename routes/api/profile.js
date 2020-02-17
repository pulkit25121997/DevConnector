const express = require('express');
const router = express.Router();

// @route GET /api/users/test
// @desc Testing route for the profile routes
router.get('/test', function(req, res){
    res.json({
        msg: "Profile Works"
    });
});

module.exports = router;