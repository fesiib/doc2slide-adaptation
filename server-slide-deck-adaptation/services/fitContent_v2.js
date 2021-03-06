const { Templates } = require('./Templates');
const { fitToPage, getSingleTemplateResponse_v2, getMappingPreserveType_DP, getMappingNoPreserveType_DP } = require('./fitContent_internals_v2');
const { explicitFitToSlide_total, explicitFitToAlternatives_random, explicitFitToAlternatives_modfiy_single_type } = require('./explicitFitContent');
const { randomInt } = require('mathjs');
const { stylesToTextStyle, areSimilarObjs } = require('./Template');

async function fitToPresentation_random(
    settings,
    contents, 
    userTemplates,
    referenceTemplates,
    pageSize,
    clusterBrowser,
) {
    let requests = [];
    let matchings = [];
    let mappings = [];

    let results = [];
    let pageNum = 0;

    let templates = [], originalTemplates = [];

    if (referenceTemplates !== null) {
        templates = referenceTemplates.getCustomTemplates();
    }

    if (userTemplates !== null) {
        originalTemplates = userTemplates.getCustomTemplates();
    }

    if (contents.hasOwnProperty('title')) {
        let titleSection = {
            header: { ...contents.title },
            body: [],
        };
        let result = null;
        let fitSessions = [];
        for (let template of templates) {
            let referenceTemplate = template.getFreshJSON();
            if (!referenceTemplate.isTitlePage) {
                continue;
            }

            let originalTemplate = null;
            
            if (pageNum < originalTemplates.length) {
                originalTemplate = originalTemplates[pageNum].getFreshJSON();
                if (!originalTemplate.isTitlePage) {
                    continue;
                }    
            }
            else {
                originalTemplate = referenceTemplate.getFreshJSON();
            }
            
            if (!settings.adaptLayout) {
                fitSessions.push(fitToPage(settings, getMappingPreserveType_DP, titleSection, 0, originalTemplate, referenceTemplate, clusterBrowser));
            }
            else if (!settings.adaptStyles) {
                fitSessions.push(fitToPage(settings, getMappingPreserveType_DP, titleSection, 0, referenceTemplate, originalTemplate, clusterBrowser));
            }
            else {
                fitSessions.push(fitToPage(settings, getMappingPreserveType_DP, titleSection, 0, referenceTemplate, referenceTemplate, clusterBrowser));
            }
        }
        let fitResults = await Promise.all(fitSessions);
        for (let current of fitResults) {
            if (result === null || result.totalScore < current.totalScore) {
                result = current;
            }
        }
        if (result !== null) {
            pageNum++;
            results.push(getSingleTemplateResponse_v2(settings, result, null, pageNum, pageSize));
        }
    }

    for (let section of contents.sections) {
        let done = 0;
        let mapToSingleSlide = false;
        if (section.hasOwnProperty('mapToSingleSlide')) {
            mapToSingleSlide = section.mapToSingleSlide;
        }
        while (done < section.body.length) {
            let iterations = 0;
            let result = null;
            while (iterations < 3) {     
                let randIdx = randomInt(0, templates.length);
                let referenceTemplate = templates[randIdx].getFreshJSON();
                if (referenceTemplate.isTitlePage) {
                    continue
                }
                let originalTemplate = null;
            
                if (pageNum < originalTemplates.length) {
                    originalTemplate = originalTemplates[pageNum].getFreshJSON();
                    if (originalTemplate.isTitlePage) {
                        continue;
                    }    
                }
                else {
                    originalTemplate = referenceTemplate.getFreshJSON();
                }
                let currentSession = null;

                if (!settings.adaptLayout) {
                    currentSession = fitToPage(settings, getMappingPreserveType_DP, section, done, originalTemplate, referenceTemplate, clusterBrowser);
                }
                else if (!settings.adaptStyles) {
                    currentSession = fitToPage(settings, getMappingPreserveType_DP, section, done, referenceTemplate, originalTemplate, clusterBrowser);
                }
                else {
                    currentSession = fitToPage(settings, getMappingPreserveType_DP, section, done, referenceTemplate, referenceTemplate, clusterBrowser);
                }

                let current = await currentSession;

                if (current.done === done) {
                    continue;
                }
                if (result === null || result.totalScore < current.totalScore) {
                    result = current;
                }
                if (result.totalScore >= 90.0) {
                    break;
                }
                iterations++;
            }
            if (result !== null) {
                pageNum++; 
                done = result.done;
                results.push(getSingleTemplateResponse_v2(settings, result, null, pageNum, pageSize));
                if (mapToSingleSlide) {
                    break;
                }
            }
            else {
                break;
            }
        }
        if (done < section.body.length) {
            console.log("Could not fit\n");
        }
    }

    for (let result of results) {
        requests = requests.concat(result.requests);
        matchings.push({ ...result.matching });
        mappings.push({ ...result.mapping });
    }

    return {
        requests,
        matchings,
        mappings,
    };
}

