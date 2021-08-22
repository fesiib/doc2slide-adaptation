const { v4 : uuidv4} = require('uuid');

const RGB = ['red', 'blue', 'green'];

const HEADER_PLACEHOLDER = [
    'CENTERED_TITLE',
    'TITLE',
    'HEADER',
];

const SUBHEADER_PLACEHOLDER = [
    'SUBTITLE',
    'SUBHEADER', //custom
];

const BODY_PLACEHOLDER = [
    'BODY',
    'FOOTER',
    'OBJECT',
    'CAPTION', //custom
];

const SLIDE_NUMBER_PLACEHOLDER = [
    'SLIDE_NUMBER',
];

const NOT_BODY_PLACEHOLDER = [
    'NONE', // 	Default value, signifies it is not a placeholder.
    //'BODY', // 	Body text.
    'CHART', // 	Chart or graph.
    'CLIP_ART', // 	Clip art image.
    'CENTERED_TITLE', // 	Title centered.
    'DIAGRAM', // 	Diagram.
    'DATE_AND_TIME', // 	Date and time.
    //'FOOTER', // 	Footer text.
    'HEADER', // 	Header text.
    'MEDIA', // 	Multimedia.
    'OBJECT', // 	Any content type.
    'PICTURE', // 	Picture.
    'SLIDE_NUMBER', // 	Number of a slide.
    //'SUBTITLE', // 	Subtitle.
    'TABLE', // 	Table.
    'TITLE', // 	Slide title.
    'SLIDE_IMAGE', // 	Slide image. 
];

const IMAGE_PLACEHOLDER = [
    'CHART', // 	Chart or graph.
    'CLIP_ART', // 	Clip art image.
    'DIAGRAM', // 	Diagram.
    'MEDIA', // 	Multimedia.
    'OBJECT', // 	Any content type.
    'PICTURE', // 	Picture.
    'TABLE', // 	Table.
    'SLIDE_IMAGE', // 	Slide image. 
];

const MAX_WORD_LENGTH = Number.MAX_SAFE_INTEGER;

const INCH = 914400;

const PT = 12700;

const EMU = 1;

const PX = 4 / 3 * PT;

const SMALL_ELEMENT_AREA_PERCENTAGE = 3;

const DEFAULT_SIZE = {
    width: {
        magnitude: 0,
        unit: 'EMU',
    },
    height: {
        magnitude: 0,
        unit: 'EMU',
    },
};

const DEFAULT_TRANSFORM = {
    scaleX: 1,
    scaleY: 1,
    shearX: 0,
    shearY: 0,
    translateX: 0,
    translateY: 0,
    unit: 'EMU',
}


function random() {
    let id = uuidv4();
    return id.replace(/-/g, '');
}

function correctDimension(dimension) {
    if (dimension === undefined) {
        return false;
    }
    if (!dimension.hasOwnProperty('magnitude')) {
        return false;
    }
    if (!dimension.hasOwnProperty('unit')) {
        return false;
    }
    return true;
}

function consumeDimension(dimension) {
    if (dimension === undefined) {
        throw Error('no dimension');
    }
    if (!dimension.hasOwnProperty('magnitude')) {
        return 0;
    }
    let result = dimension.magnitude;
    if (dimension.unit === 'PT') {
        result *= PT;
    }
    else if (dimension.unit === 'EMU') {
        result *= EMU;
    }
    else {
        throw Error('unit is not supported: ' + dimension.unit);
    }
    return result;
}

function consumeSize(size) {
    if (size === undefined) {
        throw Error('no field size');
    }

    return {
        width: consumeDimension(size.width),
        height: consumeDimension(size.height),
    }
};

