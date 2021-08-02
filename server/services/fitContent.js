const { scoreShapeElements, getDominantTextStyle } = require('./EvaluateAPI');
const { getFirstParagraphMarker, initializeShapeText, initializeTemplate, initializePageElementShape } = require('./initializeSlide');
const { Templates } = require('./Templates');

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
            if (pageElement.hasOwnProperty('shape')
                && pageElement.shape.hasOwnProperty('text')
                && Array.isArray(pageElement.shape.text.textElements)
                && pageElement.shape.text.textElements.length > 0
            ) {
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

function fitToParagraphMarker(entity, paragraphLength) {
    let shortenings = entity.shortenings;
    let phrases = entity.phrases;

    for (let shortening of shortenings) {
        if (shortening.text.length <= paragraphLength) {
            return {
                ...shortening,
            }
        }
    }

    for (let phrase of phrases) {
        if (phrase.text.length <= paragraphLength) {
            return {
                ...phrase,
            }
        }
    }

    if (entity.singleWord.text.length <= paragraphLength) {
        return {
            ...entity.singleWord,
        };   
    }
    return {
        ...entity.singleWord,
    };
}

function fitToShape(contents, pageElement, isCustom) {
    let textElements = pageElement.shape.text.textElements;
    let textElementId = 0;

    let lastParagraphMarker = null;
    let lastTextStyle = null;
    let lastEndIndex = 0;
    let lastParagraphLength = Infinity;

    let matching = {
    };

    while (textElementId < textElements.length) {
        if (textElements[textElementId].hasOwnProperty('paragraphMarker')) {
            paragraphMarker = textElements[textElementId].paragraphMarker;
            lastParagraphMarker = { ...paragraphMarker };
            let l = textElements[textElementId].startIndex;
            let r = textElements[textElementId].endIndex;

            if (l === undefined)
                l = 0;
            if (r === undefined) {
                r = l;
            }
            lastTextStyle = getDominantTextStyle({}, textElements, textElementId, l, r);
            lastEndIndex = r;

            if (!paragraphMarker.hasOwnProperty('bullet')) {
                lastParagraphLength = textElements[textElementId].endIndex;
                break;
            }
            delete lastParagraphMarker.bullet;
        }
        textElementId++;
    }
    
    if (lastParagraphMarker === null) {
        throw Error("PageElement without any paragraph: " + pageElement.objectId);
    }

    for (let content of contents) {
        while (textElementId < textElements.length
            && !textElements[textElementId].hasOwnProperty('paragraphMarker')    
        ) {
            textElementId++;
        }
        if (content.hasOwnProperty('paragraph')) {
            if (textElementId >= textElements.length
                || textElements[textElementId].paragraphMarker.hasOwnProperty('bullet')
            ) {
                textElements.splice(textElementId, 0, 
                    {
                        startIndex:  lastEndIndex,
                        endIndex: lastEndIndex,
                        paragraphMarker: lastParagraphMarker 
                    },
                    {
                        startIndex: lastEndIndex,
                        endIndex: lastEndIndex,
                        textRun: {
                            content: '',
                            style: lastTextStyle,
                        }
                    }
                );
            }
            lastParagraphMarker = textElements[textElementId].paragraphMarker;
            let l = textElements[textElementId].startIndex;
            let r = textElements[textElementId].endIndex;
            if (l === undefined) {
                l = 0;
            }
            if (r === undefined) {
                r = l;
            }
            if (r - l > 0) {
                lastParagraphLength = r - l;
            }
            if (isCustom) {
                lastParagraphLength = Infinity;
            }

            lastTextStyle = getDominantTextStyle({}, textElements, textElementId, l, r);
            lastEndIndex = r;
            let result = fitToParagraphMarker(content.paragraph, lastParagraphLength);

            matching[content.id] = {
                ...result,
                rectangle: pageElement.rectangle,
                objectId: pageElement.objectId,
                textElementId,
            };
            textElementId++;
        }
        else if (content.hasOwnProperty('bullet')) {
            // TODO: implement Bullets
            continue;
        }
    }
    return matching;
}

function fitSingleText(content, shapeText, isCustom) {
    let shortenings = content.shortenings;
    let phrases = content.phrases;
    let firstParagraphMarker = getFirstParagraphMarker(shapeText);
    if (firstParagraphMarker === null) {
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

async function fitToAllSlides_simple(content, templates) {
    //console.log(content, templates);
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
                        globalRequests = globalRequests.concat(initializeShapeText(pageElement, content.body[contentId].paragraph));
                        pageElement.mapped = true;
                        let mappedContent = {
                            text: content.body[contentId].paragraph,
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

async function fitToAllSlides_TextShortening(content, obj, cluster) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);
    let globalRequests = [];

    let scorePromises = [];

    for (let template of templates.getTemplates()) {
        let slide = template.page;
        if (!Array.isArray(slide.pageElements)) {
            continue;
        }

        let shapeElements = extractShapeElements(slide);

        // for (let pageElement of shapeElements) {
        //     if (!pageElement.shape.hasOwnProperty('placeholder')
        //         || !pageElement.shape.placeholder.hasOwnProperty('type')
        //     ) {
        //         console.log('inappropriate shape for header: ', pageElement);
        //     }
        // }

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
                        let curRequests = initializeShapeText(pageElement, result.text);
                        if (curRequests.length === 0) {
                            continue;
                        }
                        headerPageElement = pageElement;
                        headerIdx = curIdx;
                    }
                }
            }
            if (headerPageElement !== null) {
                let result = fitSingleText(content.header, headerPageElement.shape.text, template.isCustom);
                let curRequests = initializeShapeText(headerPageElement, result.text);
                if (curRequests.length > 0) {
                    globalRequests = globalRequests.concat(curRequests);
                    headerPageElement.mapped = true;
                    let mappedContent = {
                        text: result.text,
                        score: result.score,
                    };
                    headerPageElement.mappedContents.push(mappedContent);
                }
                else {
                    throw Error('Cannot get appropriate requests for HEADER');
                }
            }
        }
        
        // Fit the content
        if (Array.isArray(content.body)) {
            for (let i = 0; i < content.body.length; i++) {
                let bodyContent = content.body[i].paragraph;
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
                    ) {
                        let result = fitSingleText(bodyContent, pageElement.shape.text, template.isCustom);
                        if (!result.success) {
                            continue;
                        }
                        let curRequests = initializeShapeText(pageElement, result.text);
                        if (curRequests.length > 0) {
                            globalRequests = globalRequests.concat(curRequests);
                        }
                        else {
                            continue;
                        }
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
        scorePromises.push(scoreShapeElements(shapeElements, template, cluster));
    }

    let scores = await Promise.all(scorePromises);

    for (let result of scores) {
        let template = result.template;
        let score = { ...result.score };
        globalRequests.push({
            deleteText: {
                objectId: template.informationBoxId,
                textRange: {
                    type: 'ALL',
                }
            }
        });

        let informationText = '';
        let pageNumStr = template.pageNum.toString();
        if (template.isCustom) {
            informationText = 'Page ' + pageNumStr + ' ';
        }
        else {
            informationText = 'Layout ' + pageNumStr + ' ';   
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

async function tryFitBody(content, start, template, clusterBrowser) {
    let done = -1;
    let score = null;
    let matching = {};
    let requests = [];

    let slide = template.page;
    if (!Array.isArray(slide.pageElements)) {
        return {
            score: {
                similarity: 0,
            },
            template,
            start,
            matching,
            requests,
        };
    }

    let shapeElements = extractShapeElements(slide);

    // Fit the header
    if (content.hasOwnProperty('header')) {
        let headerPageElement = null;
        let headerIdx = HEADER_PLACEHOLDER.length;
        let id = 'header';
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
                    headerPageElement = pageElement;
                    headerIdx = curIdx;
                }
            }
        }
        if (headerPageElement !== null) {
            let result = fitToShape([{paragraph: content.header, id: id}], headerPageElement, template.isCustom);

            matching = {
                ...result,
                ...matching,
            };
            headerPageElement.mapped = true;
            let mappedContent = {
                text: result[id].text,
                score: result[id].score,
            };
            headerPageElement.mappedContents.push(mappedContent);
        }
    }
    // Fit the content
    if (Array.isArray(content.body)) {
        for (let i = start; i < content.body.length; i++) {
            let bodyContent = content.body[i].paragraph;
            //console.log(bodyContent);
            let bodyMapped = false;
            let id = i.toString();
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
                ) {
                    let result = fitToShape([{paragraph: bodyContent, id: id}], pageElement, template.isCustom);
                    matching = {
                        ...result,
                        ...matching,
                    }
                    pageElement.mapped = true;
                    let mappedContent = {
                        text: result[id].text,
                        score: result[id].score,
                    };
                    pageElement.mappedContents.push(mappedContent);
                    bodyMapped = true;
                    break;
                }
            }
            if (!bodyMapped) {
                done = i;
                break;
            }
        }
        if (done === -1) {
            done = content.body.length;
        }
    }
    score = await scoreShapeElements(shapeElements, clusterBrowser);

    for (let pageElement of shapeElements) {
        requests = requests.concat(initializePageElementShape(pageElement));
    }

    return {
        score,
        template,
        done,
        matching,
        requests,
    };
}

