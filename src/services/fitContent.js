import { scoreShapeElements } from './EvaluateAPI';
import { getFirstParagraphMarker, initializeShapeText } from './initializeSlide';
import Templates from './Templates';

const HEADER_PLACEHOLDER = [
    'CENTERED_TITLE',
    'TITLE',
    'HEADER',
    'SUBTITLE',
];

const BODY_PLACEHOLDER = [
    'BODY',
    'FOOTER',
    'OBJECT',
];

const NOT_BODY_PLACEHOLDER = [
    'NONE', // 	Default value, signifies it is not a placeholder.
    //'BODY', // 	Body text.
    //'CHART', // 	Chart or graph.
    //'CLIP_ART', // 	Clip art image.
    //'CENTERED_TITLE', // 	Title centered.
    //'DIAGRAM', // 	Diagram.
    //'DATE_AND_TIME', // 	Date and time.
    //'FOOTER', // 	Footer text.
    //'HEADER', // 	Header text.
    //'MEDIA', // 	Multimedia.
    //'OBJECT', // 	Any content type.
    //'PICTURE', // 	Picture.
    'SLIDE_NUMBER', // 	Number of a slide.
    //'SUBTITLE', // 	Subtitle.
    //'TABLE', // 	Table.
    //'TITLE', // 	Slide title.
    //'SLIDE_IMAGE', // 	Slide image. 
];

function extractShapeElements(slide) {
    let shapeElements = [];
    for (let pageElement of slide.pageElements) {
        if (pageElement.hasOwnProperty('additional')) {
            if (pageElement.hasOwnProperty('shape')) {
                let copyPageElement = { ...pageElement };
                copyPageElement.mapped = false;
                copyPageElement.mappedContents = [];
                shapeElements.push(copyPageElement);
            }
        }
    }
    return shapeElements;
}

function extractImageElements(slide) {
    let imageElements = [];
    for (let pageElement of slide.pageElements) {
        if (pageElement.hasOwnProperty('additional')) {
            if (pageElement.hasOwnProperty('image')) {
                let copyPageElement = { ...pageElement };
                copyPageElement.mapped = false;
                copyPageElement.mappedContents = [];
                imageElements.push(copyPageElement);
            }
        }
    }
    return imageElements;
} 

function fitSingleText(content, shapeText, isCustom) {
    let shortenings = content.shortenings;
    let phrases = content.phrases;
    if (!Array.isArray(shapeText.textElements)
        || shapeText.textElements.length === 0
    ) {
        console.log(shapeText);
        return {
            success: false,
        }
    }
    let firstParagraphMarker = getFirstParagraphMarker(shapeText);
    if (firstParagraphMarker === null) {
        console.log(shapeText);
        return {
            success: false,
        }
    }

    for (let shortening of shortenings) {
        if (shortening.text.length <= firstParagraphMarker.endIndex || !isCustom) {
            return {
                success: true,
                ...shortening,
            }
        }
    }

    for (let phrase of phrases) {
        if (phrase.text.length <= firstParagraphMarker.endIndex || !isCustom) {
            return {
                success: true,
                ...phrase,
            }
        }
    }

    if (content.singleWord.text.length <= firstParagraphMarker.endIndex || !isCustom) {
        return {
            success: true,
            ...content.singleWord,
        };   
    }
    return {
        success: true,
        ...content.singleWord,
    };
}




export function fitToAllSlides_simple(content, templates) {
    console.log(content, templates);
    if (!(templates instanceof Templates)) {
        throw Error(templates + 'not instance of Templates');
    }

    let globalRequests = [];
    for (let template of templates.getTemplates()) {
        let slide = template.page;
        if (!Array.isArray(slide.pageElements)) {
            continue;
        }

        let shapeElements = extractShapeElements(slide);

        // Fit the header
        if (content.hasOwnProperty('header') && content.header.length > 0) {
            for (let pageElement of shapeElements) {
                if (pageElement.shape.hasOwnProperty('placeholder')
                    && pageElement.shape.placeholder.hasOwnProperty('type')
                ) {
                    let type = pageElement.shape.placeholder.type;
                    if (HEADER_PLACEHOLDER.includes(type)) {
                        globalRequests = globalRequests.concat(initializeShapeText(pageElement, content.header));
                        pageElement.mapped = true;
                        let mappedContent = {
                            text: content.header,
                            score: {
                                grammatical: 1,
                                semantic: 1,
                                importantWords: 1,
                            },
                        };
                        pageElement.mappedContents.push(mappedContent);
                        break;
                    }
                }
            }
        }
        
        // Fit the content
        if (content.hasOwnProperty('body') && Array.isArray(content.body)) {
            let contentId = 0;
            for (let pageElement of shapeElements) {
                if (pageElement.mapped) {
                    continue;
                }
                if (contentId >= content.body.length) {
                    break;
                }
                if (pageElement.shape.hasOwnProperty('placeholder')
                    && pageElement.shape.placeholder.hasOwnProperty('type')
                ) {
                    let type = pageElement.shape.placeholder.type;
                    if (BODY_PLACEHOLDER.includes(type)) {
                        globalRequests = globalRequests.concat(initializeShapeText(pageElement, content.body[contentId]));
                        pageElement.mapped = true;
                        let mappedContent = {
                            text: content.body[contentId],
                            score: {
                                grammatical: 1,
                                semantic: 1,
                                importantWords: 1,
                            },
                        };
                        pageElement.mappedContents.push(mappedContent);
                        contentId++;
                    }
                    else {
                        console.log("Cannot fit to shape: ", pageElement);
                    }
                }
            }
        }
    }
    return globalRequests;
}

