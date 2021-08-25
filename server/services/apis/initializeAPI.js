const { objRecTraverse } = require('./requiredFields');
const { 
    IMAGE_PLACEHOLDER,
    SLIDE_NUMBER_PLACEHOLDER,
    getDominantTextStyle,
    getBulletPreset,
    PX,
    rectangleToSizeTransform,
    PLACEHOLDER_IMAGE_URL,
    PT
} = require('../Template');

function isNumeric(ch) {
    return ch.length === 1 && ch.match(/[0-9]/g);
}

function stylesToTextStyle(styles) {
    let textStyle = {
        weightedFontFamily: {
            fontFamily: styles.fontFamily,
            weight: 400,
        },
        foregroundColor: {
            opaqueColor: {
                rgbColor: styles.foregroundColor.rgbColor,
            }
        },
        fontSize: {
            magnitude: styles.fontSize * PX / PT,
            unit: 'PT',
        }
    };
    return textStyle;
}

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

function initializePageElementShape_withStyles(pageElement) {
    let requests = [];
    if (SLIDE_NUMBER_PLACEHOLDER.includes(pageElement.type)) {
        return requests;
    }
    if (!Array.isArray(pageElement.mappedContents)) {
        return requests;
    }
    if (pageElement.mappedContents.length === 0) {
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
    let text = '';
    for (let contentIdx = 0; contentIdx < pageElement.mappedContents.length; contentIdx++) {
        let mappedContent = pageElement.mappedContents[contentIdx];
        if (contentIdx > 0) {
            text += '\n';
        }
        let start = text.length;
        text += mappedContent.text;
        let end = text.length;
        if (start >= end) {
            continue;
        }

        let styles = mappedContent.styles;

        let paragraphStyle = {
            direction: 'LEFT_TO_RIGHT',
        };
        
        let bulletStyle = {};

        let textStyle = stylesToTextStyle(styles);

        if (bulletStyle.hasOwnProperty('glyph')
            && bulletStyle.glyph !== ''
        ) {
            requests.push({
                createParagraphBullets: {
                    objectId: pageElement.objectId,
                    textRange: {
                        startIndex: start,
                        endIndex: end,
                        type: "FIXED_RANGE",
                    },
                    bulletPreset: getBulletPreset(bulletStyle.glyph),
                },
            });
        }

        let result = objRecTraverse(paragraphStyle, '')
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
        if (result.fields.length > 0) {
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

function initializePageElementImage_withStyles(pageElement) {
    let requests = [];

    if (!Array.isArray(pageElement.mappedContents)) {
        return requests;
    }
    if (pageElement.mappedContents.length === 0) {
        // maybe makes sense to delete the placeholder
        return requests;
    }

    if (pageElement.mappedContents.length > 1) {
        throw Error("More than 1 text is mapped to image");
    }
    requests.push({
        replaceImage: {
            imageObjectId: pageElement.objectId,
            imageReplaceMethod: 'CENTER_INSIDE',
            url: pageElement.mappedContents[0].url,
        }
    });
    return requests;
}

function initializePageElementShape(pageElement) {
    let requests = [];
    if (SLIDE_NUMBER_PLACEHOLDER.includes(pageElement.type)) {
        return requests;
    }
    if (!pageElement.hasOwnProperty('mappedContents')) {
        return requests;
    }
    if (pageElement.mappedContents.length === 0) {
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
    let text = '';
    let textElements = pageElement.shape.text.textElements;
    for (let contentIdx = 0; contentIdx < pageElement.mappedContents.length; contentIdx++) {
        let mappedContent = pageElement.mappedContents[contentIdx];
        let textElement = textElements[mappedContent.textElementIdx];
        if (!textElement.hasOwnProperty('paragraphMarker')) {
            throw new Error('mapping is wrong', pageElement.mappedContents, textElements);
        }
        if (contentIdx > 0) {
            text += '\n';
        }
        let start = text.length;
        text += mappedContent.text;
        let end = text.length;
        if (start >= end) {
            continue;
        }
        let style = {};
        let bullet = {};

        let listId = null;
        let nestingLevel = 0;
        let glyph = '';
        if (textElement.paragraphMarker.hasOwnProperty('bullet')) {
            bullet = { ...textElement.paragraphMarker.bullet };
            if (textElement.paragraphMarker.bullet.hasOwnProperty('listId')) {
                listId = textElement.paragraphMarker.bullet.listId;
            }
            if (textElement.paragraphMarker.bullet.hasOwnProperty('nestingLevel')) {
                nestingLevel = textElement.paragraphMarker.bullet.nestingLevel;
            }
            if (textElement.paragraphMarker.bullet.hasOwnProperty('glyph')) {
                glyph = textElement.paragraphMarker.bullet.glyph
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
            if (glyph != '') {
                requests.push({
                    createParagraphBullets: {
                        objectId: pageElement.objectId,
                        textRange: {
                            startIndex: start,
                            endIndex: end,
                            type: "FIXED_RANGE",
                        },
                        bulletPreset: getBulletPreset(glyph),
                    },
                });
            }
        }
        
        textStyle = getDominantTextStyle(textStyle, textElements, mappedContent.textElementIdx, l, r);

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
        if (result.fields.length > 0) {
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

function initializePageElementImage(pageElement) {
    let requests = [];

    if (!pageElement.hasOwnProperty('mappedContents')) {
        return requests;
    }
    if (pageElement.mappedContents.length === 0) {
        // maybe makes sense to delete the placeholder
        return requests;
    }

    if (pageElement.mappedContents.length > 1) {
        throw Error("More than 1 text is mapped to image");
    }
    requests.push({
        replaceImage: {
            imageObjectId: pageElement.objectId,
            imageReplaceMethod: 'CENTER_INSIDE',
            url: pageElement.mappedContents[0].url,
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
            text: text,
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
        let result = objRecTraverse(style, '');
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

function getPageElementRequests(pageId, pageNum, pageElement, suffix) {
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
                let result = getPageElementRequests(pageId, pageNum, obj, suffix + '_' + (num_pageElement.toString()));
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

        if (IMAGE_PLACEHOLDER.includes(pageElement.type)) {
            request.elementProperties = assignElementProperties(pageId, pageElement.size, pageElement.transform);
            request['url'] = PLACEHOLDER_IMAGE_URL;
            requests.push({
                createImage: request,
            });
            validObjectId = true;
            if (pageElement.shape.hasOwnProperty('shapeProperties')
                && pageElement.shape.shapeProperties.hasOwnProperty('outline')
            ) {
                let imageProperties = {
                    outline: { ...pageElement.shape.shapeProperties.outline },
                };
                let result = objRecTraverse(imageProperties, '');
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
        else {
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

            let text = pageElement.type;

            if (SLIDE_NUMBER_PLACEHOLDER.includes(text) && pageNum > 0) {
                text = pageNum.toString();
            }
            if (pageElement.hasOwnProperty('type')) {
                requests = requests.concat(initializeShapeText(pageElement, text));
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
    }
    else if (pageElement.hasOwnProperty('image')) {
        request.elementProperties = assignElementProperties(pageId, pageElement.size, pageElement.transform);
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
    // else if (pageElement.hasOwnProperty('line')) {
    //     if (pageElement.line.hasOwnProperty('lineProperties'))
    //     {
    //         if (pageElement.line.lineProperties['hasLink'] === 1
    //         || pageElement.line.lineProperties['hasConnection'] === 1) {
    //             return {
    //                 requests: [],
    //                 objectId: pageElement.objectId,
    //                 validObjectId: false,
    //             }
    //         }
    //     }
        
    //     request.elementProperties = assignElementProperties(pageId, pageElement.size, pageElement.transform);
        
    //     if (pageElement.line.hasOwnProperty('lineCategory')) {
    //         request['category'] = pageElement.line.lineCategory;
    //     }
    //     requests.push({
    //         createLine: request
    //     });
    //     validObjectId = true;
    //     if (pageElement.line.hasOwnProperty('lineProperties')) {
    //         let result = objRecTraverse(pageElement.line.lineProperties, '');
    //         if (result.fields.length > 0) {
    //             requests.push({
    //                 updateLineProperties: {
    //                     objectId: pageElement.objectId,
    //                     lineProperties: result.dst,
    //                     fields: result.fields.join(),
    //                 }
    //             });
    //         }
    //     }
    // }
    else {
        console.log('no such type:', pageElement);
    }
    return {
        requests,
        objectId: pageElement.objectId,
        validObjectId,
    };
}



function initializePage(pageId, pageTemplate, pageNum) { 
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
            if (pageElement.hasOwnProperty('additional')) { 
                let result = getPageElementRequests(pageId, pageNum, pageElement, num_pageElement.toString());
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

function initializeLayout(template) {
    let requests = [];
    let pageId = template.pageId;

    requests.push({
        createSlide: {
            objectId: pageId,
        },
    });

    return requests;

    let layout = template.getLayoutJSON();

    for (box of layout.boxes) {
        if (box.height === 0) {
            box.height = 100;
        }
        if (box.width === 0) {
            box.width = 100;
        }
        
        let rectangle = {
            startX: box.left,
            startY: box.top,
            finishX: box.left + box.width,
            finishY: box.top + box.height,
        };

        let position = rectangleToSizeTransform(rectangle, 'PX');

        requests.push({
            createShape: {
                objectId: box.objectId,
                elementProperties: {
                    pageObjectId: pageId,
                    size: position.size,
                    transform: position.transform,
                },
                shapeType: 'TEXT_BOX',
            }
        });

        let outlineShapeProperties = {
            outline: {
                outlineFill: {
                    solidFill: {
                        color: {
                            rgbColor: {
                                red: 0,
                                green: 0,
                                blue: 0,
                            },
                        },
                        alpha: 1,
                    }
                },
                weight: {
                    magnitude: 2,
                    unit: 'PT',
                },
            }
        }

        let result = objRecTraverse(outlineShapeProperties);

        requests.push({
            updateShapeProperties: {
                objectId: box.objectId,
                shapeProperties: result.dst,
                fields: result.fields.join(),
            },
        });
    }
    return requests;
}

function initializeTemplate(template, targetPageId, pageNum = -1) {
    let requests = [];
    let pageId = template.pageId;
    let page = template.page;

    if (targetPageId === null) {
        targetPageId = pageId;
        if (pageNum > 0) {
            requests.push({
                createSlide: {
                    objectId: targetPageId,
                    insertionIndex: pageNum - 1,
                },
            });
        }
        else {
            requests.push({
                createSlide: {
                    objectId: targetPageId,
                },
            });
        }
    }
    requests = requests.concat(initializePage(targetPageId, page, pageNum));
    return requests;
}

module.exports = {
    getFirstParagraphMarker,
    initializeTemplate,
    initializeLayout,
    getFirstText,
    initializePageElementShape,
    initializePageElementImage,
    initializePageElementShape_withStyles,
    initializePageElementImage_withStyles,
    addTextBox,
    stylesToTextStyle,
}