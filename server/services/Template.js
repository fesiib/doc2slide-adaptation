const { v4 : uuidv4} = require('uuid');

const PLACEHOLDER_IMAGE_URL = 'https://i.stack.imgur.com/y9DpT.jpg';

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


function isNumeric(ch) {
    return ch.length === 1 && ch.match(/[0-9]/g);
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
            if (pageElement.hasOwnProperty('shape') && pageElement.shape.hasOwnProperty('shapeType')) {
                if (pageElement.shape.shapeType !== 'TEXT_BOX'
                    && pageElement.shape.shapeType !== 'RECTANGLE'
                ) {
                    continue;
                }
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
        if (pageElement.hasOwnProperty('transform')) {
            if (pageElement.transform.shearX !== 0
                || pageElement.transform.shearY !== 0
            ) {
                continue;
            }
        }
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
                additional.contentUrl.push(PLACEHOLDER_IMAGE_URL);
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

        if (typeof src.image.contentUrl === 'string') {
            additional.contentUrl = [src.image.contentUrl];
        }
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
        additional.contentUrl = [];
        additional.canbeMapped.push(MAX_WORD_LENGTH);
    }
    else {
        additional.isReplacable = false;
        additional.originaType = 'none';
    }
    pageElement['additional'] = additional;
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

function rectangleToSizeTransform(rectangle, unit) {

    unitMultiplier = EMU;

    if (unit === 'PT') {
        unitMultiplier = PT;
    }
    else if (unit === 'PX') {
        unitMultiplier = PX;
    }
    else if (unit !== 'EMU') {
        throw Error("don't support such unit");
    }

    let transform = { ...DEFAULT_TRANSFORM };
    let size = JSON.parse(JSON.stringify(DEFAULT_SIZE));
    transform.translateX = rectangle.startX * unitMultiplier;
    transform.translateY = rectangle.startY * unitMultiplier;

    size.width.magnitude = (rectangle.finishX - rectangle.startX) * unitMultiplier;
    size.height.magnitude = (rectangle.finishY - rectangle.startY) * unitMultiplier;
    return {
        transform,
        size,
    };
}

function getCoveringRectangle(pageElements, pageSize) {
    let layout = getLayout({pageElements}, pageSize);

    // do transform
    
    let rectangle = {
        startX: Number.MAX_VALUE,
        startY: Number.MAX_VALUE,
        finishX: -Number.MAX_VALUE,
        finishY: -Number.MAX_VALUE,
    };
    for (let e of layout.pageElements) {
        rectangle.startX = Math.min(rectangle.startX, e.startX);
        rectangle.startY = Math.min(rectangle.startY, e.startY);
        rectangle.finishX = Math.max(rectangle.finishX, e.finishX);
        rectangle.finishY = Math.max(rectangle.finishY, e.finishY);
    }
    return rectangleToSizeTransform(rectangle, 'EMU');
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
                newPageElements.push(ch);
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
            newPageElements.push(newPageElement);
        }
    }
    for (let pageElement of newPageElements) {
        if (!pageElement.hasOwnProperty('additional'))
            pageElement = calculateAdditional(pageElement, pageElement);
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
    if (isNumeric(glyph[0])) {
        return "NUMBERED_DIGIT_ALPHA_ROMAN";
    }
    return "BULLET_DISC_CIRCLE_SQUARE";
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
        },
        bold: styles.bold,
        italic: styles.italic,
        strikethrough: styles.strikethrough,
        underline: styles.underline,
    };
    let paragraphStyle = {
        direction: "LEFT_TO_RIGHT",
        alignment: "START",
        lineSpacing: styles.lineHeight,
        spaceAbove: {
            magnitude: styles.spaceAbove * PX / PT,
            unit: 'PT',
        },
        spaceBelow: {
            magnitude: styles.spaceBelow * PX / PT,
            unit: 'PT',
        },
    };

    if (styles.prefix === 'number') {
        paragraphStyle.bulletPreset = "NUMBERED_DIGIT_ALPHA_ROMAN";
    }
    if (styles.prefix === 'bullet') {
        paragraphStyle.bulletPreset = "BULLET_DISC_CIRCLE_SQUARE";
    }

    if (styles.textAlign === 'right') {
        paragraphStyle.alignment = "END";
    }

    if (styles.textAlign === 'center') {
        paragraphStyle.alignment = "CENTER";
    }

    if (styles.textAlign === 'justify') {
        paragraphStyle.alignment = "JUSTIFIED";
    }

    return {
        paragraphStyle,
        textStyle,
    };
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
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,

        textAlign: "left",
        prefix: "none",
        lineHeight: 115.0,
        spaceAbove: 0,
        spaceBelow: 0,
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

    if (textStyle.hasOwnProperty('bold')) {
        result.bold = textStyle.bold;
    }

    if (textStyle.hasOwnProperty('italic')) {
        result.italic = textStyle.italic;
    }

    if (textStyle.hasOwnProperty('strikethrough')) {
        result.strikethrough = textStyle.strikethrough;
    }

    if (textStyle.hasOwnProperty('underline')) {
        result.underline = textStyle.underline;
    }
    if (paragraphStyle.hasOwnProperty('bulletPreset')) {
        if (paragraphStyle.bulletPreset.startsWith("NUMBERED")) {
            result.prefix = 'number';
        }
        if (paragraphStyle.bulletPreset.startsWith("BULLET")) {
            result.prefix = 'bullet';
        }
    }

    if (paragraphStyle.hasOwnProperty('alignment')) {
        if (paragraphStyle.alignment === 'END') {
            result.textAlign = 'right';
        }
        if (paragraphStyle.alignment === 'CENTER') {
            result.textAlign = 'center';
        }
        if (paragraphStyle.alignment === 'JUSTIFIED') {
            result.textAlign = 'justify';
        }
    }
    
    if (paragraphStyle.hasOwnProperty('lineSpacing')) {
        result.lineHeight = paragraphStyle.lineSpacing;
    }

    if (paragraphStyle.hasOwnProperty('spaceAbove')) {
        if (correctDimension(paragraphStyle.spaceAbove)) {
            result.spaceAbove = consumeDimension(paragraphStyle.spaceAbove) / PX;
        }
    }

    if (paragraphStyle.hasOwnProperty('spaceBelow')) {
        if (correctDimension(paragraphStyle.spaceBelow)) {
            result.spaceBelow = consumeDimension(paragraphStyle.spaceBelow) / PX;
        }
    }
    return result;
}

