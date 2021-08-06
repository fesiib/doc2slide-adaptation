const { scoreShapeElements, getDominantTextStyle } = require('./EvaluateAPI');
const { initializeTemplate, initializePageElementShape } = require('./initializeSlide');
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
                if (pageElement.shape.hasOwnProperty('placeholder')
                    && pageElement.shape.placeholder.hasOwnProperty('type')
                ) {
                    if (pageElement.shape.placeholder.type === 'SLIDE_NUMBER') {
                        continue;
                    }
                }
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
            if (!isCustom) {
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
            if (result[id].text.length > 0) {
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
                    if (result[id].text.length === 0) {
                        continue;
                    }
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

function getSingleTemplateResponse(result, pageNum) {
    let globalRequests = [];
    let matching = {};
    globalRequests = globalRequests.concat(initializeTemplate(result.template, pageNum));
    globalRequests = globalRequests.concat(result.requests);
    matching[result.template.pageId] = {
        ...result.matching,
        score: result.score.similarity,
        originalId: result.template.originalId,
        pageNum: pageNum,
    };
    
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

async function fitToPresentation_random(contents, obj, clusterBrowser) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);
    
    let requests = [];
    let matching = {};
    let matchedList = [];

    let results = [];
    let pageNum = 0;

    for (let section of contents.sections) {
        let done = 0;
        while (done < section.body.length) {
            let iterations = 0;
            let result = null;
            while (iterations < 3) {     
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
            pageNum++;
            done = result.done;
            results.push(getSingleTemplateResponse(result, pageNum));
        }
    }

    for (let result of results) {
        requests = requests.concat(result.requests);
        matching = { ...matching, ...result.matching };
        matchedList.push(result.matched);
    }

    return {
        requests,
        matching,
        matchedList,
    };
}

async function fitToTemplate(content, template, pageNum, clusterBrowser) {
    let result = await tryFitBody(content, 0, template, clusterBrowser);
    //console.log('Fitted', 0, result.done, result);
    return getSingleTemplateResponse(result, pageNum);
}

async function fitToSlide_random(content, obj, pageId, pageNum, clusterBrowser) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);

    let template = templates.getByOriginalId(pageId);
    
    return await fitToTemplate(content, template, pageNum, clusterBrowser);
}

async function fitToBestSlide_similarity(content, obj, pageNum, clusterBrowser) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);

    let poolTemplates = templates.getTemplates();

    let fitSessions = [];
    for (let original of poolTemplates) {
        let template = templates.copySingleTemplate(original);
        fitSessions.push(tryFitBody(content, 0, template, clusterBrowser));
    }

    let results = await Promise.all(fitSessions);

    let finalResult = null;

    for (let result of results) {
        if (finalResult === null || result.score.similarity > finalResult.score.similarity) {
            finalResult = result;
        }
    }
    return getSingleTemplateResponse(finalResult, pageNum);
}

async function fitToAllSlides_random(content, obj, sort, clusterBrowser) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);
    
    let poolTemplates = templates.getCustomTemplates();

    let requests = [];
    let matching = {};
    let matchedList = [];

    let generationSessions = [];

    let pageNum = 0;
    for (let original of poolTemplates) {
        let template = templates.copySingleTemplate(original);
        pageNum++;
        generationSessions.push(fitToTemplate(content, template, pageNum, clusterBrowser));
    }

    let results = await Promise.all(generationSessions);
    for (let result of results) {
        requests = requests.concat(result.requests);
        matching = { ...matching, ...result.matching };
        matchedList.push(result.matched);
    }

    if (sort) {
        let idAndScore = [];
        for (let key in matching) {
            idAndScore.push({
                key,
                score: matching[key].score,
            });
        }

        idAndScore.sort((p1, p2) => (p1.score - p2.score));

        for (let el of idAndScore) {
            let slideObjectId = el.key;
            requests.push({
                updateSlidesPosition: {
                    slideObjectIds: [slideObjectId],
                    insertionIndex: 0,
                }
            });
        }
    }

    return {
        requests,
        matching,
        matchedList,
    };
}


module.exports = {
    fitToPresentation_random,
    fitToSlide_random,
    fitToBestSlide_similarity,
    fitToAllSlides_random,
};
