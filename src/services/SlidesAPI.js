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
        let prev_dst = [];
        let nestingLevel = 0;
        if (Array.isArray(dst))
            prev_dst = dst.slice();
        dst = [];
        let field = prefix + '.0';
        if (REQ_FIELDS.includes(field)) {
            for (let obj of src) {
                if (prefix.endsWith('pageElements')) {
                    let pageElement = objRec({}, obj, field, dict);
                    pageElement = calculateAdditional(pageElement, obj);
                    dst.push(pageElement);
                }
                else if (prefix.endsWith('textElements')) {
                    let parent = {};
                    if (prev_dst.length === 18) {
                        if (obj.hasOwnProperty('paragraphMarker')) {
                            if (obj.paragraphMarker.hasOwnProperty('bullet')
                                && obj.paragraphMarker.bullet.hasOwnProperty('nestingLevel')
                            ) {
                                nestingLevel = obj.paragraphMarker.bullet.nestingLevel;
                            }
                            parent['paragraphMarker'] = prev_dst[nestingLevel * 2].paragraphMarker;
                        }
                        else {
                            parent['textRun'] = prev_dst[nestingLevel * 2 + 1].textRun;
                        }
                    }
                    dst.push(objRec(parent, obj, field, dict));
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
        if (type === 'placeholder') {
            if (src[type].hasOwnProperty('parentObjectId')
                && dict.hasOwnProperty(src[type].parentObjectId)
            ) {
                let parentObject = dict[src[type].parentObjectId];
                dst = objRec(dst, parentObject.shape, prefix, dict);
            }
            break;
        }
    }

    for (let type in src) {
        if (type === 'propertyState') {
            if (src[type] !== 'INHERIT') {
                dst[type] = src[type];
            }
            continue;
        }
        let field = prefix + "." + type;
        if (REQ_FIELDS.includes(field)) {
            if (dst[type] === undefined)
                dst[type] = {};
            if (type === 'children') {
                field = '.pageElements';
            }
            // take care of unions
            if (type === 'themeColor') {
                delete dst.rgbColor;
            }
            if (type === 'rgbColor') {
                delete dst.themeColor;
            }
            if (type === 'solidFill') {
                delete dst.stretchedPictureFill;
            }
            if (type === 'stretchedPictureFill') {
                delete dst.solidFill;
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

function mergePages(pages, dict) {
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
            size.width.magnitude = 10000;
            size.width.unit = 'EMU';
            console.log("width = 0");
        }
        if (!size.height.hasOwnProperty('magnitude')) {
            size.height.magnitude = 10000;
            size.height.unit = 'EMU';
            console.log("height = 0");
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
    let validObjectId = false;
    let requests = [];
    let request = {
        objectId,
        elementProperties: {},
    };
    switch (pageElement.additional.originalType) {
        
        // case 'elementGroup':
        //     console.log(pageElement.size, pageElement.transform);
        //     if (Array.isArray(pageElement.elementGroup.children)) {
        //         let num_pageElement = 0;
        //         let childrenObjectIds = [];
        //         for (let obj of pageElement.elementGroup.children) {
        //             let result = getPageElementRequests(pageId, obj, suffix + '_' + (num_pageElement.toString()));
        //             requests = requests.concat(result.requests);
        //             if (result.validObjectId) {
        //                 childrenObjectIds.push(result.objectId);
        //                 num_pageElement++;
        //             }
        //         }
        //         if (childrenObjectIds.length > 1) {
        //             requests.push({
        //                 groupObjects: {
        //                     groupObjectId: objectId,
        //                     childrenObjectIds,
        //                 }
        //             });
        //             validObjectId = true;
        //             if (pageElement.transform !== undefined) {
        //                 requests.push({
        //                     updatePageElementTransform: {
        //                         objectId,
        //                         transform: pageElement.transform,
        //                         applyMode: 'ABSOLUTE',
        //                     }
        //                 });
        //             }
        //         }
        //         else {
        //             for (let ch of childrenObjectIds) {
        //                 if (pageElement.transform !== undefined) {
        //                     requests.push({
        //                         updatePageElementTransform: {
        //                             objectId: ch,
        //                             transform: pageElement.transform,
        //                             applyMode: 'RELATIVE',
        //                         }
        //                     });
        //                 }
        //             }
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
            validObjectId = true;

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
                            let result = objRecTraverse(textElement.paragraphMarker.style, '');
                            if (result.fields.length > 0) {
                                requests.push({
                                    updateParagraphStyle: {
                                        objectId,
                                        style: result.dst,
                                        textRange: {
                                            type: 'ALL',
                                        },
                                        fields: result.fields.join(),
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
                            let result = objRecTraverse(textElement.textRun.style)
                            if (result.fields.length > 0) {
                                requests.push({
                                    updateTextStyle: {
                                        objectId,
                                        style: result.dst,
                                        textRange: {
                                            type: 'ALL',
                                        },
                                        fields: result.fields.join(),
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
                            let result = objRecTraverse(textElement.autoText.style);
                            if (result.fields.length > 0) {
                                requests.push({
                                    updateTextStyle: {
                                        objectId,
                                        style: result.dst,
                                        textRange: {
                                            type: 'ALL',
                                        },
                                        fields: result.fields.join(),
                                    }
                                });
                            }
                            break;
                        }
                    }
                }
            }
            if (pageElement.shape.hasOwnProperty('shapeProperties')) {
                let result = objRecTraverse(pageElement.shape.shapeProperties);
                if (result.fields.length > 0) {
                    requests.push({
                        updateShapeProperties: {
                            objectId,
                            shapeProperties: result.dst,
                            fields: result.fields.join(),
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
            validObjectId = true;
            if (pageElement.image.hasOwnProperty('imageProperties')) {
                let result = objRecTraverse(pageElement.image.imageProperties, '');
                if (result.fields.length > 0) {
                    requests.push({
                        updateImageProperties: {
                            objectId,
                            imageProperties: result.dst,
                            fields: result.fields.join(),
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
            validObjectId = true;
            if (pageElement.line.hasOwnProperty('lineProperties')) {
                let result = objRecTraverse(pageElement.line.lineProperties, '');
                if (result.fields.length > 0) {
                    requests.push({
                        updateLineProperties: {
                            objectId,
                            lineProperties: result.dst,
                            fields: result.fields.join(),
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
        objectId,
        validObjectId,
    };
}

function extractPage(dict, page) {
    let pages = [page];
    if (page.hasOwnProperty('slideProperties')) {
        if (page.slideProperties.hasOwnProperty('layoutObjectId')) {
            let objectId = page.slideProperties.layoutObjectId;
            if (dict.hasOwnProperty(objectId))
                pages.push(dict[objectId])
        }
        if (page.slideProperties.hasOwnProperty('masterObjectId')) {
            let objectId = page.slideProperties.masterObjectId;
            if (dict.hasOwnProperty(objectId))
                pages.push(dict[objectId])
        }
        
    }
    else if (page.hasOwnProperty('layoutProperties')) {
        if (page.layoutProperties.hasOwnProperty('masterObjectId')) {
            let objectId = page.layoutProperties.masterObjectId;
            if (dict.hasOwnProperty(objectId))
                pages.push(dict[objectId])
        }
    }
    
    return mergePages(pages.reverse(), dict);
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

function tryAddNewTemplate(templates, pageId, page, weight) {
    templates.push({
        pageId,
        page,
        weight,
    });
    return templates;
}

/**
 * Function that extracts the template and creates slide with the template.
 * 
 * @param {str} forId 
 * @returns 
 */

export async function extract(forId) {

    const initializePresentation = (resolve, source, id) => {
        console.log(source);
        let dict = updateObjectId(source);

        let templates = [];

        //Extract Layouts from `source`
        for (let layout of source.layouts) {
            templates.push({
                pageId: random(),
                page: extractPage(dict, layout),
                weight: 1,
            });
        }

        //Extract the Template From `source`
        let titlePage = extractPage(dict, source.slides[0]);
        templates = tryAddNewTemplate(templates, random(), titlePage, 2);
        
        for (let index = 1; index < source.slides.length; index++) {
            let page = extractPage(dict, source.slides[index]);
            templates = tryAddNewTemplate(templates, random(), page, 2);
        }

        console.log(templates);

        let requests = [];
        for (let template of templates) {
            let pageId = template.pageId;
            let page = template.page;
            let weight = template.weight;
            requests.push({
                createSlide: {
                    objectId: pageId,
                },
            });
            requests = requests.concat(initializePage(pageId, page));
        }
        
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