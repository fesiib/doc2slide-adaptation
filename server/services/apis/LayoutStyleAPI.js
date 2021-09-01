const { explicitFitToSlide } = require('../explicitFitContent');
const { getTemplatesData_v2, fitToPresentation_v2, fitToSlide_v2, fitToAlternatives_v2, getTemplateData_v2 } = require('../fitContent_v2');
const { Templates } = require('../Templates');

let templatesLibrary = {};

const BULLETS_PRESENTATION_ID = '1HbS5f9IcAJJwWJqjLPEac03OCNu6Oz_iHfPGsbhYYO4';

async function getDataPresentations(data) {
    return new Promise(resolve => {
        let presentations = [];
        for (let presentationId in templatesLibrary) {
            presentations.push({
                presentationId: presentationId,
                templatesData: getTemplatesData_v2(templatesLibrary[presentationId]),
            });
        }
        resolve({
            size: Object.keys(templatesLibrary).length,
            presentations: presentations,
            bulletsPresentationId: BULLETS_PRESENTATION_ID,
        });
    });
}

async function getDataSinglePresentation(data) {
    return new Promise(resolve => {
        let presentationId = data.presentationId;
        if (!templatesLibrary.hasOwnProperty(presentationId)) {
            throw new Error('No such presentation with id: ' + presentationId);
        }
        let templatesData = getTemplatesData_v2(templatesLibrary[presentationId]);
        resolve({
            ...templatesData,
        });
    });
}

async function getDataSingleSlide(data) {
    return new Promise(resolve => {
        let presentationId = data.presentationId;
        let pageId = data.pageId;
        if (!templatesLibrary.hasOwnProperty(presentationId)) {
            throw new Error('No such presentation with id: ' + presentationId);
        }
        let templatesData = getTemplateData_v2(templatesLibrary[presentationId], pageId);
        resolve({
            ...templatesData,
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
        let templates = Templates.extractTemplates(presentation);
        templatesLibrary[presentationId] = templates;
        let templatesData = getTemplatesData_v2(templatesLibrary[presentationId]);
        resolve({
            extractedTemplates: templates,
            ...templatesData,
        });
    });
}

async function generatePresentationRequests(data, cluster) {
    let presentationId = data.presentationId;
    let resources = data.resources;
    let settings = {
        fast: true,
        method: 'greedy',
        contentControl: false,
        debug: false,
        putOriginalContent: true,
    };
    if (data.hasOwnProperty('settings')) {
        settings = {
            ...settings,
            ...data.settings,
        };
    }

    if (!templatesLibrary.hasOwnProperty(presentationId)) {
        throw new Error('No such presentation with id: ' + presentationId);
    }
    let templates = templatesLibrary[presentationId];
    return fitToPresentation_v2(resources, templates, cluster, settings);
}

async function generateSlideRequests(data, cluster) {
    let presentationId = data.presentationId;
    let targetPageId = data.targetPageId;
    let layoutPageId = data.layoutPageId;
    let stylesPageId = data.stylesPageId;
    let pageNum = data.pageNum;
    let resources = data.resources;
    let settings = {
        fast: true,
        method: 'greedy',
        contentControl: false,
        debug: false,
        putOriginalContent: true,
    };

    if (data.hasOwnProperty('settings')) {
        settings = {
            ...settings,
            ...data.settings,
        };
    }

    if (!templatesLibrary.hasOwnProperty(presentationId)) {
        throw new Error('No such presentation with id: ' + presentationId);
    }
    let templates = templatesLibrary[presentationId];
    return await fitToSlide_v2(
        resources,
        templates,
        targetPageId,
        layoutPageId,
        stylesPageId,
        pageNum,
        cluster,
        settings,
    );
}

async function generateAlternativesRequests(data, cluster) {
    let presentationId = data.presentationId;
    let sort = data.sort;
    let maxCnt = -1;
    let layoutPageId = data.layoutPageId;
    let stylesPageId = data.stylesPageId;
    let resources = data.resources;
    let settings = {
        fast: true,
        method: 'greedy',
        contentControl: false,
        debug: false,
        putOriginalContent: true,
    };

    if (data.hasOwnProperty('settings')) {
        settings = {
            ...settings,
            ...data.settings,
        };
    }

    if (data.hasOwnProperty('maxCnt')) {
        maxCnt = data.maxCnt;
    }

    if (!templatesLibrary.hasOwnProperty(presentationId)) {
        throw new Error('No such presentation with id: ' + presentationId);
    }
    let templates = templatesLibrary[presentationId];
    return fitToAlternatives_v2(
        resources,
        templates,
        sort,
        maxCnt,
        layoutPageId,
        stylesPageId,
        cluster,
        settings,
    );
}


// explicit

async function explicitGenerateSlideRequests(data, cluster) {
    let presentationId = data.presentationId;
    let targetPageId = data.targetPageId;
    let layout = data.layout;
    let styles = data.styles;
    let pageNum = data.pageNum;
    let resources = data.resources;
    let settings = {
        fast: true,
        method: 'greedy',
        contentControl: false,
        debug: false,
        putOriginalContent: true,
    };

    if (data.hasOwnProperty('settings')) {
        settings = {
            ...settings,
            ...data.settings,
        };
    }

    if (!templatesLibrary.hasOwnProperty(presentationId)) {
        throw new Error('No such presentation with id: ' + presentationId);
    }
    let templates = templatesLibrary[presentationId];
    return await explicitFitToSlide(
        resources,
        templates,
        targetPageId,
        layout,
        styles,
        pageNum,
        cluster,
        settings,
    );
}

module.exports = {
    uploadPresentation,
    generatePresentationRequests,
    generateSlideRequests,
    getDataPresentations,
    getDataSinglePresentation,
    generateAlternativesRequests,
    getDataSingleSlide,

    explicitGenerateSlideRequests,
};