export function fitToAllSlides_TextShortening(content, obj) {
    let templates = new Templates({ width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);
    console.log(content, templates);
    let globalRequests = [];
    for (let template of templates.getTemplates()) {
        let slide = template.page;
        if (!Array.isArray(slide.pageElements)) {
            continue;
        }

        let shapeElements = extractShapeElements(slide);

        for (let pageElement of shapeElements) {
            if (!pageElement.shape.hasOwnProperty('placeholder')
                || !pageElement.shape.placeholder.hasOwnProperty('type')
            ) {
                console.log('inappropriate shape for header: ', pageElement);
            }
        }

        // Fit the header
        if (content.hasOwnProperty('header')) {
            let headerPageElement = null;
            let headerIdx = HEADER_PLACEHOLDER.length;
            for (let pageElement of shapeElements) {
                if (pageElement.shape.hasOwnProperty('placeholder')
                    && pageElement.shape.placeholder.hasOwnProperty('type')
                ) {
                    let type = pageElement.shape.placeholder.type;
                    if (HEADER_PLACEHOLDER.includes(type)) {
                        let curIdx = HEADER_PLACEHOLDER.findIndex((el) => el === type);
                        if (headerIdx <= curIdx) {
                            continue;
                        }
                        let result = fitSingleText(content.header, pageElement.shape.text, template.isCustom);
                        if (!result.success) {
                            continue;
                        }
                        headerPageElement = pageElement;
                        headerIdx = curIdx;
                    }
                }
            }
            if (headerPageElement !== null) {
                let result = fitSingleText(content.header, headerPageElement.shape.text, template.isCustom);
                globalRequests = globalRequests.concat(initializeShapeText(headerPageElement, result.text));
                headerPageElement.mapped = true;
                let mappedContent = {
                    text: result.text,
                    score: result.score,
                };
                headerPageElement.mappedContents.push(mappedContent);
                
            }
        }
        
        // Fit the content
        if (Array.isArray(content.body)) {
            for (let bodyContent of content.body) {
                for (let pageElement of shapeElements) {
                    if (pageElement.mapped) {
                        continue;
                    }
                    if (pageElement.shape.hasOwnProperty('placeholder')
                        && pageElement.shape.placeholder.hasOwnProperty('type')
                    ) {
                        let type = pageElement.shape.placeholder.type;
                        if (NOT_BODY_PLACEHOLDER.includes(type) || HEADER_PLACEHOLDER.includes(type)) {
                            continue;
                        }
                    }
                    if (pageElement.shape.hasOwnProperty('shapeType')
                        && pageElement.shape.shapeType === 'TEXT_BOX'
                        && pageElement.additional.text.length > 0
                    ) {
                        let result = fitSingleText(bodyContent, pageElement.shape.text, template.isCustom);
                        if (!result.success) {
                            continue;
                        }
                        globalRequests = globalRequests.concat(initializeShapeText(pageElement, result.text));
                        pageElement.mapped = true;
                        let mappedContent = {
                            text: result.text,
                            score: result.score,
                        };
                        pageElement.mappedContents.push(mappedContent);
                        break;
                    }
                }
            }
        }
        let score = scoreShapeElements(shapeElements, templates.pageSize);

        globalRequests.push({
            deleteText: {
                objectId: template.informationBoxId,
                textRange: {
                    type: 'ALL',
                }
            }
        });

        let informationText = '';
        if (template.isCustom) {
            informationText = 'Page ' + template.originalId + ' ';
        }
        else {
            informationText = 'Layout ' + template.originalId + ' ';   
        }

        for (let field in score) {
            let curScore = score[field];
            curScore = Math.round(curScore * 100) / 100;
            informationText += field + ": " + curScore.toString() + ', ';
        }
        
        globalRequests.push({
            insertText: {
                objectId: template.informationBoxId,
                text: informationText,
            }
        });
    }
    return globalRequests;
}