const { response } = require('express');
var express = require('express');
const { uploadSlides, generateSlideDeckRequests, generateSlideSingleRequests } = require('../services/SlidesAPI');
var router = express.Router();

/* POST upload Presentation Slides */

router.post('/upload_slides', function(req, res, next) {
    console.log(req.body);
    uploadSlides(req.body).then((response) => {
        res.json(response);
    }).catch((reason) => {
        next(reason);
    });;
});

/* POST get requests for slide deck */

router.post('/generate_slide_deck_requests', function(req, res, next) {
    console.log(req.body);

    generateSlideDeckRequests(req.body).then((response) => {
        res.json(response);
    }).catch((reason) => {
        console.log(reason);
        next(reason);
    });
});

/* POST get requests for single slide */

router.post('/generate_slide_single_requests', function(req, res, next) {
    console.log(req.body);

    generateSlideSingleRequests(req.body).then((response) => {
        res.json(response);
    }).catch((reason) => {
        next(reason);
    });;
});

module.exports = router;