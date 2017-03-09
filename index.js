require('dotenv').config();
var express = require('express');
var mongoose = require('mongoose');
var path = require('path');
var validator = require('validator');
var mongooseSequence = require('mongoose-sequence');
mongoose.Promise = require('bluebird');

var app = express();

var URL = process.env.URL;
var PORT = process.env.PORT;
var DB_CONN = (process.env.DB_USER) ?
    ('mongodb://' + process.env.DB_USER + ':' + process.env.DB_PWD + '@' + process.env.DB_URL + ':' + process.env.DB_PORT + '/' + process.env.DB_NAME) :
    ('mongodb://' + process.env.DB_URL + ':' + process.env.DB_PORT + '/' + process.env.DB_NAME);

mongoose.connect(DB_CONN);

var Schema = mongoose.Schema;
var urlSchema = Schema({
    original_url: String,
});
urlSchema.plugin(mongooseSequence, { inc_field: "short_url" });

var ShortURL = mongoose.model("ShortURL", urlSchema);

app.get('/:shorturl', function (req, res) {
    if (validator.isInt(req.params.shorturl)) {
        ShortURL.find({ short_url: req.params.shorturl }, function (err, response) {
            if (err) { throw err; }
            console.log(response);
            if (response.length === 0) {
                res.send('Shortened URL does not exist!!!');
            } else {
                res.redirect(response[0].original_url);
            }
        });
    } else {
        res.send('Shortened URL does not exist!!!')
    }

});

app.get('/new/*', function (req, res) {

    if (!validator.isURL(req.params[0], { require_protocol: true })) {
        res.json({
            original_url: null,
            short_url: null
        });
    } else {
        ShortURL.find({ original_url: req.params[0] }, function (err, response) {

            if (err) { throw err; }
            if (response.length === 0) {

                console.log('-> Generating New Entry...');
                var newUrl = new ShortURL({
                    original_url: req.params[0]
                });

                newUrl.save(function (err, resp) {
                    if (err) { throw err; }
                    else {
                        res.json({
                            original_url: resp.original_url,
                            short_url: URL + PORT + '/' + resp.short_url
                        });
                    }
                });

            } else {
                res.json({
                    original_url: response[0].original_url,
                    short_url: URL + PORT + '/' + response[0].short_url
                });
            }
        })
    }

});








app.listen(PORT, function () {
    console.log('Listening on Port: ' + PORT);
});



