function getPageComplexity(page, weight) {
    if (weight === 1) {
        return 0;
    }
    
    let result = 1;
    return result;
}

function solve(prevLayouts, layout, weight) {
    if (weight === 1) {
        // Default Layout
        return layout; 
    }
}

function consumeDimension(dimension) {
    if (!dimension.hasOwnProperty('magnitude')) {
        throw Error('no magnitude');
        return 0;
    }
    let result = dimension.magnitude;
    if (dimension.unit === 'PT') {
        result *= 12700;
    }
    else if (dimension.unit === 'EMU') {
        result *= 1;
    }
    else {
        throw Error('unit is not supported: ' + dimension.unit);
    }
    return result;
}

class Templates {
    constructor(pageSize) {
        this.pageSize = {
            width: consumeDimension(pageSize.width),
            height: consumeDimension(pageSize.height),
        };
        this.__templates = [];
        this.__layouts = [];
    }


    __getLayout(page) {
        // in PT
        return {};
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
        let layout = this.__getLayout(page);
        this.__add(layout, pageId, originalId, page, 2);
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