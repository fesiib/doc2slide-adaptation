const { Templates } = require('./Templates');

const { getMappingPreserveType_DP, fitToPage, getMappingNoPreserveType_DP } = require('./fitContent_internals_v2');
const { Template } = require('./Template');

function updateDuplicatePresentationRequests(presentation, presentationPages) {
    if (!Array.isArray(presentation.slides)) {
        return [];
    }
    let requests = [];
    for (let page of presentationPages) {
        requests.push({
            duplicateObject: {
                objectId: page.originalId,
                objectIds: {
                    ...page.objectIdsMappings,
                },
            }
        });
    }
    for (let page of presentation.slides) {
        requests.push({
            deleteObject: {
                objectId: page.objectId,
            },
        });
    }

    let insertionIndex = 0;
    for (let page of presentationPages) {
        requests.push({
            updateSlidesPosition: {
                slideObjectIds: [page.objectId],
                insertionIndex,
            },
        });
        insertionIndex++;
    }
    return requests;
}

async function adaptDuplicatePresentationRequests_greedy(
    settings,
    contents,
    obj,
    clusterBrowser,
) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);

    let results = [];

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
            let template = originalTemplate.getFreshJSON();
            fitSessions.push(fitToPage(settings, getMappingPreserveType_DP, titleSection, 0, template, template, clusterBrowser));
        }
        let fitResults = await Promise.all(fitSessions);
        for (let current of fitResults) {
            if (result === null || result.totalScore < current.totalScore) {
                result = current;
            }
        }
        if (result !== null) {
            results.push(result);
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
            for (let originalTemplate of originalTemplates) {
                if (originalTemplate.isTitlePage) {
                    continue;
                }
                let template = originalTemplate.getFreshJSON();
                fitSessions.push(fitToPage(settings, getMappingPreserveType_DP, section, done, template, template, clusterBrowser));
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
                done = result.done;
                results.push(result);
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

    let requests = [];
    let matchings = [];
    let mappings = [];

    let pageNum = 0;
    for (let result of results) {
        pageNum++;
        let matching = {
            pageElements: { ...result.matching },
            totalScore: result.totalScore,
            layoutPageId: result.layoutTemplate.originalId,
            stylesPageId: result.stylesTemplate.originalId,
            pageNum: pageNum,
            objectId: result.layoutTemplate.pageId,
            objectIdsMappings: result.layoutTemplate.getObjectIdsMapping(),
        };
        matchings.push({ ...matching });
        mappings.push({ ...result.mapping });
        requests = requests.concat(result.requests);
    }

    return {
        requests,
        matchings,
        mappings,
    };
}

async function adaptDuplicateAlternativesRequests_random(
    settings,
    content,
    sort,
    maxCnt,
    layoutTemplates,
    stylesTemplates,
    clusterBrowser
) {
    let fitSessions = [];

    for (let originalLayoutTemplate of layoutTemplates) {
        for (let originalStylesTemplate of stylesTemplates) {
            let layoutTemplate = originalLayoutTemplate.getFreshJSON();
            let stylesTemplate = originalStylesTemplate.getFreshJSON();
            let originalStyles = layoutTemplate.getStylesJSON(true);
            let targetStyles = stylesTemplate.getStylesJSON(true);

            let hasAllNecessary = true;
            for (let field in originalStyles.styles) {
                if (!targetStyles.styles.hasOwnProperty(field)) {
                    hasAllNecessary = false;
                }
            }

            if (!hasAllNecessary) {
                continue;
            }
            fitSessions.push(fitToPage(settings, getMappingNoPreserveType_DP, content, 0, layoutTemplate, stylesTemplate, clusterBrowser));
        }
    }

    let results = await Promise.all(fitSessions);

    if (sort) {
        results.sort((p1, p2) => (p2.totalScore - p1.totalScore));
    }

    let was = {};
    let pageNum = 0;
    let requestsList = [];
    let matchings = [];
    let mappings = [];

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
        let matching = {
            pageElements: { ...result.matching },
            totalScore: result.totalScore,
            layoutPageId: result.layoutTemplate.originalId,
            stylesPageId: result.stylesTemplate.originalId,
            pageNum: pageNum,
            objectId: result.layoutTemplate.pageId,
            objectIdsMappings: result.layoutTemplate.getObjectIdsMapping(),
        };
        matchings.push({ ...matching });
        mappings.push({ ...result.mapping });
        requestsList.push({
            pageId: matching.objectId,
            requests: result.requests,
        });
    }

    return {
        requestsList,
        matchings,
        mappings,
    };
}

async function adaptDuplicatePresentationRequests(presentation, resources, templates, cluster, settings) {
    let adaptFunction = adaptDuplicatePresentationRequests_greedy;
    // if (settings.method === 'random') {
    //     adaptFunction;
    // }
    let argCluster = cluster;
    if (settings.fast) {
        argCluster = null;
    }

    let adaptingInformation = await adaptFunction(settings, resources, templates, argCluster);

    presentationPages = [];

    for (let matching of adaptingInformation.matchings) {
        presentationPages.push({
            originalId: matching.layoutPageId,
            objectId: matching.objectId,
            objectIdsMappings: matching.objectIdsMappings,
        });
    }

    let requests = updateDuplicatePresentationRequests(presentation, presentationPages);

    adaptingInformation.requests = requests.concat(adaptingInformation.requests);
    return adaptingInformation;
}

async function adaptDuplicateAlternativesRequests(
    userPresentation,
    presentation,
    resources,
    obj,
    sort,
    maxCnt,
    userPageId,
    styles,
    cluster,
    settings,
) {
    let adaptFunction = adaptDuplicateAlternativesRequests_random;
    let argCluster = cluster;
    if (settings.fast) {
        argCluster = null;
    }

    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);

    let adaptingInformation = null;
    let layoutTemplates = templates.getUniqueLayoutTemplates();
    let stylesTemplates = templates.getUniqueStylesTemplates();
    
    if (userPageId !== null) {
        // work with userPresentation
        let userTemplates = Templates.extractTemplates(userPresentation);
        layoutTemplates = [userTemplates.getByOriginalId(userPageId)];
        presentation = userPresentation;
    }

    if (styles !== null) {
        // let stylesTemplate = (templates.getByOriginalId(styles));
        // styles = stylesTemplate.getStylesJSON(true);
        let newStylesTemplate = Template.fromStylesJSON(styles, templates.getPageSizeInPX());
        stylesTemplates = [newStylesTemplate];
    }

    adaptingInformation = await adaptFunction(settings, resources, sort, maxCnt, layoutTemplates, stylesTemplates, argCluster);
    
    presentationPages = [];

    for (let matching of adaptingInformation.matchings) {
        presentationPages.push({
            originalId: matching.layoutPageId,
            objectId: matching.objectId,
            objectIdsMappings: matching.objectIdsMappings,
        });
    }

    let setupRequests = updateDuplicatePresentationRequests(presentation, presentationPages);

    return {
        setupRequests,
        ...adaptingInformation,
    };
}

module.exports = {
    adaptDuplicatePresentationRequests,
    adaptDuplicateAlternativesRequests,
};