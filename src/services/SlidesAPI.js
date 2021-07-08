import {gapi} from 'gapi-script';
import { v4 as random} from 'uuid';
import { createPresentation } from './DriveAPI';

import {appendPre} from './GoogleAPI';
import { objRecTraverse, REQ_FIELDS } from './SlidesAPIRqFields';

const PLACEHOLDER_IMAGE_URL = 'https://i.stack.imgur.com/y9DpT.jpg';

/**
 * Prints the number of slides and elements in a sample presentation:
 * https://docs.google.com/presentation/d/19wwZsmNWZYuAKsMeg1x7eXSdxvpH8dnAnN7xQAp5gD4/edit
 */

export function listSlides(presentationId) {

    gapi.client.slides.presentations.get({
        presentationId: presentationId
    }).then(function(response) {
        let presentation = response.result;
        let length = presentation.slides.length;
        appendPre('The presentation contains ' + length + ' slides:');
        for (let i = 0; i < length; i++) {
            let slide = presentation.slides[i];
            appendPre('- Slide #' + (i + 1) + ' contains ' +
                slide.pageElements.length + ' elements.')
        }
    }, function(response) {
        appendPre('Error: ' + response.result.error.message);
    });
}

function updateObjectId(src) {
    if (typeof src !== 'object' || src === null) {
        return {};
    }
    let ret = {};
    if (Array.isArray(src)) {
        for (let obj of src) {
           ret = Object.assign(ret, updateObjectId(obj));
        }
    }
    else {
        if (src.hasOwnProperty('objectId')) {
            ret[src.objectId] = src;
        }
        for (let field in src) {
            if (src.hasOwnProperty(field)) {
                ret = Object.assign(ret, updateObjectId(src[field]));
            }
        }
    }
    return ret;
}