function getParagraphTexts(pageElement) {
    if (!pageElement.hasOwnProperty('shape')
        || !pageElement.shape.hasOwnProperty('text')
        || !Array.isArray(pageElement.shape.text.textElements)
    ) {
        return [];
    }
    let textElements = pageElement.shape.text.textElements;
    
    let paragraphContents = [];
    let text = '';
    for (let i = 0; i < textElements.length; i++) {
        const textElement = textElements[i];
        if (textElement.hasOwnProperty('paragraphMarker')) {
            if (i > 0) {
                if (text.endsWith('\n')) {
                    text = text.slice(0, text.length - 1);
                }
                paragraphContents.push(text);
                text = '';
            }
        }
        if (textElement.hasOwnProperty('textRun') && textElement.textRun.hasOwnProperty('content')) {
            text += textElement.textRun.content;
        }
        if (textElement.hasOwnProperty('autoText') && textElement.autoText.hasOwnProperty('content')) {
            text += textElement.autoText.content;
        }
    }
    if (textElements.length > 0) {
        if (text.endsWith('\n')) {
            text = text.slice(0, text.length - 1);
        }
        paragraphContents.push(text);
    }
    return paragraphContents;
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

function makeResourcesParagraphs(urls, paragraphs, isOriginalContent = true) {
    let contents = [];
    for (let url of urls) {
        contents.push({
            paragraph: {
                id: random(),
                shortenings: [],
                phrases: [],
                singleWord: {
                    text: "",
                    score: {
                        grammatical: 1,
                        importantWords: 0,
                        semantic: 0,
                    },
                },
                images: [{
                    url: url,
                }],
                isOriginalContent: isOriginalContent,
            },
        });
    }
    for (let paragraphText of paragraphs) {
        contents.push({
            paragraph: {
                id: random(),
                shortenings: [{
                    text: paragraphText,
                    score: {
                        grammatical: 1,
                        importantWords: 1,
                        semantic: 0,
                    }
                }],
                phrases: [],
                singleWord: {
                    text: "",
                    score: {
                        grammatical: 1,
                        importantWords: 0,
                        semantic: 0,
                    },
                },
                images: [{
                    url: PLACEHOLDER_IMAGE_URL,
                }],
                isOriginalContent: isOriginalContent,
            },
        });
    }
    return contents;
}

function getParagraphTextStyles(pageElement) {
    let textElements = pageElement.shape.text.textElements;
    let paragraphs = [];
    for (let i = 0; i < textElements.length; i++) {
        const textElement = textElements[i];
        if (textElement.hasOwnProperty('paragraphMarker')) {
            let paragraphStyle = {};
            let textStyle = {};
            let paragraphLength = -1;

            let listId = null;
            let nestingLevel = 0;
            let glyph = '';
            if (textElement.paragraphMarker.hasOwnProperty('bullet')) {;
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

            paragraphLength = r - l;

            if (listId !== null) {
                textStyle = pageElement.shape.text.lists[listId].nestingLevel[nestingLevel].bulletStyle;
                if (typeof textStyle !== 'object') {
                    textStyle = {};
                }
                if (glyph != '') {
                    paragraphStyle.bulletPreset = getBulletPreset(glyph);
                }
            }
            textStyle = getDominantTextStyle(textStyle, textElements, i, l, r);

            paragraphs.push({
                paragraphStyle,
                textStyle,
                paragraphLength,
            });
        }
    }
    return paragraphs;
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

    static fromLayoutJSON(layout) {
        let whiteSolidFill = {
            alpha: 1,
            color: {
                rgbColor: {
                    red: 1,
                    green: 1,
                    blue: 1,
                },
            }
        };

        let pageSize = {
            width: layout.pageSize.width * PX,
            height: layout.pageSize.height * PX,
        };
        
        let page = {
            pageElements: [],
            pageProperties: {
                pageBackgroundFill: {
                    solidFill: { ...whiteSolidFill },
                },
            },
        };

        for (let box of layout.boxes) {
            let rectangle = {
                startX: box.left,
                startY: box.top,
                finishX: box.left + box.width,
                finishY: box.top + box.height,
                unit: "PX",
            };
            let {
                size,
                transform,
            } = rectangleToSizeTransform(rectangle, rectangle.unit);
            let pageElement = {
                objectId: random(),
                size: size,
                transform: transform,
            };

            if (box.hasOwnProperty('shape')) {
                pageElement.shape = { ...box.shape };
            }
            else if (box.hasOwnProperty('image')) {
                pageElement.image = { ...box.image };
            }
            page.pageElements.push(pageElement);
        }
        let newTemplate = new Template(random(), -1, page, pageSize, 1, false, true);
        newTemplate.initialize();
        return newTemplate;
    }

    static fromStylesJSON(styles, pageSizeInPX) {
        styles = styles.styles;
        let pageSize = {
            width: pageSizeInPX.width * PX,
            height: pageSizeInPX.height * PX,
        };
        let page = {
            pageElements: [],
            pageProperties: {
                pageBackgroundFill: {
                    solidFill: {
                        alpha: 1,
                        color: {
                            rgbColor: {
                                red: 1,
                                green: 1,
                                blue: 1,
                            },
                        }
                    }
                },
            },
        };
        
        for (let type in styles) {
            let {
                paragraphStyle,
                textStyle,
            } = stylesToTextStyle(styles[type]);

            let bullet = null;

            if (paragraphStyle.hasOwnProperty('bulletPreset')) {
                bullet = {
                    listId: 'customCreatedBulletList',
                    nestingLevel: 0,
                };
                if (paragraphStyle.bulletPreset.startsWith('BULLET')) {
                    bullet.glyph = '*';
                }
                else {
                    bullet.glyph = '1.';
                }
                delete paragraphStyle.bulletPreset;
            }

            let rectangle = {
                startX: 0,
                startY: 0,
                finishX: 50,
                finishY: 50,
                unit: "PX",
            };
            let {
                size,
                transform,
            } = rectangleToSizeTransform(rectangle, rectangle.unit);
            let pageElement = {
                additional: {
                    canbeMapped: [Infinity],
                    canbeMappedMin: 0,
                    contentUrl: [],
                    text: [],
                    isReplacable: true,
                    originalType: (IMAGE_PLACEHOLDER.includes(type) ? "image" : "shape"),
                },
                objectId: random(),
                rectangle: rectangle,
                size: size,
                shape: {
                    placeholder: {
                        type: type,
                    },
                    text: {
                        lists: {
                            'customCreatedBulletList': {
                                listId: 'customCreatedBulletList',
                                nestingLevel: {
                                    0: {
                                        bulletStyle: { ...textStyle },
                                    }
                                },
                            }
                        },
                        textElements: [
                            {
                                paragraphMarker: {
                                    style: { ...paragraphStyle },
                                },
                                endIndex: styles[type].recommendedLength,
                            },
                            {
                                textRun: {
                                    content: "$" * styles[type].recommendedLength,
                                    style: { ...textStyle },
                                },
                                endIndex: styles[type].recommendedLength,
                            },
                        ],
                    },
                    shapeType: "RECTANGLE",
                },
                transform: transform,
                type: type,
            };

            if (bullet !== null) {
                pageElement.shape.text.textElements[0].paragraphMarker.bullet = { ...bullet };
            }
            page.pageElements.push(pageElement);
        }
        let newTemplate = new Template(random(), -1, page, pageSize, 1, false, true);
        return newTemplate;;
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
        if (this.page.pageProperties.hasOwnProperty('colorScheme')
            && Array.isArray(this.page.pageProperties.colorScheme.colors)
        ) {
            this.page = removeThemeColors(this.page, this.page.pageProperties.colorScheme.colors);
        }
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
        let curAllStyles = this.getStylesJSON(true);
        let allStyles = template.getStylesJSON(true);
        for (let property in curAllStyles.styles) {
            if (!allStyles.styles.hasOwnProperty(property)) {
                return false;
            }
            if (!areSimilarObjs(curAllStyles.styles[property], allStyles.styles[property], EPS)) {
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
            let urls = [];
            let paragraphs = [];

            if (IMAGE_PLACEHOLDER.includes(pageElement.type)) {
                if (pageElement.hasOwnProperty('additional')
                    && Array.isArray(pageElement.additional.contentUrl)
                    && pageElement.additional.contentUrl.length > 0
                ) {
                    urls.push(pageElement.additional.contentUrl[0]);
                }
            }
            else if (pageElement.hasOwnProperty('shape')) {
                if (pageElement.shape.hasOwnProperty('text')
                    && Array.isArray(pageElement.shape.text.textElements)
                ) {
                    paragraphs = getParagraphTexts(pageElement);
                }
            }

            let box = {
                width: (pageElement.rectangle.finishX - pageElement.rectangle.startX),
                height: (pageElement.rectangle.finishY - pageElement.rectangle.startY),
                left: pageElement.rectangle.startX,
                top: pageElement.rectangle.startY,
                type: pageElement.type,
                objectId: pageElement.objectId,
                originalContents: makeResourcesParagraphs(urls, paragraphs),
            };

            if (pageElement.hasOwnProperty('shape')) {
                box.shape = { ...pageElement.shape };
            }
            else if (pageElement.hasOwnProperty('image')) {
                box.image = { ...pageElement.image };
            }
            result.boxes.push(box);
        }
        return result;
    }

    getStylesJSON(isDict = false) {
        let result = {
            pageId: this.originalId,
            styles: [],
        };
        let alreadyCovered = {};

        for (let pageElement of this.page.pageElements) {
            if (alreadyCovered[pageElement.type]) {
                continue;
            }
            if (IMAGE_PLACEHOLDER.includes(pageElement.type)) {
                let urls = [];

                if (pageElement.hasOwnProperty('additional')
                    && Array.isArray(pageElement.additional.contentUrl)
                    && pageElement.additional.contentUrl.length > 0
                ) {
                    urls.push(pageElement.additional.contentUrl[0]);
                }

                result.styles.push({
                    type: pageElement.type,
                    objectId: pageElement.objectId,
                    originalContents: makeResourcesParagraphs(urls, []),
                    ...(getScopedStyles({}, {}, -1)),
                });
                alreadyCovered[pageElement.type] = true;
                continue;
            }
            if (!pageElement.hasOwnProperty('shape')
                || !pageElement.shape.hasOwnProperty('text')
                || !Array.isArray(pageElement.shape.text.textElements)
            ) {
                result.styles.push({
                    type: pageElement.type,
                    objectId: pageElement.objectId,
                    originalContents: [],
                    ...(getScopedStyles({}, {}, -1)),
                });
                alreadyCovered[pageElement.type] = true;
                continue;
            }
            let paragraphs = getParagraphTextStyles(pageElement);

            for (let { paragraphStyle, textStyle, paragraphLength } of paragraphs) {
                if (!this.isCustom) {
                    paragraphLength = -1;
                }
                result.styles.push({
                    type: pageElement.type,
                    objectId: pageElement.objectId,
                    originalContents: makeResourcesParagraphs([], getParagraphTexts(pageElement)),
                    ...(getScopedStyles(paragraphStyle, textStyle, paragraphLength)),    
                });
                alreadyCovered[pageElement.type] = true;
                break;
            }
        }

        if (isDict) {
            let stylesDict = {};
            for (let styles of result.styles) {
                if (IMAGE_PLACEHOLDER.includes(styles.type)) {
                    continue;
                }
                stylesDict[styles.type] = {
                    ...styles
                }
                // delete stylesDict[styles.type].type;
                // delete stylesDict[styles.type].recommendedLength;
                // delete stylesDict[styles.type].objectId;
                // delete stylesDict[styles.type].originalContents;
                // if (stylesDict[styles.type].spaceAbove === 0) {
                //     delete stylesDict[styles.type].spaceAbove;
                // }
                // if (stylesDict[styles.type].spaceBelow === 0) {
                //     delete stylesDict[styles.type].spaceBelow;
                // }
                // if (!stylesDict[styles.type].bold) {
                //     delete stylesDict[styles.type].bold;
                // }
                // if (!stylesDict[styles.type].italic) {
                //     delete stylesDict[styles.type].italic;
                // }
                // if (!stylesDict[styles.type].strikethrough) {
                //     delete stylesDict[styles.type].strikethrough;
                // }
                // if (!stylesDict[styles.type].underline) {
                //     delete stylesDict[styles.type].underline;
                // }
            }
            result = {
                ...result,
                styles: stylesDict,
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
    rectangleToSizeTransform,
    getParagraphTexts,
    getParagraphTextStyles,

    stylesToTextStyle,

    HEADER_PLACEHOLDER,
    BODY_PLACEHOLDER,
    IMAGE_PLACEHOLDER,
    SLIDE_NUMBER_PLACEHOLDER,
    MAX_WORD_LENGTH,
    PX,
    PT,
    RGB,
    SUBHEADER_PLACEHOLDER,
    PLACEHOLDER_IMAGE_URL,
};