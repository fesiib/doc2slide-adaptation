const { extractTemplates } = require('./extractSlide');
const { initializePresentation } = require('./initializeSlide');
const { fitToPresentation_random, fitToSlide_random, fitToAllSlides_random } = require('./fitContent');

let templatesLibrary = {};

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
    if (!templatesLibrary.hasOwnProperty(presentationId)) {
        throw new Error('No such presentation with id: ' + presentationId);
    }
    let templates = templatesLibrary[presentationId];
    let result = await fitToPresentation_random(resources, templates, cluster);
    return result;
}

async function generateSlideRequests(data, cluster) {
    let presentationId = data.presentationId;
    let pageId = data.pageId;
    let insertionIndex = data.insertionIndex;
    let resources = data.resources;
    if (!templatesLibrary.hasOwnProperty(presentationId)) {
        throw new Error('No such presentation with id: ' + presentationId);
    }
    let templates = templatesLibrary[presentationId];
    let result = await fitToSlide_random(resources, templates, pageId, insertionIndex, cluster);
    return result;
}

async function generateAllSlidesRequests(data, cluster) {
    let presentationId = data.presentationId;
    let resources = data.resources;
    if (!templatesLibrary.hasOwnProperty(presentationId)) {
        throw new Error('No such presentation with id: ' + presentationId);
    }
    let templates = templatesLibrary[presentationId];
    let result = await fitToAllSlides_random(resources, templates, cluster);
    return result;
}

module.exports = {
    uploadPresentation,
    generatePresentationRequests,
    generateSlideRequests,
    generateAllSlidesRequests,
};