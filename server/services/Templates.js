const { extractPage } = require('./apis/extractAPI');
const { initializeTemplate, initializeLayout } = require('./apis/initializeAPI');
const { Template, consumeSize, PX } = require('./Template');


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
class Templates {
    constructor(title, pageSize) {
        this.pageSize = consumeSize(pageSize);
        this.title = title;
        this.__templates = [];
        this.__customTemplateIds = [];

        this.__uniqueLayoutTemplateIds = [];
        this.__uniqueStylesTemplateIds = [];
    }  

    getPageSizeInPX() {
        let obj = {
            width: this.pageSize.width / PX,
            height: this.pageSize.height / PX,
        };
        return obj;
    }

    getTemplates() {
        return this.__templates.slice(0);
    }

    getCustomTemplates() {
        let customTemplates = [];
        let templates = this.getTemplates();
        for (let id of this.__customTemplateIds) {
            customTemplates.push(templates[id]);
        }
        return customTemplates;
    }

    getUniqueLayoutTemplates() {
        let retTemplates = [];
        for (let idx of this.__uniqueLayoutTemplateIds) {
            retTemplates.push(this.__templates[idx]);
        }
        return retTemplates;
    }

    getUniqueStylesTemplates() {
        let retTemplates = [];
        for (let idx of this.__uniqueStylesTemplateIds) {
            retTemplates.push(this.__templates[idx]);
        }
        return retTemplates;
    }

    copyInstance(templates) {
        Object.assign(this, templates);
        for (let template of this.__templates) {
            let newTemplate = new Template('', '', 0, {}, {}, 0, false, false);
            template = newTemplate.copyInstance(template);
        }
    }

    getByOriginalId(originalId) {
        for (let template of this.__templates) {
            if (template.originalId === originalId) {
                return template.getFreshJSON();
            }
        }
        throw Error('There is no such pageId in presentationId', originalId);
    }

    randomDraw() {
        if (this.__customTemplateIds.length > 0) {
            let preId = Math.floor(Math.random() * this.__customTemplateIds.length);
            let id = this.__customTemplateIds[preId];
            return this.__templates[id].getFreshJSON();   
        }
        else if (this.__templates.length > 0) {
            let id = Math.floor(Math.random() * this.__templates.length);
            return this.__templates[id].getFreshJSON();  
        }
        throw Error('There is no templates');
    }

    addCustom(originalId, pageNum, page, isTitlePage = false) {
        let template = new Template(originalId, pageNum, page, this.pageSize, 2, isTitlePage, true);
        template.initialize();

        if (template.getComplexity() <= 0.5) {
            if (this.__isUniqueLayout(template)) {
                this.__uniqueLayoutTemplateIds.push(this.__templates.length);
            }
            if (this.__isUniqueStyles(template)) {
                this.__uniqueStylesTemplateIds.push(this.__templates.length);
            }
            this.__customTemplateIds.push(this.__templates.length);
            this.__templates.push(template);
        }
    }

    addDefault(originalId, pageNum, page, isTitlePage = false) {
        return;
        let template = new Template(originalId, pageNum, page, this.pageSize, 1, isTitlePage, false);
        template.initialize();

        if (template.getComplexity() <= 0.5) {
            if (this.__isUniqueLayout(template)) {
                this.__uniqueLayoutTemplateIds.push(this.__templates.length);
            }
            if (this.__isUniqueStyles(template)) {
                this.__uniqueStylesTemplateIds.push(this.__templates.length);
            }
            this.__templates.push(template);
        }
    }

    __isUniqueLayout(template) {
        for (let idx of this.__uniqueLayoutTemplateIds) {
            let layoutTemplate = this.__templates[idx];
            if (template.hasSimilarLayout(layoutTemplate)) {
                return false;
            }
        }
        return true;
    }

    __isUniqueStyles(template) {
        for (let idx of this.__uniqueStylesTemplateIds) {
            let stylesTemplate = this.__templates[idx];
            if (template.hasSimilarStyles(stylesTemplate)) {
                return false;
            }
        }
        return true;
    }

    static extractTemplates(source) {
        //console.log(source);
        let dict = updateObjectId(source);
    
        let templates = new Templates(source.title, source.pageSize);
    
        //Extract Layouts from `source`
        for (let index = 0; index < source.layouts.length; index++) {
            let layout = source.layouts[index];
            let page = extractPage(dict, layout);
            templates.addDefault(layout.objectId, index + 1, page, (index === 0));
        }
    
        //Extract the Template From `source`
        let titlePage = extractPage(dict, source.slides[0]);
        
        templates.addCustom(source.slides[0].objectId, 1, titlePage, true);
        
        for (let index = 1; index < source.slides.length; index++) {
            let originalPage = source.slides[index];
            let extractedPage = extractPage(dict, originalPage);
            templates.addCustom(originalPage.objectId, index + 1, extractedPage, false);
        }
    
        //console.log(templates);
        return templates;
    }


    initializeTemplates() {
        let requests = [];
        let pageNum = 0;
        for (let template of this.__templates) {
            pageNum++;
            requests = requests.concat(initializeTemplate(template, null, pageNum));
        }
        return requests;
    }

    getLayouts() {
        let result = [];
        for (let template of this.getTemplates()) {
            result.push({
                ...(template.getLayoutJSON()),
                requests: initializeLayout(template),
            });
        }
        return result;
    }

    getStyles() {
        let result = [];
        for (let template of this.getTemplates()) {
            result.push(template.getStylesJSON(true));
        }
        return result;
    }

    getLayoutByOriginalId(originalId) {
        let template = this.getByOriginalId(originalId);
        return {
            ...(template.getLayoutJSON()),
            requests: initializeLayout(template),
        };
    }

    getStylesByOriginalId(originalId) {
        let template = this.getByOriginalId(originalId);
        return {
            ...(template.getStylesJSON(true)),
        };
    }
}

module.exports = {
    Templates,
};