function isEmpty(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

/**
 * TODO: Calculate Additional Information
 * @param {Object} page 
 * @returns 
 */

 function calculateAdditional(pageElement, src) {
    // additional: {
    //     isReplacable: true, // not line;
    //     //union start
    //     originalType: '', // elementGroup, shape, image, video, line, table, sheetsChart, wordArt
    //     amountText: 0,
    //     mainColors: {
    //         colors: [opaqueColorTemplate],
    //     },
    //     //union end
    // }
    let additional = {
        isReplacable: true,
        originalType: '',
        text: [],
        contentUrl: [],
    }
    if (src.hasOwnProperty('shape')) {
        additional.isReplacable = true;
        additional.originalType = 'shape';
        if (src.shape.hasOwnProperty('text') && Array.isArray(src.shape.text.textElements)) {
            additional.text = [];
            for (let textElement of src.shape.text.textElements) {
                if (textElement.hasOwnProperty('textRun')
                    && textElement.textRun.hasOwnProperty('content')
                ) {
                    additional.text.push(textElement.textRun.content);
                }
                else if (textElement.hasOwnProperty('autoText')
                    && textElement.autoText.hasOwnProperty('content')
                ) {
                    additional.text.push(textElement.autoText.content);
                }
            }
        }
        
    }
    else if (src.hasOwnProperty('image')) {
        additional.isReplacable = true;
        additional.originalType = 'image';
        additional.contentUrl = [src.image.contentUrl];
    }
    else if (src.hasOwnProperty('elementGroup')) {
        additional.isReplacable = true;
        additional.originalType = 'elementGroup';
        if (Array.isArray(pageElement.elementGroup.children)) {
            additional.text = [];
            additional.contentUrl = [];
            for (let ch of pageElement.elementGroup.children) {
                additional.text = additional.text.concat(ch.additional.text);
                additional.contentUrl = additional.text.concat(ch.additional.contentUrl);
            }
        }
    }
    else if (src.hasOwnProperty('video')) {
        additional.isReplacable = true;
        additional.originalType = 'video';
    }
    else if (src.hasOwnProperty('line')) {
        additional.isReplacable = false;
        additional.originalType = 'line';
    }
    else if (src.hasOwnProperty('table')) {
        additional.isReplacable = false;
        additional.originalType = 'table';
    }
    else if (src.hasOwnProperty('wordArt')) {
        additional.isReplacable = false;
        additional.originalType = 'wordArt';
        additional.text = [src.wordArt.renderedText];
    }
    else if (src.hasOwnProperty('sheetsChart')) {
        additional.isReplacable = true;
        additional.originalType = 'sheetsChart';
        additional.contentUrl = [src.sheetsChart.contentUrl];
    }
    pageElement['additional'] = additional;
    return pageElement;
}

function objRec(dst, src, prefix, dict) {
    if (typeof src !== 'object' || src === null) {
        return src;
    }

    if (Array.isArray(src)) {
        dst = [];
        let field = prefix + '.0';
        if (REQ_FIELDS.includes(field)) {
            for (let obj of src) {
                if (prefix.endsWith('pageElements')) {
                    let pageElement = objRec({}, obj, field, dict);
                    pageElement = calculateAdditional(pageElement, obj);
                    dst.push(pageElement);
                }
                else {
                    dst.push(objRec({}, obj, field, dict));
                }
            }
        }
        return dst;
    }

    if (prefix.endsWith('lists') || prefix.endsWith('key.nestingLevel')) {
        // dictionary
        let field = prefix + '.key';
        for (let type in src) {
            if (dst[type] === undefined) {
                dst[type] = {};
            }
            dst[type] = objRec(dst[type], src[type], field, dict);
        }
        return dst;
    }

    for (let type in src) {
        if (type === 'propertyState') {
            if (src[type] === 'INHERIT') {
                return dst;
            }
            break;
        }
    }

    for (let type in src) {
        if (type === 'placeholder') {
            if (src[type].hasOwnProperty('parentObjectId')
                && dict.hasOwnProperty(src[type].parentObjectId)
            ) {
                let parentObject = dict[src[type].parentObjectId];
                dst = objRec(dst, parentObject, prefix, dict);
            }
            break;
        }
    }

    for (let type in src) {
        if (type === 'propertyState') {
            continue;
        }
        let field = prefix + "." + type;
        if (REQ_FIELDS.includes(field)) {
            if (dst[type] === undefined)
                dst[type] = {};
            if (type === 'children') {
                field = '.pageElements';
            }
            dst[type] = objRec(dst[type], src[type], field, dict);
        }
        else if (type === 'video') {
            if (src[type].hasOwnProperty('videoProperties')) {
                let chField = 'imageProperties';
                let actType = 'image';
                field = prefix + '.' + actType  + '.' + chField;
                if (dst[actType] === undefined)
                    dst[actType] = {};
                if (dst[actType][chField] === undefined)
                    dst[actType][chField] = {};
                dst[actType][chField] = objRec(dst[actType][chField], src[type]['videoProperties'], field, dict);    
            }
        }
        else if (type === 'sheetsChart') {
            if (src[type].hasOwnProperty('sheetsChartProperties')) {
                if (src[type]['sheetsChartProperties'].hasOwnProperty('chartImageProperties')) {
                    let chField = 'imageProperties';
                    let actType = 'image';
                    field = prefix + '.' + actType  + '.' + chField;
                    if (dst[actType] === undefined)
                        dst[actType] = {};
                    if (dst[actType][chField] === undefined)
                        dst[actType][chField] = {};
                    dst[actType][chField] = objRec(dst[actType][chField], src[type]['sheetsChartProperties']['chartImageProperties'], field, dict);        
                }
            }
        }
        else if (type === 'link') {
            dst['hasLink'] = !isEmpty(src[type]);
        }
        else if (type === 'startConnection') {
            if (dst['hasConnection'] === undefined) {
                dst['hasConnection'] = false;
            }
            dst['hasConnection'] |= !isEmpty(src[type]);
        }
        else if (type === 'endConnection') {
            if (dst['hasConnection'] === undefined) {
                dst['hasConnection'] = false;
            }
            dst['hasConnection'] |= !isEmpty(src[type]);
        }
    }
    return dst;
}

function extractPage(pages, dict) {
    let template = {};

    for (let page of pages) {
        template = objRec(template, page, '', dict);
    }
    return template;
}

function assignElementProperties(pageObjectId, size, transform) {
    let ret = {
        pageObjectId,
    }
    if (size !== undefined) {
        if (!size.width.hasOwnProperty('magnitude')) {
            size.width.magnitude = 1;
            size.width.unit = 'EMU';
        }
        if (!size.height.hasOwnProperty('magnitude')) {
            size.height.magnitude = 1;
            size.height.unit = 'EMU';
        }
        ret['size'] = size;
    }
    if (transform !== undefined) {
        ret['transform'] = transform;
    }
    return ret;
}

function getPageElementRequests(pageId, pageElement, suffix) {
    let objectId = random();
    let requests = [];
    let request = {
        objectId,
        elementProperties: {},
    };
    switch (pageElement.additional.originalType) {
        // case 'elementGroup':
        //     if (Array.isArray(pageElement.elementGroup.children)) {
        //         let num_pageElement = 0;
        //         let childrenObjectIds = [];
        //         for (let obj of pageElement.elementGroup.children) {
        //             let result = getPageElementRequests(pageId, obj, suffix + (num_pageElement.toString()));
        //             requests = requests.concat(result.requests);
        //             let hasRequest = false;
        //             for (let r of requests) {
        //                 if (r.objectId === result.objectId) {
        //                     hasRequest = true;
        //                     break;
        //                 }
        //             }
        //             if (hasRequest) {
        //                 childrenObjectIds.push(result.objectId);
        //                 num_pageElement++;
        //             }
        //         }
        //         if (childrenObjectIds.length > 0) {
        //             requests.push({
        //                 groupObjects: {
        //                     groupObjectId: objectId,
        //                     childrenObjectIds,
        //                 }
        //             });
        //         }
        //     }
        //     break;
        case 'shape':
            request.elementProperties = assignElementProperties(pageId, pageElement.size, pageElement.transform);
            
            if (pageElement.shape.hasOwnProperty('shapeType')) {
                request['shapeType'] = pageElement.shapeType;
            }
            if (request.shapeType === undefined) {
                request['shapeType'] = 'RECTANGLE';
            }
            requests.push({
                createShape: request
            });

            if (pageElement.additional.text.length > 0) {
                /// TEXT FORMAT: TEXT_BOX_{NUMBER}
                let text = "TEXT_BOX_" + suffix;
                
                requests.push({
                    insertText: {
                        objectId,
                        text: text,
                    }
                });

                if (pageElement.shape.hasOwnProperty('text')
                    && Array.isArray(pageElement.shape.text.textElements)
                ) {
                    for (let textElement of pageElement.shape.text.textElements) {
                        if (textElement.hasOwnProperty('paragraphMarker')
                            && textElement.paragraphMarker.hasOwnProperty('style')
                        ) {
                            let fields = objRecTraverse(textElement.paragraphMarker.style, '');
                            if (fields.length > 0) {
                                requests.push({
                                    updateParagraphStyle: {
                                        objectId,
                                        style: textElement.paragraphMarker.style,
                                        textRange: {
                                            type: 'ALL',
                                        },
                                        fields: fields.join(" "),
                                    }
                                });
                            }
                            break;
                        }
                    }
                    for (let textElement of pageElement.shape.text.textElements) {
                        if (textElement.hasOwnProperty('textRun')    
                            && textElement.textRun.hasOwnProperty('style')
                        ) {
                            let fields = objRecTraverse(textElement.textRun.style)
                            if (fields.length > 0) {
                                requests.push({
                                    updateTextStyle: {
                                        objectId,
                                        style: textElement.textRun.style,
                                        textRange: {
                                            type: 'ALL',
                                        },
                                        fields: fields.join(" "),
                                    }
                                });
                            }
                            break;
                        }
                    }
                    for (let textElement of pageElement.shape.text.textElements) {
                        if (textElement.hasOwnProperty('autoText')    
                            && textElement.autoText.hasOwnProperty('style')
                        ) {
                            let fields = objRecTraverse(textElement.autoText.style);
                            if (fields.length > 0) {
                                requests.push({
                                    updateTextStyle: {
                                        objectId,
                                        style: textElement.autoText.style,
                                        textRange: {
                                            type: 'ALL',
                                        },
                                        fields: fields.join(" "),
                                    }
                                });
                            }
                            break;
                        }
                    }
                }
            }
            if (pageElement.shape.hasOwnProperty('shapeProperties')) {
                let fields = objRecTraverse(pageElement.shape.shapeProperties);
                if (fields.length > 0) {
                    requests.push({
                        updateShapeProperties: {
                            objectId,
                            shapeProperties: pageElement.shape.shapeProperties,
                            fields: fields.join(" "),
                        }
                    });
                }
            }
            break;
        case 'image':
        case 'video':
        case 'sheetsChart':
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
            if (pageElement.image.hasOwnProperty('imageProperties')) {
                let fields = objRecTraverse(pageElement.image.imageProperties, '');
                if (fields.length > 0) {
                    requests.push({
                        updateImageProperties: {
                            objectId,
                            imageProperties: pageElement.image.imageProperties,
                            fields: fields.join(" "),
                        }
                    });
                }
            }
            break;
        case 'line':
            if (pageElement.line.hasOwnProperty('lineProperties'))
            {
                if (pageElement.line.lineProperties['hasLink'] === 1
                || pageElement.line.lineProperties['hasConnection'] === 1) {
                    break;
                }
            }
            
            request.elementProperties = assignElementProperties(pageId, pageElement.size, pageElement.transform);
            
            if (pageElement.line.hasOwnProperty('lineCategory')) {
                request['category'] = pageElement.line.lineCategory;
            }
            requests.push({
                createLine: request
            });
            if (pageElement.line.hasOwnProperty('lineProperties')) {
                let fields = objRecTraverse(pageElement.line.lineProperties, '');
                if (fields.length > 0) {
                    requests.push({
                        updateLineProperties: {
                            objectId,
                            lineProperties: pageElement.line.lineProperties,
                            fields: fields.join(" "),
                        }
                    });
                }
            }
            break;
        default:
            console.log('no such type:', pageElement);
    }
    return {
        requests,
        objectId
    };
}

function initializePage(pageId, source, dict, index) {
    let pages = [];
    if (source === undefined) {
        return {};
    }
    if (Array.isArray(source.slides)) {
        if (source.slides.length <= index) {
            return {};
        }
        pages.push(source.slides[index]); 
    }
    if (Array.isArray(source.layouts) 
        && pages[0].hasOwnProperty('slideProperties') 
        && pages[0]['slideProperties'].hasOwnProperty('layoutObjectId')
        && dict.hasOwnProperty(pages[0].slideProperties.layoutObjectId)
    ) {
        let layout = dict[pages[0].slideProperties.layoutObjectId];
        if (layout != null) {
            pages.push(layout);
        }
    }
    if (Array.isArray(source.masters) 
        && pages[0].hasOwnProperty('slideProperties') 
        && pages[0]['slideProperties'].hasOwnProperty('masterObjectId')
        && dict.hasOwnProperty(pages[0].slideProperties.masterObjectId)
    ) {
        if (pages.length > 1) {
            if (pages[1].hasOwnProperty('layoutProperties') 
                && pages[1]['layoutProperties'].hasOwnProperty('masterObjectId')
                && dict.hasOwnProperty(pages[1].layoutProperties.masterObjectId)
            ) {
                if (pages[0].slideProperties.masterObjectId !== pages[1].layoutProperties.masterObjectId) {
                    let masterLayout = dict[pages[1].layoutProperties.masterObjectId];
                    if (masterLayout != null) {
                        pages.push(masterLayout);
                    }
                }
            }
        }
        let master = dict[pages[0].slideProperties.masterObjectId];
        if (master != null) {
            pages.push(master);
        }
    }
    


    let pageTemplate = extractPage(pages.reverse(), dict);

    let requests = [];


    // if (pageTemplate.hasOwnProperty('pageProperties')) {
    //     // let fields = objRecTraverse(pageTemplate.pageProperties, '');
    //     // console.log(fields);
    //     // if (fields.length > 0) {
    //     //     requests.push({
    //     //         updatePageProperties: {
    //     //             objectId,
    //     //             pageProperties: pageTemplate.pageProperties,
    //     //             fields: fields.join(" "),
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

/**
 * Function that extracts the template and creates slide with the template.
 * 
 * @param {str} forId 
 * @returns 
 */

export async function extract(forId) {
    const initializeSlide = (pageId, source, dict, index) => {
        let requests = initializePage(pageId, source, dict, index);
        return requests;
    }

    const initializePresentation = (resolve, source, id) => {
        console.log(source);
        let dict = updateObjectId(source);
        //Extract the Template From `source`
        let titlePageId = 'p';
        let requests = initializeSlide(titlePageId, source, dict, 0);
        
        for (let index = 1; index < source.slides.length; index++) {
            let pageId = random(); 
            requests.push({
                createSlide: {
                    objectId: pageId,
                    insertionIndex: index.toString(),
                },
            });
            requests = requests.concat(initializeSlide(pageId, source, dict, index));
        }
        console.log(requests);
        gapi.client.slides.presentations.batchUpdate({
            presentationId: id,
            requests: requests,
        }).then((response) => {
            console.log("Updated!!");
            resolve(id);
        });
    }

    return new Promise((resolve, reject) => {
        gapi.client.slides.presentations.get({
            presentationId: forId
        }).then(function(response) {
            let title = 'TEMPLATE_' + response.result.title;
            createPresentation(title, (id) => {
                if (id === undefined) {
                    throw Error('Could not create Presentation');
                }
                initializePresentation(resolve, response.result, id);
            });
        }, function(response) {
            appendPre('Error in extract: ' + response.result.error.message);
        });
    });
}