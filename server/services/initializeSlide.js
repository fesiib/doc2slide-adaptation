const { objRecTraverse } = require('./SlidesAPIRqFields');
const { getDominantTextStyle } = require('./EvaluateAPI');

const PLACEHOLDER_IMAGE_URL = 'https://i.stack.imgur.com/y9DpT.jpg';

function addTextBox(shapeId, pageId, text) {
    let requests = [];
    
    requests.push({
        createShape: {
            objectId: shapeId,
            elementProperties: {
                pageObjectId: pageId,
                size: {
                    width: {
                        magnitude: 500,
                        unit: 'PT',
                    },
                    height: {
                        magnitude: 40,
                        unit: 'PT',
                    },
                },
            },
            shapeType: 'TEXT_BOX',
        }
    });
    requests.push({
        insertText: {
            objectId: shapeId,
            text: text,
        }
    });
    return requests;
}

function getFirstParagraphMarker(shapeText) {
    let firstParagraphMarker = null;
    for (let textElement of shapeText.textElements) {
        if (textElement.hasOwnProperty('paragraphMarker')
            && textElement.hasOwnProperty('endIndex')
        ) {
            firstParagraphMarker = { ...textElement };
            if (!firstParagraphMarker.hasOwnProperty('startIndex')) {
                firstParagraphMarker.startIndex = 0;
            }
            break;
        }
    }
    return firstParagraphMarker;
}

function getFirstText(shapeText) {
    let firstText = null;
    for (let textElement of shapeText.textElements) {
        if (textElement.hasOwnProperty('textRun')
            || textElement.hasOwnProperty('autoText')
        ) {
            firstText = { ...textElement };
            if (!firstText.hasOwnProperty('startIndex')) {
                firstText.startIndex = 0;
            }
            if (!firstText.hasOwnProperty('endIndex')) {
                firstText.endIndex = firstText.startIndex;
            }
            break;
        }
    }
    return firstText;
}

function initializePageElementShape(pageElement) {
    let requests = [];

    if (!pageElement.hasOwnProperty('mapped') || !pageElement.mapped) {
        return requests;
    }
    if (!pageElement.mapped) {
        requests.unshift({
            deleteText: {
                objectId: pageElement.objectId,
                textRange: {
                    type: 'ALL',
                }
            }
        });
        requests.unshift({
            insertText: {
                objectId: pageElement.objectId,
                text: 'TEXT_BOX',
                insertionIndex: 0,
            }
        });
        return requests;
    }
    
    let contentId = 0;
    let text = '';
    let textElements = pageElement.shape.text.textElements;
    for (let i = 0; i < textElements.length; i++) {
        let textElement = textElements[i];
        if (contentId >= pageElement.mappedContents.length) {
            break;
        }
        let start = text.length;
        text += pageElement.mappedContents[contentId].text + '\n';
        let end = text.length;
        if (textElement.hasOwnProperty('paragraphMarker')) {
            let bullet = {};
            let style = {};

            let listId = null;
            let nestingLevel = 0;
            if (textElement.paragraphMarker.hasOwnProperty('bullet')) {
                bullet = { ...textElement.paragraphMarker.bullet };
                if (textElement.paragraphMarker.bullet.hasOwnProperty('listId')) {
                    listId = textElement.paragraphMarker.bullet.listId;
                }
                if (textElement.paragraphMarker.bullet.hasOwnProperty('nestingLevel')) {
                    nestingLevel = textElement.paragraphMarker.bullet.nestingLevel;
                }
            }
            if (textElement.paragraphMarker.hasOwnProperty('style')) {
                style = { ...textElement.paragraphMarker.style };
            }
            let l = 0;
            let r = 0;
            if (textElement.hasOwnProperty('startIndex'))
                l = textElement.startIndex;
            if (textElement.hasOwnProperty('endIndex')) {
                r = textElement.endIndex;
            }
            let textStyle = {};
            if (listId !== null) {
                textStyle = pageElement.shape.text.lists[listId].nestingLevel[nestingLevel].bulletStyle;
                if (typeof textStyle !== 'object') {
                    textStyle = {};
                }
            }
            
            textStyle = getDominantTextStyle(textStyle, textElements, i, l, r);


            let result = objRecTraverse(style, '')
            requests.push({
                updateParagraphStyle: {
                    objectId: pageElement.objectId,
                    style: result.dst,
                    textRange: {
                        startIndex: start,
                        endIndex: end,
                        type: 'FIXED_RANGE',
                    },
                    fields: result.fields.join(),
                }
            });

            result = objRecTraverse(textStyle, '')
            requests.push({
                updateTextStyle: {
                    objectId: pageElement.objectId,
                    style: result.dst,
                    textRange: {
                        startIndex: start,
                        endIndex: end,
                        type: 'FIXED_RANGE',
                    },
                    fields: result.fields.join(),
                }
            });
            contentId++;
        }
    }
    requests.unshift({
        insertText: {
            objectId: pageElement.objectId,
            text,
        }
    });
    requests.unshift({
        deleteText: {
            objectId: pageElement.objectId,
            textRange: {
                type: 'ALL',
            }
        }
    });
    requests.unshift({
        insertText: {
            objectId: pageElement.objectId,
            text: 'TEXT_BOX',
            insertionIndex: 0,
        }
    });
    return requests;
}

