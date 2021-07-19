import Templates from './Templates';

const HEADER_PLACEHOLDER = [
    'CENTERED_TITLE',
    'TITLE',
    'HEADER',
    'SUBTITLE',
];

const BODY_PLACEHOLDER = [
    'BODY',
    'FOOTER',
    'OBJECT',
];

const NOT_BODY_PLACEHOLDER = [
    'NONE', // 	Default value, signifies it is not a placeholder.
    //'BODY', // 	Body text.
    //'CHART', // 	Chart or graph.
    //'CLIP_ART', // 	Clip art image.
    //'CENTERED_TITLE', // 	Title centered.
    //'DIAGRAM', // 	Diagram.
    //'DATE_AND_TIME', // 	Date and time.
    //'FOOTER', // 	Footer text.
    //'HEADER', // 	Header text.
    //'MEDIA', // 	Multimedia.
    //'OBJECT', // 	Any content type.
    //'PICTURE', // 	Picture.
    'SLIDE_NUMBER', // 	Number of a slide.
    //'SUBTITLE', // 	Subtitle.
    //'TABLE', // 	Table.
    //'TITLE', // 	Slide title.
    //'SLIDE_IMAGE', // 	Slide image. 
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

function fitSingleText(shortenings, shapeText) {
    if (!Array.isArray(shapeText.textElements)
        || shapeText.textElements.length === 0
    ) {
        console.log(shapeText);
        return {
            success: false,
        }
    }
    let firstParagraphMarker = null;
    for (let textElement of shapeText.textElements) {
        if (textElement.hasOwnProperty('paragraphMarker')
            && textElement.hasOwnProperty('endIndex')
        ) {
            firstParagraphMarker = { ...textElement };
            if (!firstParagraphMarker.hasOwnProperty('startIndex')) {
                firstParagraphMarker.startIndex = 0;
            }
        }
    }

    if (firstParagraphMarker === null) {
        console.log(shapeText);
        return {
            success: false,
        }
    }

    for (let shortening of shortenings) {
        if (shortening.text.length <= firstParagraphMarker.endIndex) {
            return {
                success: true,
                ...shortening,
            }
        }
    }

    return {
        success: true,
        ...shortenings[shortenings.length - 1],
    };
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
            if (!pageElement.shape.hasOwnProperty('placeholder')
                || !pageElement.shape.placeholder.hasOwnProperty('type')
            ) {
                console.log('inappropriate shape for header: ', pageElement);
            }
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
            let headerPageElement = null;
            let headerIdx = HEADER_PLACEHOLDER.length;
            for (let pageElement of shapeElements) {
                if (pageElement.shape.hasOwnProperty('placeholder')
                    && pageElement.shape.placeholder.hasOwnProperty('type')
                ) {
                    let type = pageElement.shape.placeholder.type;
                    if (HEADER_PLACEHOLDER.includes(type)) {
                        let curIdx = HEADER_PLACEHOLDER.findIndex((el) => el === type);
                        if (headerIdx <= curIdx) {
                            continue;
                        }
                        let result = fitSingleText(content.header, pageElement.shape.text);
                        if (!result.success) {
                            continue;
                        }
                        headerPageElement = pageElement;
                        headerIdx = curIdx;
                    }
                }
            }
            if (headerPageElement !== null) {
                
                let result = fitSingleText(content.header, headerPageElement.shape.text);
                headerPageElement.mapped = true;
                globalRequests.push({
                    insertText: {
                        objectId: headerPageElement.objectId,
                        text: result.text,
                        insertionIndex: 0,
                    }
                });
            }
        }
        
        // Fit the content
        if (Array.isArray(content.body)) {
            for (let shortenings of content.body) {
                for (let pageElement of shapeElements) {
                    if (pageElement.mapped) {
                        continue;
                    }
                    if (pageElement.shape.hasOwnProperty('placeholder')
                        && pageElement.shape.placeholder.hasOwnProperty('type')
                    ) {
                        let type = pageElement.shape.placeholder.type;
                        if (NOT_BODY_PLACEHOLDER.includes(type) || HEADER_PLACEHOLDER.includes(type)) {
                            continue;
                        }
                    }
                    if (pageElement.shape.hasOwnProperty('shapeType')
                        && pageElement.shape.shapeType === 'TEXT_BOX'
                    ) {
                        let result = fitSingleText(shortenings, pageElement.shape.text);
                        if (!result.success) {
                            continue;
                        }
                        globalRequests.push({
                            insertText: {
                                objectId: pageElement.objectId,
                                text: result.text,
                                insertionIndex: 0,
                            }
                        });
                        pageElement.mapped = true;
                        break;
                    }
                }
            }
        }
    }
    return globalRequests;
}