async function fitToPresentation_random(contents, obj, clusterBrowser) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);
    
    let globalRequests = [];
    let scores = [];
    let matching = {};

    for (let section of contents.sections) {
        let done = 0;
        while (done < section.body.length) {
            let iterations = 0;
            let result = null;
            while (iterations < 10) {     
                let template = templates.randomDraw();
                let current = await tryFitBody(section, done, template, clusterBrowser);
                if (current.done === done) {
                    continue;
                }
                if (result === null || result.score.similarity < current.score.similarity) {
                    result = current;
                }
                if (result.score.similarity >= 90.0) {
                    break;
                }
                iterations++;
            }
            scores.push({
                score: result.score,
                template: result.template,
            });
            //console.log('Fitted', done, result.done, result);
            globalRequests = globalRequests.concat(initializeTemplate(result.template));
            globalRequests = globalRequests.concat(result.requests);
            done = result.done;
            matching[result.template.pageId] = result.matching;
        }
    }

    for (let result of scores) {
        let template = result.template;
        let score = { ...result.score };
        globalRequests.push({
            deleteText: {
                objectId: template.informationBoxId,
                textRange: {
                    type: 'ALL',
                }
            }
        });

        let informationText = '';
        let pageNumStr = template.pageNum.toString();
        if (template.isCustom) {
            informationText = 'Page ' + pageNumStr + ' ';
        }
        else {
            informationText = 'Layout ' + pageNumStr + ' ';   
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
    return {
        requests: globalRequests,
        matching: matching,
    };
}

async function fitToSlide_random(content, obj, pageId, insertionIndex, clusterBrowser) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);

    let template = templates.getByOriginalId(pageId);
    let globalRequests = [];
    let matching = {};

    let result = await tryFitBody(content, 0, template, clusterBrowser);
    console.log('Fitted', 0, result.done, result);
    globalRequests = globalRequests.concat(initializeTemplate(result.template, insertionIndex));
    globalRequests = globalRequests.concat(result.requests);
    matching[result.template.pageId] = result.matching;
    
    globalRequests.push({
        deleteText: {
            objectId: result.template.informationBoxId,
            textRange: {
                type: 'ALL',
            }
        }
    });

    let informationText = '';
    let pageNumStr = result.template.pageNum.toString();
        if (result.template.isCustom) {
            informationText = 'Page ' + pageNumStr + ' ';
        }
        else {
            informationText = 'Layout ' + pageNumStr + ' ';   
        }


    for (let field in result.score) {
        let curScore = result.score[field];
        curScore = Math.round(curScore * 100) / 100;
        informationText += field + ": " + curScore.toString() + ', ';
    }
    
    globalRequests.push({
        insertText: {
            objectId: result.template.informationBoxId,
            text: informationText,
        }
    });
    return {
        requests: globalRequests,
        matching: matching,
        matched: result.done,
    };
}

module.exports = {
    fitToAllSlides_simple,
    fitToAllSlides_TextShortening,
    fitToPresentation_random,
    fitToSlide_random
};