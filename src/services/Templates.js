
const INCH = 914400;

const PT = 12700;

const EMU = 1;

const DEFAULT_SIZE = {
    width: {
        magnitude: 5 * INCH,
        unit: 'EMU',
    },
    height: {
        magnitude: 0.5 * INCH,
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

function solve(prevLayouts, layout, weight) {
    if (weight === 1) {
        // Default Layout
        return layout; 
    }
}

function consumeDimension(dimension) {
    if (dimension === undefined) {
        throw Error('no dimension');
    }
    if (!dimension.hasOwnProperty('magnitude')) {
        throw Error('no magnitude');
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
        size = DEFAULT_SIZE;
    }

    if (!size.hasOwnProperty('width')) {
        size.width = DEFAULT_SIZE.width;
    }
    if (!size.hasOwnProperty('height')) {
        size.height = DEFAULT_SIZE.height;
    }

    return {
        width: consumeDimension(size.width),
        height: consumeDimension(size.height),
    }
}

function consumeTransform(transform) {
    if (transform === undefined) {
        transform = DEFAULT_TRANSFORM;
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

function getPageElementType(element) {
    if (element.hasOwnProperty('shape')) {
        return 'shape';
    }
    if (element.hasOwnProperty('image')) {
        return 'image';
    }
    if (element.hasOwnProperty('line')) {
        return 'line';
    }
    console.log(element);
    return 'unspecified';
}

class Templates {
    constructor(pageSize) {
        this.pageSize = consumeSize(pageSize);
        this.__templates = [];
        this.__layouts = [];
    }


    __getLayout(page) {
        // in EMU
        let layout = {
            pageSize: this.pageSize,
            pageElements: [],
        };

        if (!page.hasOwnProperty('pageElements')) {
            page.pageElements = [];
        }

        for (let pageElement of page.pageElements) {
            let size = consumeSize(pageElement.size);
            let transform = consumeTransform(pageElement.transform);


            let startX = transform.translateX;
            let startY = transform.translateY;

            let finishX = size.width * transform.scaleX + size.height * transform.shearX + transform.translateX;
            let finishY = size.width * transform.shearY + size.height * transform.scaleY + transform.translateY;

            layout.pageElements.push({
                startX,
                startY,
                finishX,
                finishY,
                type: getPageElementType(pageElement),
            });
        }
        return layout;
    }

    __getComplexity(page) {
        return 0;
    }

    __add(layout, pageId, originalId, page, weight) {
        this.__templates.push({
            pageId,
            page,
            weight,
            originalId,
        });
        this.__layouts.push({
            layout,
        });
    }

    addCustom(pageId, originalId, page) {
        if (this.__getComplexity(page) <= 0.5) {
            let layout = this.__getLayout(page);
            this.__add(layout, pageId, originalId, page, 2);
        }
    }

    addDefault(pageId, originalId, page) {
        let layout = this.__getLayout(page);
        this.__add(layout, pageId, originalId, page, 1);
    }

    getTemplates() {
        return this.__templates;
    }
}

export default Templates;