async function fitToPresentation_greedy(
    settings,
    contents,
    userTemplates,
    referenceTemplates,
    pageSize,
    clusterBrowser,
) {
    let requests = [];
    let matchings = [];
    let mappings = [];

    let results = [];
    let pageNum = 0;

    let templates = [], originalTemplates = [];

    if (referenceTemplates !== null) {
        templates = referenceTemplates.getCustomTemplates();
    }

    if (userTemplates !== null) {
        originalTemplates = userTemplates.getCustomTemplates();
    }

    if (contents.hasOwnProperty('title')) {
        let titleSection = {
            header: { ...contents.title },
            body: [],
        };
        let result = null;
        let fitSessions = [];
        for (let template of templates) {
            let referenceTemplate = template.getFreshJSON();
            if (!referenceTemplate.isTitlePage) {
                continue;
            }
            let originalTemplate = null;
            
            if (pageNum < originalTemplates.length) {
                originalTemplate = originalTemplates[pageNum].getFreshJSON();
                if (!originalTemplate.isTitlePage) {
                    continue;
                }    
            }
            else {
                originalTemplate = referenceTemplate.getFreshJSON();
            }
            
            if (!settings.adaptLayout) {
                fitSessions.push(fitToPage(settings, getMappingPreserveType_DP, titleSection, 0, originalTemplate, referenceTemplate, clusterBrowser));
            }
            else if (!settings.adaptStyles) {
                fitSessions.push(fitToPage(settings, getMappingPreserveType_DP, titleSection, 0, referenceTemplate, originalTemplate, clusterBrowser));
            }
            else {
                fitSessions.push(fitToPage(settings, getMappingPreserveType_DP, titleSection, 0, referenceTemplate, referenceTemplate, clusterBrowser));
            }
        }
        let fitResults = await Promise.all(fitSessions);
        for (let current of fitResults) {
            if (result === null || result.totalScore < current.totalScore) {
                result = current;
            }
        }
        if (result !== null) {
            pageNum++;
            results.push(getSingleTemplateResponse_v2(settings, result, null, pageNum, pageSize));
        }
    }
    for (let section of contents.sections) {
        let done = 0;
        let mapToSingleSlide = false;
        if (section.hasOwnProperty('mapToSingleSlide')) {
            mapToSingleSlide = section.mapToSingleSlide;
        }
        while (done < section.body.length) {
            let fitSessions = [];
            for (let template of templates) {
                let referenceTemplate = template.getFreshJSON();
                if (referenceTemplate.isTitlePage) {
                    continue;
                }
                
                let originalTemplate = null;
            
                if (pageNum < originalTemplates.length) {
                    originalTemplate = originalTemplates[pageNum].getFreshJSON();
                    if (originalTemplate.isTitlePage) {
                        continue;
                    }    
                }
                else {
                    originalTemplate = referenceTemplate.getFreshJSON();
                }
                
                if (!settings.adaptLayout) {
                    fitSessions.push(fitToPage(settings, getMappingPreserveType_DP, section, done, originalTemplate, referenceTemplate, clusterBrowser));
                }
                else if (!settings.adaptStyles) {
                    fitSessions.push(fitToPage(settings, getMappingPreserveType_DP, section, done, referenceTemplate, originalTemplate, clusterBrowser));
                }
                else {
                    fitSessions.push(fitToPage(settings, getMappingPreserveType_DP, section, done, referenceTemplate, referenceTemplate, clusterBrowser));
                }
            }
            let fitResults = await Promise.all(fitSessions);

            let result = null;
            for (let current of fitResults) {
                if (current.done <= done) {
                    continue;
                }
                if (result === null || result.totalScore < current.totalScore) {
                    result = current;
                }
            }
            if (result !== null) {
                pageNum++;
                done = result.done;
                results.push(getSingleTemplateResponse_v2(settings, result, null, pageNum, pageSize));
                if (mapToSingleSlide) {
                    break;
                }
            }
            else {
                break;
            }
        }
        if (done < section.body.length) {
            console.log("Could not fit\n");
        }
    }

    for (let result of results) {
        requests = requests.concat(result.requests);
        matchings.push({ ...result.matching });
        mappings.push({ ...result.mapping });
    }

    return {
        requests,
        matchings,
        mappings,
    };
}

