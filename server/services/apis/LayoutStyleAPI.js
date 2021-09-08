const { adaptDuplicatePresentationRequests, adaptDuplicateAlternativesRequests } = require('../duplicateAdaptation');
const { explicitFitToSlide, explicitFitToAlternatives } = require('../explicitFitContent');
const { getTemplatesData_v2, fitToPresentation_v2, fitToSlide_v2, fitToAlternatives_v2, getTemplateData_v2 } = require('../fitContent_v2');
const { Templates } = require('../Templates');

let templatesLibrary = {};
let presentationsLibrary = {};

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
        let templates = null;
        if (data.userPresentation !== null) {
            templates = Templates.extractTemplates(data.userPresentation);
        }
        if (templates === null) {
            let presentationId = data.presentationId;
            if (!templatesLibrary.hasOwnProperty(presentationId)) {
                throw new Error('No such presentation with id: ' + presentationId);
            }
            templates = { ...templatesLibrary[presentationId] };
        }
        let templatesData = getTemplatesData_v2(templates);
        resolve({
            ...templatesData,
        });
    });
}

async function getDataSingleSlide(data) {
    return new Promise(resolve => {
        let templates = null;
        if (data.userPresentation !== null) {
            templates = Templates.extractTemplates(data.userPresentation);
        }
        if (templates === null) {
            let presentationId = data.presentationId;
            if (!templatesLibrary.hasOwnProperty(presentationId)) {
                throw new Error('No such presentation with id: ' + presentationId);
            }
            templates = { ...templatesLibrary[presentationId] };
        }
        let templatesData = getTemplateData_v2(templates, data.pageId);
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
        presentationsLibrary[presentationId] = { ...presentation };

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
    let userPresentation = data.userPresentation;
    let resources = data.resources;
    let settings = {
        fast: true,
        method: 'greedy',
        contentControl: false,
        debug: false,
        putOriginalContent: true,
        adaptLayout: true,
        adaptStyles: true,
    };
    if (data.hasOwnProperty('settings')) {
        settings = {
            ...settings,
            ...data.settings,
        };
    }

    let templates = null, userTemplates = null;

    if (!settings.adaptLayout || !settings.adaptStyles) {
        if (userPresentation === null) {
            throw new Error('No user Presentation is specified');
        }
        userTemplates = Templates.extractTemplates(userPresentation);
    }
    if (settings.adaptLayout || settings.adaptStyles) {
        if (!templatesLibrary.hasOwnProperty(presentationId)) {
            throw new Error('No such presentation with id: ' + presentationId);
        }
        templates = templatesLibrary[presentationId];
    }
    return fitToPresentation_v2(resources, userTemplates, templates, cluster, settings);
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

    let templates = null;
    if (!templatesLibrary.hasOwnProperty(presentationId)
        && (layout === null || styles === null)
    ) {
        throw new Error('No such presentation with id: ' + presentationId);
    }
    else {
        templates = templatesLibrary[presentationId];
    }
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

async function explicitGenerateAlternativesRequests(data, cluster) {
    let presentationId = data.presentationId;
    let sort = data.sort;
    let maxCnt = -1;
    let layout = data.layout;
    let styles = data.styles;
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

    let templates = null;
    if (!templatesLibrary.hasOwnProperty(presentationId)
        && (layout === null || styles === null)
    ) {
        throw new Error('No such presentation with id: ' + presentationId);
    }
    else {
        templates = templatesLibrary[presentationId];
    }
    return explicitFitToAlternatives(
        resources,
        templates,
        sort,
        maxCnt,
        layout,
        styles,
        cluster,
        settings,
    );
}

async function generateDuplicateAlternativesRequests(data, cluster) {
    let userPresentation = data.userPresentation;
    let presentationId = data.presentationId;
    let sort = data.sort;
    let maxCnt = -1;
    let userPageId = data.userPageId;
    let styles = data.styles;
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

    if (!presentationsLibrary.hasOwnProperty(presentationId)) {
        throw new Error('No such presentation with id: ' + presentationId);
    }

    let templates = { ...templatesLibrary[presentationId] };
    let presentation = { ...presentationsLibrary[presentationId] };

    return adaptDuplicateAlternativesRequests(
        userPresentation,
        presentation,
        resources,
        templates,
        sort,
        maxCnt,
        userPageId,
        styles,
        cluster,
        settings,
    );
}

async function generateDuplicatePresentationRequests(data, cluster) {
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
    if (!presentationsLibrary.hasOwnProperty(presentationId)) {
        throw new Error('No such presentation with id: ' + presentationId);
    }

    let templates = { ...templatesLibrary[presentationId] };
    let presentation = { ...presentationsLibrary[presentationId] };

    return adaptDuplicatePresentationRequests(presentation, resources, templates, cluster, settings);
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
    explicitGenerateAlternativesRequests,

    generateDuplicatePresentationRequests,
    generateDuplicateAlternativesRequests,
};