const { Templates } = require('./Templates');
const { fitToPage, getSingleTemplateResponse_v2, getMappingPreserveType_DP, getMappingNoPreserveType_DP } = require('./fitContent_internals_v2');
const { Template } = require('./Template');

async function explicitFitFunction_total(
    settings,
    content,
    obj,
    targetPageId,
    layout,
    styles,
    pageNum,
    clusterBrowser,
) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);

    let pageSize = templates.getPageSizeInPX();

    let originalTemplates = templates.getCustomTemplates();

    let fitSessions = [];

    if (layout === null && styles === null) {
        for (let originalTemplate of originalTemplates) {
            let template = originalTemplate.getFreshJSON();
            fitSessions.push(fitToPage(settings, getMappingPreserveType_DP, content, 0, template, template, clusterBrowser));
        }
    }
    else if (layout === null || styles === null) {
        for (let originalTemplate of originalTemplates) {
            let layoutTemplate = null, stylesTemplate = null;
            if (layout !== null) {
                layoutTemplate = Template.fromLayoutJSON(layout);
            }
            else {
                layoutTemplate = originalTemplate.getFreshJSON();
            }
            if (styles !== null) {
                stylesTemplate = Template.fromStylesJSON(styles, templates.getPageSizeInPX());
            }
            else {
                stylesTemplate = originalTemplate.getFreshJSON();
            }
            fitSessions.push(fitToPage(settings, getMappingPreserveType_DP, content, 0, layoutTemplate, stylesTemplate, clusterBrowser));
        }
    }
    else {
        let layoutTemplate = Template.fromLayoutJSON(layout);
        let stylesTemplate = Template.fromStylesJSON(styles, templates.getPageSizeInPX());
        console.log(layoutTemplate.getLayoutJSON(), stylesTemplate.getStylesJSON());
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

module.exports = {
    explicitFitToSlide,
};
