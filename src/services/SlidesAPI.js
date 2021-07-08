import {gapi} from 'gapi-script';
import { v4 as random} from 'uuid';
import { createPresentation } from './DriveAPI';

import {appendPre} from './GoogleAPI';
import { REQ_FIELDS } from './SlidesAPIRqFields';

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

function objRec(dst, src, prefix, dict) {
    if (typeof src !== 'object' || src === null) {
        return src;
    }

    if (Array.isArray(src)) {
        // do smth else
        dst = [];
        let field = prefix + '.0';
        if (REQ_FIELDS.includes(field)) {
            for (let obj of src) {
                dst.push(objRec({}, obj, field, dict));
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
    }
    return dst;
}

/**
 * TODO: Calculate Additional Information
 * @param {Object} page 
 * @returns 
 */

function calculateAdditional(page) {
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
    return page;
}

function extractPage(pages, dict) {
    let template = {};

    for (let page of pages) {
        template = objRec(template, page, '', dict);
    }
    template = calculateAdditional(template);
    return template;
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
        && dict.hasOwnProperty(source.layouts, pages[0].slideProperties.layoutObjectId)
    ) {
        let layout = dict[pages[0].slideProperties.layoutObjectId];
        if (layout != null) {
            pages.push(layout);
        }
    }
    if (Array.isArray(source.masters) 
        && pages[0].hasOwnProperty('slideProperties') 
        && pages[0]['slideProperties'].hasOwnProperty('masterObjectId')
        && dict.hasOwnProperty(source.layouts, pages[0].slideProperties.masterObjectId)
    ) {
        if (pages.length > 1) {
            if (pages[1].hasOwnProperty('layoutProperties') 
                && pages[1]['layoutProperties'].hasOwnProperty('masterObjectId')
                && dict.hasOwnProperty(source.layouts, pages[1].layoutProperties.masterObjectId)
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
    


    let pageTemplate = extractPage(pages.reverse(), source);
    
    console.log(pages, pageTemplate);

    let requests = [];
    
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
        let requests = [];
        
        requests.concat(initializePage(pageId, source, dict, index));
        
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