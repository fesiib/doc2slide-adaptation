import Templates from './Templates';

const HEADER_PLACEHOLDER = [
    'HEADER',
    'TITLE',
    'CENTERED_TITLE',
    'SUBTITLE',
];

const BODY_PLACEHOLDER = [
    'BODY',
    'FOOTER',
    'OBJECT',
];

function extractShapeElements(slide) {
    let shapeElements = [];
    for (let pageElement of slide.pageElements) {
        if (pageElement.hasOwnProperty('additional')) {
            if (pageElement.hasOwnProperty('shape')) {
                let copyPageElement = { ...pageElement };
                copyPageElement.mapped = false;
                shapeElements.push(copyPageElement);
            }
        }
    }
    return shapeElements;
}

function extractImageElements(slide) {
    let imageElements = [];
    for (let pageElement of slide.pageElements) {
        if (pageElement.hasOwnProperty('additional')) {
            if (pageElement.hasOwnProperty('image')) {
                let copyPageElement = { ...pageElement };
                copyPageElement.mapped = false;
                imageElements.push(copyPageElement);
            }
        }
    }
    return imageElements;
}




export function fitToAllSlides_simple(content, templates) {
    console.log(content, templates);
    if (!(templates instanceof Templates)) {
        throw Error(templates + 'not instance of Templates');
    }

    let globalRequests = [];
    for (let template of templates.getTemplates()) {
        let slide = template.page;
        if (!Array.isArray(slide.pageElements)) {
            continue;
        }

        let shapeElements = extractShapeElements(slide);

        for (let pageElement of shapeElements) {
            globalRequests.push({
                insertText: {
                    objectId: pageElement.objectId,
                    text: 'TEXT_BOX',
                    insertionIndex: 0,
                }
            });
            
            globalRequests.push({
                deleteText: {
                    objectId: pageElement.objectId,
                    textRange: {
                        type: 'ALL',
                    }
                }
            });
        }

        // Fit the header
        if (content.hasOwnProperty('header') && content.header.length > 0) {
            for (let pageElement of shapeElements) {
                if (pageElement.shape.hasOwnProperty('placeholder')
                    && pageElement.shape.placeholder.hasOwnProperty('type')
                ) {
                    let type = pageElement.shape.placeholder.type;
                    if (HEADER_PLACEHOLDER.includes(type)) {
                        pageElement.mapped = true;
                        globalRequests.push({
                            insertText: {
                                objectId: pageElement.objectId,
                                text: content.header,
                                insertionIndex: 0,
                            }
                        });
                        break;
                    }
                }
            }
        }
        
        // Fit the content
        if (content.hasOwnProperty('body') && Array.isArray(content.body)) {
            let contentId = 0;
            for (let pageElement of shapeElements) {
                if (pageElement.mapped) {
                    continue;
                }
                if (contentId >= content.body.length) {
                    break;
                }
                if (pageElement.shape.hasOwnProperty('placeholder')
                    && pageElement.shape.placeholder.hasOwnProperty('type')
                ) {
                    let type = pageElement.shape.placeholder.type;
                    if (BODY_PLACEHOLDER.includes(type)) {
                        globalRequests.push({
                            insertText: {
                                objectId: pageElement.objectId,
                                text: content.body[contentId],
                                insertionIndex: 0,
                            }
                        });
                        contentId++;
                        pageElement.mapped = true;
                    }
                    else {
                        console.log("Cannot fit to shape: ", pageElement);
                    }
                }
            }
        }
    }
    return globalRequests;
}

export function fitToAllSlides_TextShortening(content, obj) {
    let templates = new Templates({ width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);
    console.log(content, templates);
    let globalRequests = [];
    for (let template of templates.getTemplates()) {
        let slide = template.page;
        if (!Array.isArray(slide.pageElements)) {
            continue;
        }

        let shapeElements = extractShapeElements(slide);

        for (let pageElement of shapeElements) {
            globalRequests.push({
                insertText: {
                    objectId: pageElement.objectId,
                    text: 'TEXT_BOX',
                    insertionIndex: 0,
                }
            });
            
            globalRequests.push({
                deleteText: {
                    objectId: pageElement.objectId,
                    textRange: {
                        type: 'ALL',
                    }
                }
            });
        }

        // Fit the header
        if (Array.isArray(content.header)) {
            for (let pageElement of shapeElements) {
                if (pageElement.shape.hasOwnProperty('placeholder')
                    && pageElement.shape.placeholder.hasOwnProperty('type')
                ) {
                    let type = pageElement.shape.placeholder.type;
                    if (HEADER_PLACEHOLDER.includes(type)) {
                        pageElement.mapped = true;
                        globalRequests.push({
                            insertText: {
                                objectId: pageElement.objectId,
                                text: content.header[0].text,
                                insertionIndex: 0,
                            }
                        });
                        break;
                    }
                }
            }
        }
        
        // Fit the content
        if (Array.isArray(content.body)) {
            let contentId = 0;
            for (let pageElement of shapeElements) {
                if (pageElement.mapped) {
                    continue;
                }
                if (contentId >= content.body.length) {
                    break;
                }
                if (pageElement.shape.hasOwnProperty('placeholder')
                    && pageElement.shape.placeholder.hasOwnProperty('type')
                ) {
                    let type = pageElement.shape.placeholder.type;
                    if (BODY_PLACEHOLDER.includes(type)) {
                        globalRequests.push({
                            insertText: {
                                objectId: pageElement.objectId,
                                text: content.body[contentId][0].text,
                                insertionIndex: 0,
                            }
                        });
                        contentId++;
                        pageElement.mapped = true;
                    }
                    else {
                        console.log("Cannot fit to shape: ", pageElement);
                    }
                }
            }
        }
    }
    return globalRequests;
}