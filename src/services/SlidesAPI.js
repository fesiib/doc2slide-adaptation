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

function findByObjectId(list, objectId) {
    for (let obj of list) {
        if (obj.objectId === objectId) {
            return obj;
        }
    }
    return null;
}

function isEmpty(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

function objRec(dst, src, prefix = '') {
    if (typeof src !== 'object' || src === null) {
        return src;
    }

    if (Array.isArray(src)) {
        // do smth else
        dst = [];
        let field = prefix + '.0';
        if (REQ_FIELDS.includes(field)) {
            for (let obj of src) {
                dst.push(objRec({}, obj, field));
            }
        }
        return dst;
    }

    for (let type in src) {
        if (type === 'propertyState') {
            if (src[type] === 'INHERIT') {
                return dst;
            }
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
            dst[type] = objRec(dst[type], src[type], field);
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
                dst[actType][chField] = objRec(dst[actType][chField], src[type]['videoProperties'], field);    
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
                    dst[actType][chField] = objRec(dst[actType][chField], src[type]['sheetsChartProperties']['chartImageProperties'], field);        
                }
            }
        }
    }
    return dst;
}

function extractPageBackgroundFill(page, layout, master) {
    let rgbColorTemplate = {
        red: 0, // <= 1.0
        green: 0, // <= 1.0
        blue: 0, // <= 1.0
    };

    let dimensionTemplate = {
        magnitude: 0,
        unit: 'EMU',
    };

    let sizeTemplate = {
        width: dimensionTemplate,
        height: dimensionTemplate,
    };

    let opaqueColorTemplate = {
        rgbColor: rgbColorTemplate,
        themeColor: 'THEME_COLOR_TYPE_UNSPECIFIED',
    };
    let solidFillTemplate = {
        color: opaqueColorTemplate,
        alpha: 1.0,
    };
    let pageBackgroundFill = {
        solidFill: solidFillTemplate,
        stretchedPictureFill: {
            contentUrl: '',
            size: sizeTemplate,
        }
    }

    if (page.propertyState === 'NO_RENDER') {
        return pageBackgroundFill;
    }

    pageBackgroundFill = objRec(pageBackgroundFill, master);
    pageBackgroundFill = objRec(pageBackgroundFill, layout);
    pageBackgroundFill = objRec(pageBackgroundFill, page);
    return pageBackgroundFill;
}

function extractColorScheme(page, layout, master) {
    let colorsDict = {};
    if (master !== undefined && master.colors !== undefined && master.colors.length > 0) {
        for (let themeColorPair of master.colors) {
            colorsDict[themeColorPair.type] = themeColorPair.color;
        }
    }
    if (layout !== undefined && layout.colors !== undefined && layout.colors.length > 0) {
        for (let themeColorPair of layout.colors) {
            colorsDict[themeColorPair.type] = themeColorPair.color;
        }
    }
    if (page !== undefined && page.colors !== undefined && page.colors.length > 0) {
        for (let themeColorPair of page.colors) {
            colorsDict[themeColorPair.type] = themeColorPair.color;
        }
    }
    let colorScheme = {
        colors: [],
    }
    for (let type in colorsDict) {
        colorScheme.colors.push({
            type: type,
            color: colorsDict[type],
        });
    }
    return colorScheme;
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

function extractPage(pages) {
    let template = {};
    for (let page of pages) {
        template = objRec(template, page, '');
    }
    template = calculateAdditional(template);
    return template;
}

function initializePage(pageId, source, index) {
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
    ) {
        let layout = findByObjectId(source.layouts, pages[0].slideProperties.layoutObjectId);
        if (layout != null) {
            pages.push(layout);
        }
    }
    if (Array.isArray(source.masters) 
        && pages[0].hasOwnProperty('slideProperties') 
        && pages[0]['slideProperties'].hasOwnProperty('masterObjectId')
    ) {
        if (pages.length > 1) {
            if (pages[1].hasOwnProperty('layoutProperties') 
                && pages[1]['layoutProperties'].hasOwnProperty('masterObjectId')
            ) {
                if (pages[0].slideProperties.masterObjectId !== pages[1].layoutProperties.masterObjectId) {
                    let masterLayout = findByObjectId(source.masters, pages[1].layoutProperties.masterObjectId);
                    if (masterLayout != null) {
                        pages.push(masterLayout);
                    }
                }
            }
        }
        let master = findByObjectId(source.masters, pages[0].slideProperties.masterObjectId);
        if (master != null) {
            pages.push(master);
        }
    }
    
    let pageTemplate = extractPage(pages);

    console.log(pageTemplate);
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
    const initializeSlide = (pageId, source, index) => {
        let requests = [];
        
        requests.concat(initializePage(pageId, source, index));
        
        return requests;
    }

    const initializePresentation = (resolve, source, id) => {
        console.log(source);
        //Extract the Template From `source`
        let titlePageId = 'p';
        let requests = initializeSlide(titlePageId, source, 0);
        
        for (let index = 1; index < source.slides.length; index++) {
            let pageId = random(); 
            requests.push({
                createSlide: {
                    objectId: pageId,
                    insertionIndex: index.toString(),
                },
            });
            requests = requests.concat(initializeSlide(pageId, source, index));
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