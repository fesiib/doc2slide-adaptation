const { Templates } = require('./Templates');
const { tryFitBody_v2, getSingleTemplateResponse_v2 } = require('./fitContent_internals_v2');

async function fitToPresentation_random(settings, contents, obj, clusterBrowser) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);
    
    let pageSize = templates.getPageSizeInPX();

    let requests = [];
    let matchings = [];
    let mappings = [];

    let results = [];
    let pageNum = 0;

    if (contents.hasOwnProperty('title')) {
        let titleSection = {
            header: { ...contents.title },
            body: [],
        };
        let result = null;
        let fitSessions = [];
        let originalTemplates = templates.getCustomTemplates();
        for (let originalTemplate of originalTemplates) {
            if (!originalTemplate.isTitlePage) {
                continue
            }
            let template = templates.getByOriginalId(originalTemplate.originalId);
            fitSessions.push(tryFitBody_v2(settings, titleSection, 0, template, template, clusterBrowser));
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
        while (done < section.body.length) {
            let iterations = 0;
            let result = null;
            while (iterations < 3) {     
                let template = templates.randomDraw();
                if (template.isTitlePage) {
                    continue
                }
                let current = await tryFitBody_v2(settings, section, done, template, template, clusterBrowser);
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
    obj,
    clusterBrowser,
) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);
    
    let pageSize = templates.getPageSizeInPX();

    let requests = [];
    let matchings = [];
    let mappings = [];

    let results = [];
    let pageNum = 0;

    let originalTemplates = templates.getCustomTemplates();

    if (contents.hasOwnProperty('title')) {
        let titleSection = {
            header: { ...contents.title },
            body: [],
        };
        let result = null;
        let fitSessions = [];
        for (let originalTemplate of originalTemplates) {
            if (!originalTemplate.isTitlePage) {
                continue
            }
            let template = templates.getByOriginalId(originalTemplate.originalId);
            fitSessions.push(tryFitBody_v2(settings, titleSection, 0, template, template, clusterBrowser));
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
        while (done < section.body.length) {
            let fitSessions = [];
            for (let originalTemplate of originalTemplates) {
                if (originalTemplate.isTitlePage) {
                    continue;
                }
                let template = originalTemplate.getFreshJSON();
                fitSessions.push(tryFitBody_v2(settings, section, done, template, template, clusterBrowser));
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
            fitSessions.push(tryFitBody_v2(settings, content, 0, template, template, clusterBrowser));
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
        fitSessions.push(tryFitBody_v2(settings, content, 0, layoutTemplate, stylesTemplate, clusterBrowser));
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

            if (!hasAllNecessary) {
                continue;
            }

            fitSessions.push(tryFitBody_v2(settings, content, 0, layoutTemplate, stylesTemplate, clusterBrowser));
        }
    }

    let results = await Promise.all(fitSessions);

    if (sort) {
        results.sort((p1, p2) => (p2.totalScore - p1.totalScore));
    }

    let was = {};
    
    let pageNum = 0;
    for (let result of results) {
        if (pageNum === maxCnt) {
            break;
        }

        let rep = {
            ...result.score
        };
        delete rep.similarity;
        let repStr = JSON.stringify(rep);
        if (was[repStr] === true) {
            continue;
        }
        was[repStr] = true;

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

async function fitToPresentation_v2(resources, templates, cluster, settings) {
    let fitFunction = fitToPresentation_greedy;
    if (settings.method === 'random') {
        fitFunction = fitToPresentation_random;
    }
    let argCluster = cluster;
    if (settings.fast) {
        argCluster = null;
    }
    return await fitFunction(settings, resources, templates, argCluster);
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
