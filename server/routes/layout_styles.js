var express = require('express');

const { Cluster } = require('puppeteer-cluster');

var { uploadPresentation,
    getDataPresentations,
    getDataSinglePresentation,
    generatePresentationRequests,
    generateSlideRequests,
    generateAlternativesRequests,
    getDataSingleSlide
} = require('../services/apis/LayoutStyleAPI');
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

/* POST get data about all presentations in the library */
router.post('/get_data_presentations', function(req, res, next) {
    console.log(req.body);

    getDataPresentations(req.body).then((response) => {
        res.json(response);
    }).catch((reason) => {
        next(reason);
    });;
});

/* POST get data about single presentation in the library */
router.post('/get_data_single_presentation', function(req, res, next) {
    console.log(req.body);

    getDataSinglePresentation(req.body).then((response) => {
        res.json(response);
    }).catch((reason) => {
        next(reason);
    });;
});

/* POST get data about single slide of a presentation in the library */
router.post('/get_data_single_slide', function(req, res, next) {
    console.log(req.body);

    getDataSingleSlide(req.body).then((response) => {
        res.json(response);
    }).catch((reason) => {
        next(reason);
    });;
});

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

    /* POST get requests for alternative slides */
    router.post('/generate_alternatives_requests', function(req, res, next) {
        console.log(req.body);

        generateAlternativesRequests(req.body, cluster).then((response) => {
            res.json(response);
        }).catch((reason) => {
            next(reason);
        });;
    });



})();

module.exports = router;
