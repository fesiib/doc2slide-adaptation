const { REQ_FIELDS } = require('./requiredFields');
const { calculateAdditional } = require('../Template');

const RGB = ['red', 'blue', 'green'];
const TRANSFORM_VALS = ['scaleX', 'scaleY', 'shearX', 'shearY', 'translateX', 'translateY'];

function isEmpty(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
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
                            else {
                                nestingLevel = 0;
                            }
                            parent.paragraphMarker = {};
                            parent.paragraphMarker.style = JSON.parse(JSON.stringify(prev_dst[nestingLevel * 2].paragraphMarker.style));
                            
                        }
                        else if (obj.hasOwnProperty('textRun')) {
                            parent.textRun = {};
                            parent.textRun.style = JSON.parse(JSON.stringify(prev_dst[nestingLevel * 2 + 1].textRun.style));
                        }
                    }
                    if (obj.hasOwnProperty('autoText')) {
                        // Default slide number style
                        parent.autoText = {};
                        parent.autoText.style = {
                            weightedFontFamily: {
                                fontFamily: 'Arial',
                                weight: 400,
                            },
                            foregroundColor: {
                                opaqueColor: {
                                    themeColor: 'DARK1',
                                }
                            },
                            fontSize: {
                                magnitude: 10,
                                unit: 'PT',
                            }
                        };
                    }
                    let dstElement = objRec(parent, obj, field, dict);
                    dst.push(dstElement);
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
            if (TRANSFORM_VALS.includes(type) || type === 'magnitude') {
                continue;
            }
            if (RGB.includes(type)) {
                for (let color of RGB) {
                    dst[color] = 0;
                    if (src.hasOwnProperty(color)) {
                        dst[color] = src[color];
                    }
                }
                continue;
            }
            if (type === 'unit') {
                dst[type] = src[type];
                if (prefix.endsWith('transform')) {
                    for (let entity of TRANSFORM_VALS) {
                        dst[entity] = 0;
                        if (src.hasOwnProperty(entity)) {
                            dst[entity] = src[entity];
                        }
                    }
                }
                else {
                    dst.magnitude = 0;
                    if (src.hasOwnProperty('magnitude')) {
                        dst.magnitude = src.magnitude;
                    }
                }
                continue;
            }
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
        // else if (type === 'table') {
        //     dst.shape = {
        //         shapeType: 'TEXT_BOX',
        //         shapeProperties: {
        //             outline: {
        //                 outlineFill: {
        //                     solidFill: {
        //                         color: {
        //                             rgbColor: {
        //                                 red: 0,
        //                                 green: 1,
        //                                 blue: 0,
        //                             },
        //                         },
        //                         alpha: 1,
        //                     }
        //                 },
        //                 weight: {
        //                     magnitude: 12700,
        //                     unit: 'EMU',
        //                 },
        //                 dashStyle: 'DOT',
        //             }
        //         },
        //         placeholder: {
        //             type: 'OBJECT',
        //         },
        //     };
        // }
        // else if (type === 'link') {
        //     dst['hasLink'] = !isEmpty(src[type]);
        // }
        // else if (type === 'startConnection') {
        //     if (dst['hasConnection'] === undefined) {
        //         dst['hasConnection'] = false;
        //     }
        //     dst['hasConnection'] |= !isEmpty(src[type]);
        // }
        // else if (type === 'endConnection') {
        //     if (dst['hasConnection'] === undefined) {
        //         dst['hasConnection'] = false;
        //     }
        //     dst['hasConnection'] |= !isEmpty(src[type]);
        // }
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

module.exports = {
    extractPage,
};