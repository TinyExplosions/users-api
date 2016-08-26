var User = require('../models/user');
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

// GET /users
// Get a list of users
router.get('/', function(req, res) {
    User.find({}, function(err, users) {
        if (err) {
            return res.status(500).json({
                error: "Error listing users: " + err
            });
        }

        res.json(users);
    });
});

// PUT /users/id
// Update a user
router.put('/:id', function(req, res) {
    User.findOne({
        _id: req.params.id
    }, function(err, user) {
        if (err) {
            return res.status(500).json({
                error: "Error updating user: " + err
            });
        }

        if (!user) {
            return res.status(404).end();
        }

        user = extend(req.body, user);
        user.save(function(err, user) {
            if (err) {
                return res.status(500).json({
                    error: "Error updating user: " + err
                });
            }

            res.json(user);
        });

    });
});



// GET /users/:id
// Get a user by ID
router.get('/:id', function(req, res) {
    User.findOne({
        _id: req.params.id
    }, function(err, user) {
        if (err) {
            console.log(err);
            return res.status(500).json({
                error: "Error reading user: " + err
            });
        }

        if (!user) {
            return res.status(404).end();
        }

        res.json(user);
    });
});

// DELETE /users/:id
// Delete a user by ID
router.delete('/:id', function(req, res) {
    User.findOne({
        _id: req.params.id
    }, function(err, user) {
        if (err) {
            return res.status(500).json({
                error: "Error reading user: " + err
            });
        }

        if (!user) {
            return res.status(404).end();
        }

        res.json(user);
        user.remove();
    });
});

// For update, replace user attrs with body
function extend(body, user) {
    for (var attrname in body) {
        // ignore attrs starting with '_' as they're Mongo Specific
        if (attrname.indexOf('_') !== 0 && user[attrname]) {
            user[attrname] = body[attrname];
        }
    }

    return user;
}


module.exports = router;