async function fitToSlide_experimental(
    settings,
    content,
    obj,
    targetPageId,
    layoutPageId,
    stylesPageId,
    pageNum,
    clusterBrowser,
) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);

    let layout = null, styles = null;

    if (layoutPageId !== null) {
        let template = templates.getByOriginalId(layoutPageId);
        layout = template.getLayoutJSON();
    }

    if (stylesPageId !== null) {
        let template = templates.getByOriginalId(stylesPageId);
        styles = template.getStylesJSON(true);
    }
    return explicitFitToSlide_total(settings, content, obj, targetPageId, layout, styles, pageNum, clusterBrowser);
}

async function fitToSlide_total(
    settings,
    content,
    obj,
    targetPageId,
    layoutPageId,
    stylesPageId,
    pageNum,
    clusterBrowser,
) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);

    let pageSize = templates.getPageSizeInPX();

    let originalTemplates = templates.getCustomTemplates();

    let fitSessions = [];

    if (layoutPageId === null && stylesPageId === null) {
        for (let originalTemplate of  originalTemplates) {
            let template = originalTemplate.getFreshJSON();
            fitSessions.push(fitToPage(settings, getMappingPreserveType_DP, content, 0, template, template, clusterBrowser));
        }
    }
    else {
        if (layoutPageId === null) {
            layoutPageId = stylesPageId;
        }
        if (stylesPageId === null) {
            stylesPageId = layoutPageId;
        }
        layoutTemplate = templates.getByOriginalId(layoutPageId);
        stylesTemplate = templates.getByOriginalId(stylesPageId);
        fitSessions.push(fitToPage(settings, getMappingPreserveType_DP, content, 0, layoutTemplate, stylesTemplate, clusterBrowser));
    }

    let results = await Promise.all(fitSessions);

    let finalResult = null;

    for (let result of results) {
        if (finalResult === null || result.totalScore > finalResult.totalScore) {
            finalResult = result;
        }
    }
    return getSingleTemplateResponse_v2(settings, finalResult, targetPageId, pageNum, pageSize);
}


async function fitToAlternatives_experimental(
    settings,
    content,
    obj,
    sort,
    maxCnt,
    layoutPageId,
    stylesPageId,
    clusterBrowser
) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);

    let layout = null, styles = null;

    if (layoutPageId !== null) {
        let template = templates.getByOriginalId(layoutPageId);
        layout = template.getLayoutJSON();
    }

    if (stylesPageId !== null) {
        let template = templates.getByOriginalId(stylesPageId);
        styles = template.getStylesJSON(true);
    }
    return explicitFitToAlternatives_modfiy_single_type(settings, content, obj, sort, maxCnt, layout, styles, clusterBrowser);
}

