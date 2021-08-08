const { response } = require('express');
var express = require('express');
const { getAvailablePresentations, 
    uploadPresentation,
    generatePresentationRequests,
    generateSlideRequests,
    generateBestSlideRequests,
    generateAllSlidesRequests } = require('../services/SlidesAPI');

const {
    getImages,
    getQueries,
} = require('../services/ImageAPI');
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

/* POST get available presentations */
router.post('/get_available_presentations', function(req, res, next) {
    console.log(req.body);

    getAvailablePresentations(req.body).then((response) => {
        res.json(response);
    }).catch((reason) => {
        next(reason);
    });;
});

router.post('/get_images', function(req, res, next) {
    console.log(req.body);
    getImages(req.body).then((response) => {
        res.json(response);
    }).catch((reason) => {
        next(reason);
    });
});

router.post('/get_queries', function(req, res, next) {
    console.log(req.body);
    getQueries(req.body).then((response) => {
        console.log(response)
        res.json(response);
    }).catch((reason) => {
        next(reason);
    });
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

    /* POST get requests for best single slide */

    router.post('/generate_best_slide_requests', function(req, res, next) {
        console.log(req.body);

        generateBestSlideRequests(req.body, cluster).then((response) => {
            res.json(response);
        }).catch((reason) => {
            next(reason);
        });;
    });

    /* POST get requests for single slide */
    router.post('/generate_all_slides_requests', function(req, res, next) {
        console.log(req.body);

        generateAllSlidesRequests(req.body, cluster).then((response) => {
            res.json(response);
        }).catch((reason) => {
            next(reason);
        });;
    });



})();

module.exports = router;
