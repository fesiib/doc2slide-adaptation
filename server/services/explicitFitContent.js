const { Templates } = require('./Templates');
const { fitToPage, getSingleTemplateResponse_v2, getMappingPreserveType_DP, getMappingNoPreserveType_DP } = require('./fitContent_internals_v2');
const { Template } = require('./Template');

async function explicitFitToSlide_total(
    settings,
    content,
    obj,
    targetPageId,
    layout,
    styles,
    pageNum,
    clusterBrowser,
) {
    let pageSize = null;
    let fitSessions = [];
    if (layout !== null && styles !== null) {
        let layoutTemplate = Template.fromLayoutJSON(layout);
        pageSize = layoutTemplate.getPageSizeInPX();
        let stylesTemplate = Template.fromStylesJSON(styles, { ...pageSize });
        fitSessions.push(fitToPage(settings, getMappingPreserveType_DP, content, 0, layoutTemplate, stylesTemplate, clusterBrowser));
    }
    else {
        let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
        templates.copyInstance(obj);

        pageSize = templates.getPageSizeInPX();
        let originalTemplates = templates.getCustomTemplates();

        for (let originalTemplate of originalTemplates) {
            let layoutTemplate = null, stylesTemplate = null;
                if (layout !== null) {
                    layoutTemplate = Template.fromLayoutJSON(layout);
                }
                else {
                    layoutTemplate = originalTemplate.getFreshJSON();
                }
                if (styles !== null) {
                    stylesTemplate = Template.fromStylesJSON(styles, { ...pageSize });
                }
                else {
                    stylesTemplate = originalTemplate.getFreshJSON();
                }
                fitSessions.push(fitToPage(settings, getMappingPreserveType_DP, content, 0, layoutTemplate, stylesTemplate, clusterBrowser));
            
        }
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


async function explicitFitToAlternatives_random(
    settings,
    content,
    obj,
    sort,
    maxCnt,
    layout,
    styles,
    clusterBrowser
) {
    let pageSize = null;
    let fitSessions = [];

    if (layout !== null && styles !== null) {
        let layoutTemplate = Template.fromLayoutJSON(layout);
        pageSize = layoutTemplate.getPageSizeInPX();
        let stylesTemplate = Template.fromStylesJSON(styles, { ...pageSize });
        fitSessions.push(fitToPage(settings, getMappingPreserveType_DP, content, 0, layoutTemplate, stylesTemplate, clusterBrowser));
    }
    else {
        let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
        templates.copyInstance(obj);

        pageSize = templates.getPageSizeInPX();
        
        let layoutTemplates = templates.getUniqueLayoutTemplates();

        let stylesTemplates = templates.getUniqueStylesTemplates();

        for (let layoutIdx = 0; layoutIdx < (layout === null ? layoutTemplates.length : 1); layoutIdx++) {
            for (let stylesIdx = 0; stylesIdx < (styles === null ? stylesTemplates.length : 1); stylesIdx++) {
                let layoutTemplate = null;
                if (layout === null) {
                    layoutTemplate = layoutTemplates[layoutIdx].getFreshJSON();
                    // let tempLayout = layoutTemplate.getLayoutJSON();
                    // layoutTemplate = Template.fromLayoutJSON(tempLayout);
                }
                else {
                    layoutTemplate = Template.fromLayoutJSON(layout);
                }
                let stylesTemplate = null;
                if (styles === null) {
                    stylesTemplate = stylesTemplates[stylesIdx].getFreshJSON();
                    // let tempStyles = stylesTemplate.getStylesJSON(true);
                    // stylesTemplate = Template.fromStylesJSON(tempStyles, templates.getPageSizeInPX());
                }
                else {
                    stylesTemplate = Template.fromStylesJSON(styles, { ...pageSize });
                }

                let originalStyles = layoutTemplate.getStylesJSON(true);
                let targetStyles = stylesTemplate.getStylesJSON(true);

                let hasAllNecessary = true;
                for (let field in originalStyles.styles) {
                    if (!targetStyles.styles.hasOwnProperty(field)) {
                        hasAllNecessary = false;
                    }
                }

                if (!hasAllNecessary
                    && (
                        layout === null
                        || styles === null
                    )
                ) {
                    continue;
                }

                fitSessions.push(fitToPage(settings, getMappingNoPreserveType_DP, content, 0, layoutTemplate, stylesTemplate, clusterBrowser));
            }
        }
    }

    let requestsList = [];
    let matchings = [];
    let mappings = [];

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

async function explicitFitToSlide(
    resources,
    templates,
    targetPageId,
    layout,
    styles,
    pageNum,
    cluster,
    settings,
) {

    let explicitFitFunction = explicitFitToSlide_total;

    let argCluster = cluster;
    if (settings.fast) {
        argCluster = null;
    }

    return await explicitFitFunction(
        settings,
        resources,
        templates,
        targetPageId,
        layout,
        styles,
        pageNum,
        argCluster,
    );
}

async function explicitFitToAlternatives(
    resources,
    templates,
    sort,
    maxCnt,
    layout,
    styles,
    cluster,
    settings,
) {

    let explicitFitFunction = explicitFitToAlternatives_random;

    let argCluster = cluster;
    if (settings.fast) {
        argCluster = null;
    }

    return await explicitFitFunction(
        settings,
        resources,
        templates,
        sort,
        maxCnt,
        layout,
        styles,
        argCluster,
    );
}

module.exports = {
    explicitFitToSlide,
    explicitFitToSlide_total,
    explicitFitToAlternatives_random,
    explicitFitToAlternatives,
};
