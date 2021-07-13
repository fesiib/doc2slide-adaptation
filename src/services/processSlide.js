export function tryAddNewTemplate(templates, pageId, page, weight) {
    templates.push({
        pageId,
        page,
        weight,
    });
    return templates;
}