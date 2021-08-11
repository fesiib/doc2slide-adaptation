const { extractTemplates } = require('./extractSlide');
const { initializePresentation } = require('./initializeSlide');
const { fitToPresentation_random, fitToSlide_random, fitToBestSlide_total, fitToAllSlides_random, fitToPresentation_greedy } = require('./fitContent');

let templatesLibrary = {};

async function getAvailablePresentations(data) {
    return new Promise(resolve => {
        resolve({
            size: Object.keys(templatesLibrary).length,
            presentationIds: Object.keys(templatesLibrary),
        });
    });
}

async function uploadPresentation(data) {
    return new Promise((resolve, reject) => {
        let presentation = data.presentation;
        let presentationId = presentation.presentationId;
        if (templatesLibrary.hasOwnProperty(presentationId)) {
            console.log('Already in the library, but update');
            delete templatesLibrary[presentationId];
        }    
        let templates = extractTemplates(presentation);
        templatesLibrary[presentationId] = templates;
        resolve({
            extractedTemplates: templates,
            requests: initializePresentation(templates),
            librarySize: Object.keys(templatesLibrary).length,
        });
    });
}

async function generatePresentationRequests(data, cluster) {
    let presentationId = data.presentationId;
    let resources = data.resources;
    let fast = true;
    let method = 'greedy';

    if (data.hasOwnProperty('fast')) {
        fast = data.fast;
    }
    if (data.hasOwnProperty('method')) {
        method = data.method;
    }
    
    let fitFunction = fitToPresentation_random;

    if (method === 'greedy') {
        fitFunction = fitToPresentation_greedy;
    }

    if (!templatesLibrary.hasOwnProperty(presentationId)) {
        throw new Error('No such presentation with id: ' + presentationId);
    }
    let templates = templatesLibrary[presentationId];
    if (fast) {
        return await fitFunction(resources, templates, null);
    }
    let result = fitFunction(resources, templates, cluster);
    return result;
}

async function generateSlideRequests(data, cluster) {
    let presentationId = data.presentationId;
    let targetPageId = data.targetPageId;
    let sourcePageId = data.sourcePageId;
    let pageNum = data.pageNum;
    let resources = data.resources;
    let fast = true;

    if (data.hasOwnProperty('fast')) {
        fast = data.fast;
    }

    if (!templatesLibrary.hasOwnProperty(presentationId)) {
        throw new Error('No such presentation with id: ' + presentationId);
    }
    let templates = templatesLibrary[presentationId];
    if (fast) {
        return await fitToSlide_random(resources, templates, targetPageId, sourcePageId, pageNum, null);
    }
    let result = await fitToSlide_random(resources, templates, targetPageId, sourcePageId, pageNum, cluster);
    return result;
}

async function generateBestSlideRequests(data, cluster) {
    let presentationId = data.presentationId;
    let targetPageId = data.targetPageId;
    let pageNum = data.pageNum;
    let resources = data.resources;
    let fast = true;

    if (data.hasOwnProperty('fast')) {
        fast = data.fast;
    }

    if (!templatesLibrary.hasOwnProperty(presentationId)) {
        throw new Error('No such presentation with id: ' + presentationId);
    }
    let templates = templatesLibrary[presentationId];
    if (fast) {
        return await fitToBestSlide_total(resources, templates, targetPageId, pageNum, null);
    }
    let result = await fitToBestSlide_total(resources, templates, targetPageId, pageNum, cluster);
    return result;
}

async function generateAllSlidesRequests(data, cluster) {
    let presentationId = data.presentationId;
    let sort = data.sort;
    let resources = data.resources;
    let fast = true;

    if (data.hasOwnProperty('fast')) {
        fast = data.fast;
    }

    if (!templatesLibrary.hasOwnProperty(presentationId)) {
        throw new Error('No such presentation with id: ' + presentationId);
    }
    let templates = templatesLibrary[presentationId];
    if (fast) {
        return await fitToAllSlides_random(resources, templates, sort, null);
    }
    let result = await fitToAllSlides_random(resources, templates, sort, cluster);
    return result;
}

module.exports = {
    uploadPresentation,
    generatePresentationRequests,
    generateSlideRequests,
    generateBestSlideRequests,
    generateAllSlidesRequests,
    getAvailablePresentations,
};