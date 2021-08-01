const { extractTemplates } = require('./extractSlide');
const { initializePresentation } = require('./initializeSlide');
const { fitToAllSlides_TextShortening, fitToSlideDeck_random } = require('./fitContent');

let templatesLibrary = {};

async function uploadSlides(data) {
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
            librarySize: Object.keys(templatesLibrary).length,
        });
    });
}

async function generateSlideDeckRequests(data, cluster) {
    let presentationId = data.presentationId;
    let resources = data.resources;
    if (!templatesLibrary.hasOwnProperty(presentationId)) {
        throw new Error('No such presentation with id: ' + presentationId);
    }
    let templates = templatesLibrary[presentationId];
    let result = await fitToSlideDeck_random(resources, templates, cluster);
    return result;
}

async function generateSlideSingleRequests(data, cluster) {
    let presentationId = data.presentationId;
    let pageId = data.pageId;
    let resources = data.resources;
    return new Promise((resolve, reject) => {
        resolve({
            requests: [],
            matching: [],
        });
    });
}

module.exports = {
    uploadSlides,
    generateSlideDeckRequests,
    generateSlideSingleRequests,
};