function initializeShapeText(pageElement, text) {
    if (!pageElement.hasOwnProperty('shape')
        || !pageElement.hasOwnProperty('additional')
        || pageElement.additional.text.length === 0
        || !pageElement.shape.hasOwnProperty('text')
        || !Array.isArray(pageElement.shape.text.textElements)
    ) {
        return [];
    }
    let requests = [];
    requests.push({
        insertText: {
            objectId: pageElement.objectId,
            text: 'TEXT_BOX',
            insertionIndex: 0,
        }
    });
    
    requests.push({
        deleteText: {
            objectId: pageElement.objectId,
            textRange: {
                type: 'ALL',
            }
        }
    });

    requests.push({
        insertText: {
            objectId: pageElement.objectId,
            text,
        }
    });

    let firstParagraphMarker = getFirstParagraphMarker(pageElement.shape.text);
    let firstText = getFirstText(pageElement.shape.text);
    if (firstParagraphMarker !== null
        && firstParagraphMarker.paragraphMarker.hasOwnProperty('style')
    ) {
        let result = objRecTraverse(firstParagraphMarker.paragraphMarker.style, '');
        if (result.fields.length > 0) {
            requests.push({
                updateParagraphStyle: {
                    objectId: pageElement.objectId,
                    style: result.dst,
                    textRange: {
                        type: 'ALL',
                    },
                    fields: result.fields.join(),
                }
            });
        }
    }
    if (firstText !== null) {
        let style = null;
        if (firstText.hasOwnProperty('textRun')) {
            style = firstText.textRun.style;
        }
        else {
            style = firstText.autoText.style;
        }
        let result = objRecTraverse(style)
        if (result.fields.length > 0) {
            requests.push({
                updateTextStyle: {
                    objectId: pageElement.objectId,
                    style: result.dst,
                    textRange: {
                        type: 'ALL',
                    },
                    fields: result.fields.join(),
                }
            });
        }
    }
    return requests;
}

function assignElementProperties(pageObjectId, size, transform) {
    let ret = {
        pageObjectId,
    }
    if (size === undefined || transform === undefined) {
        throw Error('no size or transform', size, transform);
    }
    if (!size.width.hasOwnProperty('magnitude')) {
        throw Error('no width');
    }
    if (!size.height.hasOwnProperty('magnitude')) {
        throw Error('no height');
    }
    ret.size = JSON.parse(JSON.stringify(size));
    ret.transform = { ...transform };
    return ret;
}