function consumeTransform(transform) {
    if (transform === undefined) {
        transform = { ...DEFAULT_TRANSFORM };
    }

    if (!transform.hasOwnProperty('scaleX')) {
        transform.scaleX = 0;
    }

    if (!transform.hasOwnProperty('scaleY')) {
        transform.scaleY = 0;
    }

    if (!transform.hasOwnProperty('shearX')) {
        transform.shearX = 0;
    }

    if (!transform.hasOwnProperty('shearY')) {
        transform.shearY = 0;
    }

    if (!transform.hasOwnProperty('translateX')) {
        transform.translateX = 0;
    }

    if (!transform.hasOwnProperty('translateY')) {
        transform.translateY = 0;
    }

    if (transform.unit === 'PT') {
        transform.translateX *= PT;
        transform.translateY *= PT;
    }
    else if (transform.unit === 'EMU') {
        transform.translateX *= EMU;
        transform.translateY *= EMU;
    }
    else {
        throw Error('cannot support unit: ' + transform.unit);
    }
    return transform;
}

function multiplyTransforms(t1, t2) {
    t1 = consumeTransform(t1);
    t2 = consumeTransform(t2);
    let t = { ...t1 };
    t.scaleX = t1.scaleX * t2.scaleX + t1.shearX * t2.shearY;
    t.shearX = t1.scaleX * t2.shearX + t1.shearX * t2.scaleY;
    t.translateX = t1.scaleX * t2.translateX + t1.shearX * t2.translateY + t1.translateX;
    
    t.shearY = t1.shearY * t2.scaleX + t1.scaleY * t2.shearY;
    t.scaleY = t1.shearY * t2.shearX + t1.scaleY * t2.scaleY;
    t.translateY = t1.shearY * t2.translateX + t1.scaleY * t2.translateY + t1.translateY;

    return t;
}

function consumeRGBColor(rgbColor) {
    let ret = {
        red: 0,
        green: 0,
        blue: 0,
    };
    if (rgbColor.hasOwnProperty('red'))
        ret.red = rgbColor.red;
    if (rgbColor.hasOwnProperty('green'))
        ret.green = rgbColor.green;
    if (rgbColor.hasOwnProperty('blue'))
        ret.blue = rgbColor.blue;
    return ret;
}

function getPageElementType(element) {
    if (element.hasOwnProperty('shape')) {
        return 'shape';
    }
    if (element.hasOwnProperty('image')) {
        return 'image';
    }
    // if (element.hasOwnProperty('line')) {
    //     return 'line';
    // }
    if (element.hasOwnProperty('elementGroup')) {
        return 'elementGroup';
    }
    console.log('cannot find such type', element);
    return 'unspecified';
}

function toLines(layout) {
    let lines = [];

    let horPts = [];
    let verPts = [];
    
    for (let e of layout.pageElements) {
        horPts.push({
            pt: e.startX,
            type: 0,
        });
        horPts.push({
            pt: e.finishX,
            type: 1,
        });
        verPts.push({
            pt: e.startY,
            type: 0,
        });
        verPts.push({
            pt: e.finishY,
            type: 1,
        });
    }

    const comparator = (p1, p2) => {
        if (p1.pt < p2.pt) {
            return -1;
        }
        if (p1.pt > p2.pt) {
            return 1;
        }
        if (p1.type > p2.type) {
            return -1;
        }
        if (p1.type < p2.type) {
            return 1;
        }
        return 0;
    };

    horPts.sort(comparator);
    verPts.sort(comparator);

    for (let e of horPts) {
        // if (e.type === 1) {
        //     open -= 1;
        // }
        // else {
        //     open += 1;
        // }
        // if (open === 0) {
        //     continue;
        // }
        let color = {
            rgbColor: {
                red: 1,
                green: 0,
                blue: 0,
            },
        };

        if (e.type === 1) {
            color = {
                rgbColor: {
                    red: 0,
                    green: 0,
                    blue: 1,
                },
            }
        }

        lines.push({
            size: {
                height: {
                    magnitude: 7 * INCH,
                    unit: 'EMU',
                },
                width: {
                    magnitude: 0,
                    unit: 'EMU',
                },
            },
            transform: {
                scaleX: 1,
                scaleY: 1,
                shearX: 0,
                shearY: 0,
                translateX: e.pt,
                translateY: 0,
                unit: 'EMU',
            },
            line: {
                lineProperties: {
                    lineFill: {
                        solidFill: {
                            color: color,
                            alpha: 1,
                        }
                    },
                    weight: {
                        magnitude: PT,
                        unit: 'EMU'
                    },
                    dashStyle: 'SOLID',
                },
                lineType: 'STRAIGHT_LINE',
                lineCategory: 'STRAIGHT'
            },
            additional: {
                originalType: 'line',
            }
        });
    }
    for (let e of verPts) {
        // if (e.type === 1) {
        //     open -= 1;
        // }
        // else {
        //     open += 1;
        // }
        // if (open === 0) {
        //     continue;
        // }
        let color = {
            rgbColor: {
                red: 1,
                green: 0,
                blue: 0,
            },
        };

        if (e.type === 1) {
            color = {
                rgbColor: {
                    red: 0,
                    green: 0,
                    blue: 1,
                },
            }
        }

        lines.push({
            size: {
                height: {
                    magnitude: 0,
                    unit: 'EMU',
                },
                width: {
                    magnitude: 11 * INCH,
                    unit: 'EMU',
                },
            },
            transform: {
                scaleX: 1,
                scaleY: 1,
                shearX: 0,
                shearY: 0,
                translateX: 0,
                translateY: e.pt,
                unit: 'EMU',
            },
            line: {
                lineProperties: {
                    lineFill: {
                        solidFill: {
                            color: color,
                            alpha: 1,
                        }
                    },
                    weight: {
                        magnitude: PT,
                        unit: 'EMU'
                    },
                    dashStyle: 'SOLID',
                },
                lineType: 'STRAIGHT_LINE',
                lineCategory: 'STRAIGHT'
            },
            additional: {
                originalType: 'line',
            }
        });
    }
    return lines;
}

