const { response } = require('express');
var express = require('express');
const { uploadPresentation, generatePresentationRequests, generateSlideRequests } = require('../services/SlidesAPI');
var router = express.Router();

/* POST upload Presentation Slides */

router.post('/upload_presentation', function(req, res, next) {
    console.log(req.body);
    uploadPresentation(req.body).then((response) => {
        res.json(response);
    }).catch((reason) => {
        next(reason);
    });;
});


const { Cluster } = require('puppeteer-cluster');

(async() => {
    /* Setup Puppeteer Cluster */
    
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: 2,
        monitor: true,
        puppeteerOptions: {
            args: ['--no-sandbox'],
        },
    });

    /* POST get requests for slide deck */

    router.post('/generate_presentation_requests', function(req, res, next) {
        console.log(req.body);

        generatePresentationRequests(req.body, cluster).then((response) => {
            res.json(response);
        }).catch((reason) => {
            next(reason);
        });
    });

    /* POST get requests for single slide */

    router.post('/generate_slide_requests', function(req, res, next) {
        console.log(req.body);

        generateSlideRequests(req.body, cluster).then((response) => {
            res.json(response);
        }).catch((reason) => {
            next(reason);
        });;
    });
})();

module.exports = router;