async function fitToAlternatives_random(
    settings,
    content,
    obj,
    sort,
    maxCnt,
    layoutPageId,
    stylesPageId,
    clusterBrowser
) {
    return fitToAlternatives_experimental(settings, content, obj, sort, maxCnt, layoutPageId, stylesPageId, clusterBrowser);
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);
    
    let pageSize = templates.getPageSizeInPX();

    let layoutTemplates = templates.getUniqueLayoutTemplates();

    let stylesTemplates = templates.getUniqueStylesTemplates();

    let requestsList = [];
    let matchings = [];
    let mappings = [];

    let fitSessions = [];

    for (let layoutIdx = 0; layoutIdx < (layoutPageId === null ? layoutTemplates.length : 1); layoutIdx++) {
        let fittedStylesList = [];
        for (let stylesIdx = 0; stylesIdx < (stylesPageId === null ? stylesTemplates.length : 1); stylesIdx++) {
            let layoutTemplate = null;
            if (layoutPageId === null) {
                layoutTemplate = layoutTemplates[layoutIdx].getFreshJSON();
            }
            else {
                layoutTemplate = templates.getByOriginalId(layoutPageId);
            }
            
            let stylesTemplate = null;
            if (stylesPageId === null) {
                stylesTemplate = stylesTemplates[stylesIdx].getFreshJSON();
            }
            else {
                stylesTemplate = templates.getByOriginalId(stylesPageId);
            }

            let originalStyles = layoutTemplate.getStylesJSON(true);
            let targetStyles = stylesTemplate.getStylesJSON(true);

            hasAllNecessary = true;
            for (let field in originalStyles.styles) {
                if (!targetStyles.styles.hasOwnProperty(field)) {
                    hasAllNecessary = false;
                }
            }

            if (!hasAllNecessary
                && (
                    layoutPageId === null
                    || stylesPageId === null
                )
            ) {
                continue;
            }

            let skip = false;
            for (let fittedStyles of fittedStylesList) {
                let totallySimilar = true;
                for (let field in originalStyles.styles) {
                    let fitted = stylesToTextStyle(fittedStyles.styles[field]);
                    let target = stylesToTextStyle(targetStyles.styles[field]);
                    if (!areSimilarObjs(fitted, target, 0.5)) {
                        totallySimilar = false;
                        break;
                    }
                }
                if (totallySimilar) {
                    skip = true;
                    break;
                }
            }
            if (skip) {
                continue;
            }

            fittedStylesList.push(targetStyles);

            fitSessions.push(fitToPage(settings, getMappingNoPreserveType_DP, content, 0, layoutTemplate, stylesTemplate, clusterBrowser));
        }
    }

    let results = await Promise.all(fitSessions);

    if (sort) {
        results.sort((p1, p2) => (p2.totalScore - p1.totalScore));
    }
    
    let pageNum = 0;
    for (let result of results) {
        if (pageNum === maxCnt) {
            break;
        }

        pageNum++;
        let response = getSingleTemplateResponse_v2(settings, result, null, pageNum, pageSize);

        requestsList.push({
            pageId: response.matching.objectId,
            requests: response.requests,
        });
        matchings.push({ ...response.matching });
        mappings.push({ ...response.mapping });
    }

    return {
        requestsList,
        matchings,
        mappings,
    };
}

function getTemplatesData_v2(obj) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);
    return {
        layouts: templates.getLayouts(),
        styles: templates.getStyles(),
    };
}

function getTemplateData_v2(obj, pageId) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);
    return {
        layout: templates.getLayoutByOriginalId(pageId),
        styles: templates.getStylesByOriginalId(pageId),
    }
}

async function fitToPresentation_v2(resources, userTemplates, templates, cluster, settings) {
    let fitFunction = fitToPresentation_greedy;
    if (settings.method === 'random') {
        fitFunction = fitToPresentation_random;
    }
    let argCluster = cluster;
    if (settings.fast) {
        argCluster = null;
    }
    
    let referenceTemplates = null;
    
    if (templates !== null) {
        referenceTemplates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
        referenceTemplates.copyInstance(templates);
    }

    let pageSize = null;

    if (!settings.adaptLayout && !settings.adaptStyles) {
        referenceTemplates = userTemplates;
        settings.adaptLayout = true;
        settings.adaptStyles = true;
    }

    if (settings.adaptLayout) {
        pageSize = referenceTemplates.getPageSizeInPX();
    }
    else {
        pageSize = userTemplates.getPageSizeInPX();
    }

    return await fitFunction(settings, resources, userTemplates, referenceTemplates, pageSize, argCluster);
}

async function fitToSlide_v2(
    resources,
    templates,
    targetPageId,
    layoutPageId,
    stylesPageId,
    pageNum,
    cluster,
    settings,
) {

    let fitFunction = fitToSlide_total;

    let argCluster = cluster;
    if (settings.fast) {
        argCluster = null;
    }

    return await fitFunction(
        settings,
        resources,
        templates,
        targetPageId,
        layoutPageId,
        stylesPageId,
        pageNum,
        argCluster,
    );
}

async function fitToAlternatives_v2(
    resources,
    templates,
    sort,
    maxCnt,
    layoutPageId,
    stylesPageId,
    cluster,
    settings,
) {

    let fitFunction = fitToAlternatives_random;

    let argCluster = cluster;
    if (settings.fast) {
        argCluster = null;
    }

    return await fitFunction(
        settings,
        resources,
        templates,
        sort,
        maxCnt,
        layoutPageId,
        stylesPageId,
        argCluster,
    );
}

module.exports = {
    fitToPresentation_v2,
    fitToSlide_v2,
    getTemplatesData_v2,
    fitToAlternatives_v2,
    getTemplateData_v2,
};
