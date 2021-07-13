import { REQ_FIELDS } from './SlidesAPIRqFields';

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

export function extractPage(dict, page) {
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