function isSmall(rectangle, pageSize) {
    let total = pageSize.width * pageSize.height;
    let width = rectangle.finishX - rectangle.startX;
    let height = rectangle.finishY - rectangle.startY;
    let area = width * height;
    if (area / total * 100 < SMALL_ELEMENT_AREA_PERCENTAGE) {
        return true;
    }
    return false;
}

function getRectangle(size, transform) {
    size = consumeSize(size);
    transform = consumeTransform(transform);
    
    let startX = transform.translateX;
    let startY = transform.translateY;

    let finishX = size.width * transform.scaleX + size.height * transform.shearX + transform.translateX;
    let finishY = size.width * transform.shearY + size.height * transform.scaleY + transform.translateY;

    if (startX > finishX) {
        [startX, finishX] = [finishX, startX]; 
    }

    if (startY > finishY) {
        [startY, finishY] = [finishY, startY]; 
    }
    return {
        startX,
        startY,
        finishX,
        finishY,
    };
}

function sanitizePageElements(pageElements) {
    let newPageElements = [];
    for (let pageElement of pageElements) {
        let type = getPageElementType(pageElement);
        if (type === 'unspecified') {
            continue;
        }
        if (type === 'elementGroup') {
            if (pageElement.elementGroup.hasOwnProperty('children') && Array.isArray(pageElement.elementGroup.children)) {
                pageElement.elementGroup.children = sanitizePageElements(pageElement.elementGroup.children);
            }
            else {
                continue;
            }
        }
        else if (type === 'image' || type === 'shape') {
            if (!pageElement.hasOwnProperty('size'))
                continue;
            if (!pageElement.size.hasOwnProperty('width') || !pageElement.size.hasOwnProperty('height')) {
                continue;
            }
            if (!correctDimension(pageElement.size.width) || !correctDimension(pageElement.size.height)) {
                continue;
            }
            if (pageElement.size.width.magnitude === 0 || pageElement.size.height.magnitude === 0) {
                continue;
            }
            if (pageElement.hasOwnProperty('additional')
                && pageElement.additional.text.length === 0
                && pageElement.additional.contentUrl.length === 0 
            ) {
                continue;
            }
        }
        // else {
        //     if (!pageElement.hasOwnProperty('size'))
        //         continue;
        //     if (!pageElement.size.hasOwnProperty('width') && !pageElement.size.hasOwnProperty('height')) {
        //         continue;
        //     }
        //     if (!correctDimension(pageElement.size.width) && !correctDimension(pageElement.size.height)) {
        //         continue;
        //     }
        // }
        newPageElements.push(pageElement);
    }
    return newPageElements;
}

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
        canbeMapped: [],
        canbeMappedMin: 0,
    }
    if (src.hasOwnProperty('shape')) {
        additional.isReplacable = true;
        additional.originalType = 'shape';

        let exceptionHappened = false;

        if (src.shape.hasOwnProperty('placeholder')
            && src.shape.placeholder.hasOwnProperty('type')
        ) {
            if (IMAGE_PLACEHOLDER.includes(src.shape.placeholder.type)) {
                additional.originalType = 'image';
                additional.canbeMapped.push(MAX_WORD_LENGTH);
                exceptionHappened = true;
            }
            if (SLIDE_NUMBER_PLACEHOLDER.includes(src.shape.placeholder.type)) {
                additional.text.push('#');
                exceptionHappened = true;
            }
        }
        if (src.shape.hasOwnProperty('text')
            && Array.isArray(src.shape.text.textElements)
            && !exceptionHappened
        ) {
            additional.text = [];
            for (let textElement of src.shape.text.textElements) {
                if (textElement.hasOwnProperty('paragraphMarker')) {
                    let l = 0;
                    if (textElement.hasOwnProperty('startIndex'))
                        l = textElement.startIndex;
                    let r = l;
                    if (textElement.hasOwnProperty('endIndex'))
                        r = textElement.endIndex;
                    additional.canbeMapped.push(r - l);
                }
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
        additional.canbeMapped.push(MAX_WORD_LENGTH);
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
        additional.canbeMapped.push(MAX_WORD_LENGTH);
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
        additional.canbeMapped.push(MAX_WORD_LENGTH);
    }
    else {
        additional.isReplacable = false;
        additional.originaType = 'none';
    }
    pageElement['additional'] = additional;
    pageElement.objectId = random();
    return pageElement;
}

function calculateRectangle(pageElement) {
    let size = undefined;
    if (pageElement.hasOwnProperty('size')) {
        size = JSON.parse(JSON.stringify(pageElement.size));
    }
    let transform = { ...pageElement.transform };

    if (pageElement.hasOwnProperty('elementGroup')) {
        let result = getCoveringRectangle(pageElement.elementGroup.children, pageSize);
        size = result.size;
        transform = multiplyTransforms(transform, result.transform);
    }
    
    let rectangle = getRectangle(size, transform);

    pageElement.rectangle = { 
        startX: rectangle.startX / PX,
        startY:rectangle.startY / PX,
        finishX: rectangle.finishX / PX,
        finishY: rectangle.finishY / PX,
        unit: 'PX' 
    };
}

function refreshIdsPageElement(pageElement) {
    pageElement.objectId = random();
    if (pageElement.hasOwnProperty('elementGroup')) {
        if (!Array.isArray(pageElement.elementGroup.children))
            return;
        for (let child of pageElement.elementGroup.children) {
            refreshIdsPageElement(child);
        }
    }
}

function labelPageElement(pageElement) {
    pageElement.type = null;
    if (!pageElement.hasOwnProperty('additional')) {
        pageElement.type = 'NONE';
        return;
    }    
    if (pageElement.hasOwnProperty('shape')) {
        if (pageElement.additional.canbeMapped.length === 1) {
            pageElement.type = 'CAPTION';
        }
        if (pageElement.shape.hasOwnProperty('placeholder')
            && pageElement.shape.placeholder.hasOwnProperty('type')
        ) {
            let type = pageElement.shape.placeholder.type;
            if (BODY_PLACEHOLDER.includes(type)
                && pageElement.additional.canbeMapped.length > 1
            ) {
                pageElement.type = 'BODY';
            }
            else if (HEADER_PLACEHOLDER.includes(type)) {
                pageElement.type = 'HEADER';
            }
            else if (SUBHEADER_PLACEHOLDER.includes(type)) {
                pageElement.type = 'SUBHEADER';
            }
            else if (SLIDE_NUMBER_PLACEHOLDER.includes(type)) {
                pageElement.type = 'SLIDE_NUMBER';
            }
            else if (IMAGE_PLACEHOLDER.includes(type)) {
                pageElement.type = 'PICTURE';
            }
        }
        if (pageElement.type === null) {
            pageElement.type = 'BODY';
        }
    }
    if (pageElement.hasOwnProperty('image')) {
        pageElement.type = 'PICTURE';
    }
    if (pageElement.hasOwnProperty('elementGroup')) {
        pageElement.type = 'GROUP';
        if (!Array.isArray(pageElement.elementGroup.children))
            return;
        for (let child of pageElement.elementGroup.children) {
            labelPageElement(child);
        }
    }
}

function getLayout(page, pageSize) {
    // in EMU
    let layout = {
        pageSize: pageSize,
        pageElements: [],
    };

    if (!page.hasOwnProperty('pageElements')) {
        page.pageElements = [];
    }

    for (let pageElement of page.pageElements) {
        layout.pageElements.push({
            startX: pageElement.rectangle.startX * PX,
            startY: pageElement.rectangle.startY * PX,
            finishX: pageElement.rectangle.finishX * PX,
            finishY: pageElement.rectangle.finishY * PX,
            type: getPageElementType(pageElement),
        });
    }
    return layout;
}

 function getCoveringRectangle(pageElements, pageSize) {
    let layout = getLayout({pageElements}, pageSize);

    // do transform
    
    let rectangle = {
        sx: Number.MAX_VALUE,
        sy: Number.MAX_VALUE,
        fx: -Number.MAX_VALUE,
        fy: -Number.MAX_VALUE,
    };
    for (let e of layout.pageElements) {
        rectangle.sx = Math.min(rectangle.sx, e.startX);
        rectangle.sy = Math.min(rectangle.sy, e.startY);
        rectangle.fx = Math.max(rectangle.fx, e.finishX);
        rectangle.fy = Math.max(rectangle.fy, e.finishY);
    }

    let transform = { ...DEFAULT_TRANSFORM };
    let size = JSON.parse(JSON.stringify(DEFAULT_SIZE));
    transform.translateX = rectangle.sx;
    transform.translateY = rectangle.sy;

    size.width.magnitude = rectangle.fx - rectangle.sx;
    size.height.magnitude = rectangle.fy - rectangle.sy;
    return {
        transform,
        size,
    };
}

function transformElementGroups(pageElements, pageSize, method = 'extract') {
    let newPageElements = [];
    for (let pageElement of pageElements) {
        if (!pageElement.hasOwnProperty('elementGroup')) {
            newPageElements.push(pageElement);
            continue;
        }
        if (!pageElement.elementGroup.hasOwnProperty('children')) {
            continue;
        }
        let children = transformElementGroups(pageElement.elementGroup.children, pageSize, method);
        if (children.length === 0) {
            continue;
        }
        if (method === 'extract') {
            for (let ch of children) {
                if (pageElement.hasOwnProperty('transform')) {
                    let transform = { ...ch.transform };
                    transform = multiplyTransforms(pageElement.transform, transform);
                    ch.transform = { ...transform };
                }
                ch = calculateAdditional(ch, ch);
                if (ch.hasOwnProperty('image')) {
                    newPageElements.push(ch);
                }
                else if (ch.hasOwnProperty('shape') 
                    && ch.shape.hasOwnProperty('shapeType') 
                    && ch.shape.shapeType === 'TEXT_BOX'
                ) {
                    newPageElements.push(ch);
                }
            }
        }
        else if (method === 'merge') {
            let result = getCoveringRectangle(children, pageSize);

            if (pageElement.hasOwnProperty('transform')) {
                result.transform = multiplyTransforms(pageElement.transform, result.transform);
            }

            if (result.size.height.magnitude === 0 || result.size.width.magnitude === 0) {
                continue;
            }
            if (result.size.height.magnitude < 0 || result.size.width.magnitude < 0) {
                console.log(result, pageElements, getLayout({pageElements: children}, pageSize));
            }


            let newPageElement = {
                size: result.size,
                transform: result.transform,
                shape: {
                    shapeType: 'RECTANGLE',
                    shapeProperties: {
                        outline: {
                            outlineFill: {
                                solidFill: {
                                    color: {
                                        rgbColor: {
                                            red: 0,
                                            green: 1,
                                            blue: 0,
                                        },
                                    },
                                    alpha: 1,
                                }
                            },
                            weight: {
                                magnitude: PT,
                                unit: 'EMU',
                            },
                            dashStyle: 'DOT',
                        }
                    },
                    placeholder: {
                        type: 'OBJECT',
                    }
                }
            }
            newPageElement = calculateAdditional(newPageElement, newPageElement);
            newPageElements.push(newPageElement);
        }
    }
    return newPageElements;
}

function deleteSmallElements(page, pageSize) {
    let layout = getLayout(page, pageSize);
    let n = layout.pageElements.length;
    if (n !== page.pageElements.length) {
        throw Error("issue with layout and page");
    }
    let newPageElements = [];
    for (let i = 0; i < n; i++) {
        let rectangle = layout.pageElements[i];
        let pageElement = page.pageElements[i];
        if (isSmall(rectangle, layout.pageSize)) {
            continue;
        }
        newPageElements.push(pageElement);
    }
    page.pageElements = newPageElements;
    return page;
}

function mergeIntersectingElements(page, pageSize) {
    return page;
}

function removeThemeColors(obj, colors) {
    if (Array.isArray(obj)) {
        for (let element of obj) {
            element = removeThemeColors(element, colors);
        }
    }
    else if (typeof obj === 'object') {
        for (let field in obj) {
            if (field === 'themeColor') {
                for (let color of colors) {
                    if (color.type === obj[field]) {
                        let rgbColor = {
                            red: 0,
                            green: 0,
                            blue: 0,
                        };
                        for (let rgb of RGB) {
                            if (color.color.hasOwnProperty(rgb)) {
                                rgbColor[rgb] = color.color[rgb];
                            }
                        }
                        delete obj[field];
                        obj['rgbColor'] = rgbColor;
                        break;
                    }
                }
            }
            else {
                obj[field] = removeThemeColors(obj[field], colors);
            }
        }
    }
    return obj
}


function getDominantTextStyle(textStyle, textElements, start, L, R) {
    if (L > R) {
        return textStyle;
    }
    let cntStyle = {};
    let dominantStyle = '{}';
    for (let i = start + 1; i < textElements.length; i++) {
        const textElement = textElements[i];
        let l = 0;
        let r = 0;
        if (textElement.hasOwnProperty('startIndex')) {
            l = textElement.startIndex;
        }
        if (textElement.hasOwnProperty('endIndex')) {
            r = textElement.endIndex;
        }

        if (l < L) {
            throw Error('Text Element crosses paragraph');
        }
        if (r > R) {
            break;
        }
        if (textElement.hasOwnProperty('textRun') && textElement.textRun.hasOwnProperty('style')) {
            let styleStr = JSON.stringify({ ...textStyle, ...textElement.textRun.style });
            if (!cntStyle.hasOwnProperty(styleStr)) {
                cntStyle[styleStr] = 0;
            }
            if (textElement.textRun.hasOwnProperty('content'))
                cntStyle[styleStr] += textElement.textRun.content.length;    
            dominantStyle = styleStr;
        }
        else if (textElement.hasOwnProperty('autoText') && textElement.autoText.hasOwnProperty('style')) {
            let styleStr = JSON.stringify({ ...textStyle, ...textElement.autoText.style });
            if (!cntStyle.hasOwnProperty(styleStr)) {
                cntStyle[styleStr] = 0;
            }
            cntStyle[styleStr] += 1;
            dominantStyle = styleStr;
        }
    }
    for (let style in cntStyle) {
        if (cntStyle[dominantStyle] < cntStyle[style]) {
            dominantStyle = style;
        }
        else if (cntStyle[dominantStyle] === cntStyle[style] && dominantStyle.length < style.length) {
            dominantStyle = style;
        }
    }
    return JSON.parse(dominantStyle);
}

function getBulletPreset(glyph) {
    // if (isNumeric(glyph[0])) {
    //     return "NUMBERED_DIGIT_ALPHA_ROMAN";
    // }
    return "BULLET_DISC_CIRCLE_SQUARE";
}

function getScopedStyles(paragraphStyle, textStyle, recommendedLength) {
    let result = {
        fontSize: 14 * (4/3),
        fontFamily: 'Arial',
        foregroundColor: {
            rgbColor: {
                red: 0,
                green: 0,
                blue: 0,
            },
        },
        recommendedLength: recommendedLength,
    }    
    if (textStyle.hasOwnProperty('fontSize')) {
        if (correctDimension(textStyle.fontSize)) {
            result.fontSize = consumeDimension(textStyle.fontSize) / PX;
        }
    }

    if (textStyle.hasOwnProperty('foregroundColor')
        && textStyle.foregroundColor.hasOwnProperty('opaqueColor')
        && textStyle.foregroundColor.opaqueColor.hasOwnProperty('rgbColor')
    ) {
        result.foregroundColor.rgbColor = consumeRGBColor(textStyle.foregroundColor.opaqueColor.rgbColor);
    }

    if (textStyle.hasOwnProperty('weightedFontFamily')) {
        if (textStyle.weightedFontFamily.hasOwnProperty('fontFamily')) {
            result.fontFamily = textStyle.weightedFontFamily.fontFamily;
        }
    }
    return result;
}

function areSimilarObjs(obj1, obj2, eps) {
    if (typeof obj1 !== typeof obj2) {
        return false;
    }
    if (typeof obj1 === 'number') {
        if (Math.abs(obj1 - obj2) > eps) {
            return false;
        }
    }
    else if (typeof obj1 === 'object') {
        for (let field in obj1) {
            if (!areSimilarObjs(obj1[field], obj2[field], eps)) {
                return false;
            }
        }
    }
    else {
        return obj1 === obj2;
    }
    return true;
}

class Template {
    constructor(originalId='',
        pageNum=-1,
        page={},
        pageSize={},
        weight=0,
        isTitlePage=false,
        isCustom=false
    ) {
        this.informationBoxId = random();
        this.pageId = random();
        this.page = page;
        this.pageSize = pageSize;
        this.pageNum = pageNum;
        this.weight = weight;
        this.originalId = originalId;
        this.isCustom = isCustom;
        this.isTitlePage = isTitlePage;
    }

    getPageSizeInPX() {
        let obj = {
            width: this.pageSize.width / PX,
            height: this.pageSize.height / PX,
        };
        return obj;
    }

    getComplexity() {
        //return page.pageElements.length / 10;
        return 0;
    }

    copyInstance(template) {
        Object.assign(this, template);
    }

    getFreshJSON() {
        let template = JSON.parse(JSON.stringify(this));
        template.pageId = random();
        template.informationBoxId = random();

        for (let pageElement of template.page.pageElements) {
            refreshIdsPageElement(pageElement);
        }

        let newInstance = new Template();
        newInstance.copyInstance(template);
        return newInstance;
    }

    sanitize() {
        this.page.pageElements = transformElementGroups(this.page.pageElements, this.pageSize);
        this.page.pageElements = sanitizePageElements(this.page.pageElements, this.pageSize);
        //this.page = deleteSmallElements(this.page, this.pageSize);
        this.page = mergeIntersectingElements(this.page, this.pageSize);
        this.page = removeThemeColors(this.page, this.page.pageProperties.colorScheme.colors);
    }

    label() {
        for (let pageElement of this.page.pageElements) {
            labelPageElement(pageElement);
        }
    }

    initialize() {
        this.sanitize();
        this.label();
        for (let pageElement of this.page.pageElements) {
            calculateRectangle(pageElement);
        }
        const area = (rectangle) => {
            let width = rectangle.finishX - rectangle.startX;
            let height = rectangle.finishY - rectangle.startY;
            let area = width * height;
            return area;
        }
        
        this.page.pageElements.sort((p1, p2) => {
            return area(p2.rectangle) - area(p1.rectangle);
        });
    }

    hasSimilarLayout(template) {
        const EPS = 0.5;
        let curLayout = this.getLayoutJSON();
        let layout = template.getLayoutJSON();
        if (curLayout.boxes.length !== layout.boxes.length) {
            return false;
        }

        for (let curBox of curLayout.boxes) {
            let foundSimilar = false;
            for (let box of layout.boxes) {
                if (areSimilarObjs(curBox, box, EPS)) {
                    foundSimilar = true;
                    break;
                }
            }
            if (!foundSimilar) {
                return false;
            }
        }
        return true;
    }

    hasSimilarStyles(template) {
        const EPS = 0.5;
        let curAllStyles = this.getStylesJSON();
        let allStyles = template.getStylesJSON();
        for (let curStyles of curAllStyles.styles) {
            let foundSimilar = false;
            for (let styles of allStyles.styles) {
                if (areSimilarObjs(curStyles, styles, EPS)) {
                    foundSimilar = true;
                    break;
                }
            }
            if (!foundSimilar) {
                return false;
            }
        }
        return true;
    }

    getLayoutJSON() {
        let result = {
            boxes: [],
            pageId: this.originalId,
            pageSize: this.getPageSizeInPX(),
        };
        for (let pageElement of this.page.pageElements) {
            result.boxes.push({
                width: (pageElement.rectangle.finishX - pageElement.rectangle.startX),
                height: (pageElement.rectangle.finishY - pageElement.rectangle.startY),
                left: pageElement.rectangle.startX,
                top: pageElement.rectangle.startY,
                type: pageElement.type,
            });
        }
        return result;
    }

    getStylesJSON() {
        let result = {
            pageId: this.originalId,
            styles: [],
        };
        let alreadyCovered = {};

        for (let pageElement of this.page.pageElements) {
            if (alreadyCovered[pageElement.type]) {
                continue;
            }
            if (IMAGE_PLACEHOLDER.includes(pageElement.type)
                || !pageElement.hasOwnProperty('shape')
                || !pageElement.shape.hasOwnProperty('text')
                || !Array.isArray(pageElement.shape.text.textElements)
            ) {
                result.styles.push({
                    type: pageElement.type,
                    ...(getScopedStyles({}, {}, -1)),
                });
                alreadyCovered[pageElement.type] = true;
                continue;
            }
            let textElements = pageElement.shape.text.textElements;
            for (let textElementIdx = 0; textElementIdx < textElements.length; textElementIdx++) {
                let textElement = textElements[textElementIdx];
                if (!textElement.hasOwnProperty('paragraphMarker')) {
                    continue;
                }
                let paragraphStyle = {};
                
                let listId = null;
                let nestingLevel = 0;
                let glyph = '';
                if (textElement.paragraphMarker.hasOwnProperty('bullet')) {
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
                    paragraphStyle = { ...textElement.paragraphMarker.style };
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
                        textStyle.bulletPreset = getBulletPreset(glyph);
                    }
                }
                textStyle = getDominantTextStyle(textStyle, textElements, textElementIdx, l, r);
                let paragraphLength = r - l;
                if (!this.isCustom) {
                    paragraphLength = -1;
                }
                result.styles.push({
                    type: pageElement.type,
                    ...(getScopedStyles(paragraphStyle, textStyle, paragraphLength)),    
                });
                alreadyCovered[pageElement.type] = true;
                break;
            }
        }
        return result;
    }
}

module.exports = {
    Template,
    getRectangle,
    consumeSize,
    consumeRGBColor,
    calculateAdditional,
    getDominantTextStyle,
    getBulletPreset,

    HEADER_PLACEHOLDER,
    BODY_PLACEHOLDER,
    IMAGE_PLACEHOLDER,
    SLIDE_NUMBER_PLACEHOLDER,
    MAX_WORD_LENGTH,
    PX,
    RGB,
    SUBHEADER_PLACEHOLDER,
};