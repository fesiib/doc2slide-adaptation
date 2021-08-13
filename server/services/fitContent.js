const { Templates } = require('./Templates');
const { tryFitBody, getSingleTemplateResponse } = require('./fitContent_internals');

async function fitToPresentation_random(settings, contents, obj, clusterBrowser) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);
    
    let pageSize = templates.getPageSizeInPX();

    let requests = [];
    let matching = [];
    let matchedList = [];

    let results = [];
    let pageNum = 0;

    if (contents.hasOwnProperty('title')) {
        let titleSection = {
            header: { ...contents.title },
            body: [],
        };
        let result = null;
        let originalTemplates = templates.getCustomTemplates();
        for (let originalTemplate of originalTemplates) {
            if (!originalTemplate.isTitlePage) {
                continue
            }
            let template = templates.copySingleTemplate(originalTemplate);
            let current = await tryFitBody(settings, titleSection, 0, template, clusterBrowser);
            if (result === null || result.totalScore < current.totalScore) {
                result = current;
            }
        }
        if (result !== null) {
            pageNum++;
            results.push(getSingleTemplateResponse(result, null, pageNum, pageSize));
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
                let current = await tryFitBody(settings, section, done, template, clusterBrowser);
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
                results.push(getSingleTemplateResponse(result, null, pageNum, pageSize));    
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
        matching.push({ ...result.matching });
        matchedList.push(result.matched);
    }

    return {
        requests,
        matching,
        matchedList,
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
    let matching = [];
    let matchedList = [];

    let results = [];
    let pageNum = 0;

    let originalTemplates = templates.getCustomTemplates();

    if (contents.hasOwnProperty('title')) {
        let titleSection = {
            header: { ...contents.title },
            body: [],
        };
        let result = null;
        for (let originalTemplate of originalTemplates) {
            if (!originalTemplate.isTitlePage) {
                continue
            }
            let template = templates.copySingleTemplate(originalTemplate);
            let current = await tryFitBody(settings, titleSection, 0, template, clusterBrowser);
            if (result === null || result.totalScore < current.totalScore) {
                result = current;
            }
        }
        if (result !== null) {
            pageNum++;
            results.push(getSingleTemplateResponse(result, null, pageNum, pageSize));
        }
    }

    for (let section of contents.sections) {
        let done = 0;
        while (done < section.body.length) {
            let result = null;
            for (let originalTemplate of originalTemplates) {
                if (originalTemplate.isTitlePage) {
                    continue;
                }
                let template = templates.copySingleTemplate(originalTemplate);
                let current = await tryFitBody(settings, section, done, template, clusterBrowser);
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
                results.push(getSingleTemplateResponse(result, null, pageNum, pageSize));
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
        matching.push({ ...result.matching });
        matchedList.push(result.matched);
    }

    return {
        requests,
        matching,
        matchedList,
    };
}


async function fitToSlide_random(
    settings,
    content,
    obj,
    targetPageId,
    sourcePageId,
    pageNum,
    clusterBrowser,
) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);

    let pageSize = templates.getPageSizeInPX();

    let template = templates.getByOriginalId(sourcePageId);

    let result = await tryFitBody(settings, content, 0, template, clusterBrowser);
    //console.log('Fitted', 0, result.done, result);
    return getSingleTemplateResponse(result, targetPageId, pageNum, pageSize);
}

async function fitToBestSlide_total(
    settings,
    content,
    obj,
    targetPageId,
    pageNum,
    clusterBrowser
) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);

    let pageSize = templates.getPageSizeInPX();

    let poolTemplates = templates.getTemplates();

    let fitSessions = [];
    for (let original of poolTemplates) {
        let template = templates.copySingleTemplate(original);
        fitSessions.push(tryFitBody(settings, content, 0, template, clusterBrowser));
    }

    let results = await Promise.all(fitSessions);

    let finalResult = null;

    for (let result of results) {
        if (finalResult === null || result.totalScore > finalResult.totalScore) {
            finalResult = result;
        }
    }
    return getSingleTemplateResponse(finalResult, targetPageId, pageNum, pageSize);
}

async function fitToAllSlides_random(settings, content, obj, sort, clusterBrowser) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);
    
    let pageSize = templates.getPageSizeInPX();

    let poolTemplates = templates.getCustomTemplates();

    let requests = [];
    let matching = [];
    let matchedList = [];

    let fitBodySessions = [];

    for (let original of poolTemplates) {
        let template = templates.copySingleTemplate(original);
        fitBodySessions.push(tryFitBody(settings, content, 0, template, clusterBrowser));
    }

    let results = await Promise.all(fitBodySessions);

    if (sort) {
        results.sort((p1, p2) => (p2.totalScore - p1.totalScore));
    }
    
    let pageNum = 0;
    for (let result of results) {
        pageNum++;
        let response = getSingleTemplateResponse(result, null, pageNum, pageSize);

        requests = requests.concat(response.requests);
        matching.push({ ...response.matching });
        matchedList.push(response.matched);
    }

    return {
        requests,
        matching,
        matchedList,
    };
}

function getPageIds(obj) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);
    let originalTemplates = templates.getCustomTemplates();
    
    let pageIds = [];
    for (let template of originalTemplates) {
        pageIds.push({
            pageId: template.originalId,
            pageNum: template.pageNum,
            isTitlePage: template.isTitlePage,
        });
    }
    return pageIds;
}

async function fitToPresentation(resources, templates, cluster, settings) {
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

async function fitToSlide(
    resources,
    templates,
    targetPageId,
    sourcePageId,
    pageNum,
    cluster,
    settings,
) {

    let fitFunction = fitToSlide_random;

    let argCluster = cluster;
    if (settings.fast) {
        argCluster = null;
    }

    return await fitFunction(
        settings,
        resources,
        templates,
        targetPageId,
        sourcePageId,
        pageNum,
        argCluster,
    );
}

async function fitToBestSlide(
    resources, 
    templates,
    targetPageId,
    pageNum,
    cluster,
    settings,
) {

    let fitFunction = fitToBestSlide_total;
    
    let argCluster = cluster;
    if (settings.fast) {
        argCluster = null;
    }

    return await fitFunction(
        settings,
        resources,
        templates,
        targetPageId,
        pageNum,
        argCluster,
    );    
}

async function fitToAllSlides(
    resources,
    templates,
    sort,
    cluster,
    settings,
) {

    let fitFunction = fitToAllSlides_random;

    let argCluster = cluster;
    if (settings.fast) {
        argCluster = null;
    }

    return await fitFunction(
        settings,
        resources,
        templates,
        sort,
        argCluster,
    );
}

module.exports = {
    fitToPresentation,
    fitToSlide,
    fitToBestSlide,
    fitToAllSlides,
    getPageIds,
};
