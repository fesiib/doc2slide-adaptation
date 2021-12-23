const { Templates } = require('./Templates');
const { fitToPage, getSingleTemplateResponse_v2, getMappingPreserveType_DP, getMappingNoPreserveType_DP } = require('./fitContent_internals_v2');
const { Template, areSimilarObjs, stylesToTextStyle, IMAGE_PLACEHOLDER, BODY_PLACEHOLDER } = require('./Template');

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

async function explicitFitToAlternatives_modify_type(
    settings,
    content,
    obj,
    sort,
    maxCnt,
    layout,
    styles,
    clusterBrowser,
    possibleChanges,
    perChangePageNum,
) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    if (layout === null || styles === null) {
        templates.copyInstance(obj);
    }

    let requestsList = [];
    let matchings = [];
    let mappings = [];
    let pageNum = 0;

    for (let possibleChange of possibleChanges) {
        if (possibleChange !== null) {
            for (let singleChange of possibleChange) {
                content.body[singleChange.position].paragraph.type = 'ANY';
                content.body[singleChange.position].paragraph.format = singleChange.format;
            }
        }
        let pageSize = null;
        let fitSessions = [];
        if (layout !== null && styles !== null) {
            let layoutTemplate = Template.fromLayoutJSON(layout);
            pageSize = layoutTemplate.getPageSizeInPX();
            let stylesTemplate = Template.fromStylesJSON(styles, { ...pageSize });
            fitSessions.push(fitToPage(settings, getMappingPreserveType_DP, content, 0, layoutTemplate, stylesTemplate, clusterBrowser));
        }
        else {
            pageSize = templates.getPageSizeInPX();
            
            let layoutTemplates = templates.getUniqueLayoutTemplates();
    
            let stylesTemplates = templates.getUniqueStylesTemplates();
    
            for (let layoutIdx = 0; layoutIdx < (layout === null ? layoutTemplates.length : 1); layoutIdx++) {
                let fittedStylesList = [];
    
                for (let stylesIdx = 0; stylesIdx < (styles === null ? stylesTemplates.length : 1); stylesIdx++) {
                    let layoutTemplate = null;
                    if (layout === null) {
                        layoutTemplate = layoutTemplates[layoutIdx].getFreshJSON();
                    }
                    else {
                        layoutTemplate = Template.fromLayoutJSON(layout);
                    }
                    let stylesTemplate = null;
                    if (styles === null) {
                        stylesTemplate = stylesTemplates[stylesIdx].getFreshJSON();
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
                    fitSessions.push(fitToPage(settings, getMappingPreserveType_DP, content, 0, layoutTemplate, stylesTemplate, clusterBrowser));
                }
            }
        }

        let results = await Promise.all(fitSessions);

        if (sort) {
            results.sort((p1, p2) => (p2.totalScore - p1.totalScore));
        }
        let prevPageNum = pageNum;
        for (let result of results) {
            if (result.moreInfo.successMatches !== result.moreInfo.totalNumMapped
                || result.moreInfo.totalNumContent !== result.moreInfo.totalNumMapped
            ) {
                continue;
            }
            if (pageNum === maxCnt || (pageNum - prevPageNum) === perChangePageNum) {
                break;
            }
            pageNum++;
            let response = getSingleTemplateResponse_v2(settings, result, null, pageNum, pageSize);
    
            requestsList.push({
                pageId: response.matching.objectId,
                change: possibleChange,
                requests: response.requests,
            });
            matchings.push({ ...response.matching });
            mappings.push({ ...response.mapping });
        }
        
        if (possibleChange !== null) {
            for (let singleChange of possibleChange) {
                content.body[singleChange.position].paragraph.type = singleChange.prevType;
                delete content.body[singleChange.position].paragraph.format;
            }
        }
    }

    return {
        requestsList,
        matchings,
        mappings,
    };
}

async function explicitFitToAlternatives_modfiy_single_type(
    settings,
    content,
    obj,
    sort,
    maxCnt,
    layout,
    styles,
    clusterBrowser
) {
    if (!Array.isArray(content.body)) {
        content.body = [];
    }

    let possibleChanges = [null];

    for (let i = 0; i < content.body.length; i++) {
        if (!content.body[i].paragraph.hasOwnProperty('type')) {
            content.body[i].paragraph.type = 'NOT_SPECIFIED';
        }

        if (IMAGE_PLACEHOLDER.includes(content.body[i].paragraph.type)) {
            possibleChanges.push([{
                position: i,
                prevType: content.body[i].paragraph.type,
                prevFormat: 'image',
                format: 'text',
            }]);
            continue;
        }
        if (BODY_PLACEHOLDER.includes(content.body[i].paragraph.type)) {
            possibleChanges.push([{
                position: i,
                prevType: content.body[i].paragraph.type,
                prevFormat: 'text',
                format: 'image',
            }]);
            continue;
        }
        possibleChanges.push([{
            position: i,
            prevType: content.body[i].paragraph.type,
            prevFormat: 'any',
            format: 'image',
        }]);
        possibleChanges.push([{
            position: i,
            prevType: content.body[i].paragraph.type,
            prevFormat: 'any',
            format: 'text',
        }]);
    }

    let perChangePageNum = 5;

    return explicitFitToAlternatives_modify_type(
        settings,
        content,
        obj,
        sort,
        maxCnt,
        layout,
        styles,
        clusterBrowser,
        possibleChanges,
        perChangePageNum,
    );
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
            let fittedStylesList = [];

            for (let stylesIdx = 0; stylesIdx < (styles === null ? stylesTemplates.length : 1); stylesIdx++) {
                let layoutTemplate = null;
                if (layout === null) {
                    layoutTemplate = layoutTemplates[layoutIdx].getFreshJSON();
                }
                else {
                    layoutTemplate = Template.fromLayoutJSON(layout);
                }
                let stylesTemplate = null;
                if (styles === null) {
                    stylesTemplate = stylesTemplates[stylesIdx].getFreshJSON();
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
    }

    let requestsList = [];
    let matchings = [];
    let mappings = [];

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

    let explicitFitFunction = explicitFitToAlternatives_modfiy_single_type;

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
    explicitFitToAlternatives_modfiy_single_type,
    explicitFitToAlternatives,
};