function getPageElementRequests(pageId, pageElement, suffix) {
    let validObjectId = false;
    let requests = [];
    let request = {
        objectId: pageElement.objectId,
        elementProperties: {},
    };
    if (pageElement.hasOwnProperty('elementGroup')) {
        if (Array.isArray(pageElement.elementGroup.children)) {
            let num_pageElement = 0;
            let childrenObjectIds = [];
            for (let obj of pageElement.elementGroup.children) {
                let result = getPageElementRequests(pageId, obj, suffix + '_' + (num_pageElement.toString()));
                requests = requests.concat(result.requests);
                if (result.validObjectId) {
                    childrenObjectIds.push(result.objectId);
                    num_pageElement++;
                }
            }
            if (childrenObjectIds.length > 1) {
                requests.push({
                    groupObjects: {
                        groupObjectId: pageElement.objectId,
                        childrenObjectIds,
                    }
                });
                validObjectId = true;
                if (pageElement.transform !== undefined) {
                    requests.push({
                        updatePageElementTransform: {
                            objectId: pageElement.objectId,
                            transform: pageElement.transform,
                            applyMode: 'ABSOLUTE',
                        }
                    });
                }
            }
            else {
                for (let ch of childrenObjectIds) {
                    if (pageElement.transform !== undefined) {
                        requests.push({
                            updatePageElementTransform: {
                                objectId: ch,
                                transform: pageElement.transform,
                                applyMode: 'RELATIVE',
                            }
                        });
                    }
                }
            }
        }
    }
    else if (pageElement.hasOwnProperty('shape')) {
        request.elementProperties = assignElementProperties(pageId, pageElement.size, pageElement.transform);
        if (pageElement.shape.hasOwnProperty('shapeType')) {
            request.shapeType = pageElement.shapeType;
        }
        if (request.shapeType === undefined) {
            request.shapeType = 'RECTANGLE';
        }
        requests.push({
            createShape: request
        });
        validObjectId = true;

        if (pageElement.additional.text.length > 0) {
            /// TEXT FORMAT: TEXT_BOX_{NUMBER}
            let textJSON = {};
            if (pageElement.shape.hasOwnProperty('placeholder')
                && pageElement.shape.placeholder.hasOwnProperty('type')) {
                textJSON.placeholderType = pageElement.shape.placeholder.type;
            }
            else {
                textJSON.placeholderType = 'BODY';
            }

            requests = requests.concat(initializeShapeText(pageElement, textJSON.placeholderType));
        }
        if (pageElement.shape.hasOwnProperty('shapeProperties')) {
            let result = objRecTraverse(pageElement.shape.shapeProperties);
            if (result.fields.length > 0) {
                requests.push({
                    updateShapeProperties: {
                        objectId: pageElement.objectId,
                        shapeProperties: result.dst,
                        fields: result.fields.join(),
                    }
                });
            }
        }
    }
    else if (pageElement.hasOwnProperty('image')) {
        request.elementProperties = assignElementProperties(pageId, pageElement.size, pageElement.transform);
        // if (pageElement.additional.contentUrl.length > 0) {
        //     request['url'] = pageElement.additional.contentUrl[0];
        // }
        // else {
        //     request['url'] = PLACEHOLDER_IMAGE_URL;
        // }
        request['url'] = PLACEHOLDER_IMAGE_URL;
        requests.push({
            createImage: request
        });
        validObjectId = true;
        if (pageElement.image.hasOwnProperty('imageProperties')) {
            let result = objRecTraverse(pageElement.image.imageProperties, '');
            if (result.fields.length > 0) {
                requests.push({
                    updateImageProperties: {
                        objectId: pageElement.objectId,
                        imageProperties: result.dst,
                        fields: result.fields.join(),
                    }
                });
            }
        }
    }
    else if (pageElement.hasOwnProperty('line')) {
        if (pageElement.line.hasOwnProperty('lineProperties'))
        {
            if (pageElement.line.lineProperties['hasLink'] === 1
            || pageElement.line.lineProperties['hasConnection'] === 1) {
                return {
                    requests: [],
                    objectId: pageElement.objectId,
                    validObjectId: false,
                }
            }
        }
        
        request.elementProperties = assignElementProperties(pageId, pageElement.size, pageElement.transform);
        
        if (pageElement.line.hasOwnProperty('lineCategory')) {
            request['category'] = pageElement.line.lineCategory;
        }
        requests.push({
            createLine: request
        });
        validObjectId = true;
        if (pageElement.line.hasOwnProperty('lineProperties')) {
            let result = objRecTraverse(pageElement.line.lineProperties, '');
            if (result.fields.length > 0) {
                requests.push({
                    updateLineProperties: {
                        objectId: pageElement.objectId,
                        lineProperties: result.dst,
                        fields: result.fields.join(),
                    }
                });
            }
        }
    }
    else {
        console.log('no such type:', pageElement);
    }
    return {
        requests,
        objectId: pageElement.objectId,
        validObjectId,
    };
}



function initializePage(pageId, pageTemplate) { 
    let requests = [];
    // if (pageTemplate.hasOwnProperty('pageProperties')) {
    //     // let result = objRecTraverse(pageTemplate.pageProperties, '');
    //     // console.log(result);
    //     // if (result.fields.length > 0) {
    //     //     requests.push({
    //     //         updatePageProperties: {
    //     //             objectId,
    //     //             pageProperties: result.dst,
    //     //             fields: result.fields.join(),
    //     //         }
    //     //     });
    //     // }
    //     requests.push({
    //         updatePageProperties: {
    //             objectId: pageId,
    //             pageProperties: pageTemplate.pageProperties,
    //             fields: '*',
    //         }
    //     });
        
    // }

    if (Array.isArray(pageTemplate.pageElements)) {
        let num_pageElement = 0;
        for (let pageElement of pageTemplate.pageElements) {
            if (pageElement.hasOwnProperty('additional')
                && pageElement.additional.hasOwnProperty('originalType')
            ) { 
                let result = getPageElementRequests(pageId, pageElement, num_pageElement.toString());
                requests = requests.concat(result.requests);
            }
            else {
                console.log('no additional', pageElement);
            }
            num_pageElement++;
        }
    }
    return requests;
}

function initializeTemplate(template) {
    let requests = [];
    let pageId = template.pageId;
    let page = template.page;
    let weight = template.weight;
    let originalId = template.originalId;
    let informationBoxId = template.informationBoxId;

    requests.push({
        createSlide: {
            objectId: pageId,
        },
    });
    requests = requests.concat(initializePage(pageId, page));

    if (weight === 1) {
        ///layout
        requests = requests.concat(addTextBox(informationBoxId, pageId, "Layout: " + originalId));
    }
    else {
        requests = requests.concat(addTextBox(informationBoxId, pageId, "Page: " + originalId));    
    }
    return requests;
}

function initializePresentation(templates) {
    let requests = [];
    for (let template of templates.getTemplates()) {
        requests = requests.concat(initializeTemplate(template));
    }
    return requests;
}

module.exports = {
    getFirstParagraphMarker,
    initializePresentation,
    initializeTemplate,
    getFirstText,
    initializeShapeText,
    initializePageElementShape
}