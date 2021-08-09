const { scoreShapeElements, scoreImageElements, getDominantTextStyle } = require('./EvaluateAPI');
const { initializeTemplate, initializePageElementShape, initializePageElementImage } = require('./initializeSlide');
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
                copyPageElement.mapped = [];
                copyPageElement.mappedContents = [];
                copyPageElement.isHeader = false;
                shapeElements.push(copyPageElement);
            }
        }
    }
    const area = (rectangle) => {
        let width = rectangle.finishX - rectangle.startX;
        let height = rectangle.finishY - rectangle.startY;
        let area = width * height;
        return area;
    }
    shapeElements.sort((p1, p2) => {
        return area(p2.rectangle) - area(p1.rectangle);
    });
    return shapeElements;
}

function extractImageElements(slide) {
    let imageElements = [];
    for (let pageElement of slide.pageElements) {
        if (pageElement.hasOwnProperty('additional')) {
            if (pageElement.hasOwnProperty('image')) {
                let copyPageElement = { ...pageElement };
                copyPageElement.mapped = [];
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

function fitToImage(contents, pageElement) {
    let pageElementInfo = {
        rectangle: pageElement.rectangle,
        contents: [],
    };

    for (let content of contents) {
        if (content.hasOwnProperty('paragraph')) {
            let result = {
                ...content.paragraph.images[0],
                score: {
                    visual: 1,
                },
            };
            pageElementInfo.contents.push({
                ...result,
                contentId: content.paragraph.id,
            });
        }
    }

    let matching = {};
    matching[pageElement.objectId] = pageElementInfo;
    return matching;
}

function fitToShape(contents, pageElement, isCustom) {
    let textElements = pageElement.shape.text.textElements;
    let textElementId = 0;

    let lastParagraphMarker = null;
    let lastTextStyle = null;
    let lastEndIndex = 0;
    let lastParagraphLength = Infinity;

    let pageElementInfo = {
        rectangle: pageElement.rectangle,
        contents: [],
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

            pageElementInfo.contents.push({
                ...result,
                textElementId,
                contentId: content.paragraph.id,
            });
            textElementId++;
        }
        else if (content.hasOwnProperty('bullet')) {
            // TODO: implement Bullets
            continue;
        }
    }
    let matching = {};
    matching[pageElement.objectId] = pageElementInfo;
    return matching;
}

async function tryFitBody(content, start, template, clusterBrowser) {
    let done = start;
    let score = null;
    let matching = {};
    let requests = [];

    let slide = template.page;
    if (!Array.isArray(slide.pageElements)) {
        return {
            totalScore: 0,
            score: {
                similarity: 0,
            },
            template,
            done,
            matching,
            requests,
            moreInfo: {
                totalNumMapped: 0,
                totalNumContent: 0,
                totalNumSlideElements: 0,    
            },
        };
    }

    let shapeElements = extractShapeElements(slide);
    let imageElements = extractImageElements(slide);

    let totalNumMapped = 0;
    let totalNumContent = 0;
    let totalNumSlideElements = shapeElements.length;

    // Fit the header
    if (content.hasOwnProperty('header')) {
        totalNumContent++;

        let headerPageElement = null;
        let headerIdx = HEADER_PLACEHOLDER.length;
        let id = content.header.id;
        for (let pageElement of shapeElements) {
            if (pageElement.additional.mappedCntMax < 1
                || pageElement.additional.mappedCntMin > 1
            ) {
                continue;
            }
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
            headerPageElement.mapped.push({paragraph : { ...content.header} });
            headerPageElement.isHeader = true;
            totalNumMapped++;
        }
    }
    // Fit the content
    if (Array.isArray(content.body)) {
        totalNumContent += (content.body.length - start);
        for (let i = start; i < content.body.length; i++) {
            let didMapped = false;
            for (let pageElement of imageElements) {  
                if (pageElement.additional.mappedCntMax < pageElement.mapped.length + 1    
                    || pageElement.isHeader || didMapped
                ) {
                    continue;
                }

                if (content.body[i].hasOwnProperty('paragraph')) {
                    if (!Array.isArray(content.body[i].paragraph.images)
                        || content.body[i].paragraph.images === 0
                    ) {
                        continue;
                    }
                }
                else if (content.body[i].hasOwnProperty('bullet')) {
                    //TODO
                    continue;
                }
                pageElement.mapped.push({ ...content.body[i] });
                didMapped = true;
                break;
            }
            for (let pageElement of shapeElements) {
                if (pageElement.additional.mappedCntMax < pageElement.mapped.length + 1
                    || pageElement.isHeader || didMapped
                ) {
                    continue;
                }
    
                if (pageElement.shape.hasOwnProperty('placeholder')
                    && pageElement.shape.placeholder.hasOwnProperty('type')
                ) {
                    let type = pageElement.shape.placeholder.type;
                    if (NOT_BODY_PLACEHOLDER.includes(type)) {
                        continue;
                    }
                }
                if (pageElement.shape.hasOwnProperty('shapeType')
                    && pageElement.shape.shapeType === 'TEXT_BOX'
                ) {
                    pageElement.mapped.push({ ...content.body[i] });
                    didMapped = true;
                    break;
                }
            }
            if (didMapped) {
                totalNumMapped++;
                done++;
            }
            else {
                break;
            }
        }
    }

    for (let pageElement of imageElements) {
        let currentMatching = fitToImage(pageElement.mapped, pageElement);
        matching = {
            ...currentMatching,
            ...matching,
        };
        let result = currentMatching[pageElement.objectId];
        for (let resultContent of result.contents) {
            let mappedContent = {
                url: resultContent.url,
                score: resultContent.score,
            };
            pageElement.mappedContents.push(mappedContent);
        }
    }

    for (let pageElement of shapeElements) {
        let currentMatching = fitToShape(pageElement.mapped, pageElement, template.isCustom);
        matching = {
            ...currentMatching,
            ...matching,
        };
        let result = currentMatching[pageElement.objectId];
        for (let resultContent of result.contents) {
            let mappedContent = {
                text: resultContent.text,
                score: resultContent.score,
            };
            pageElement.mappedContents.push(mappedContent);
        }
    }

    scoreShape = await scoreShapeElements(shapeElements, clusterBrowser);
    scoreImage = await scoreImageElements(imageElements, clusterBrowser);
    
    for (let pageElement of imageElements) {
        requests = requests.concat(initializePageElementImage(pageElement));
    }
    for (let pageElement of shapeElements) {
        requests = requests.concat(initializePageElementShape(pageElement));
    }

    let result = {
        score: {
            ...scoreShape,
            ...scoreImage,
        },
        template,
        done,
        content,
        matching,
        requests,
        moreInfo: {
            totalNumMapped,
            totalNumContent,
            totalNumSlideElements,    
        }
    };

    let totalScore = 0.0;

    if (result.score.similarity < 0) {
        totalScore = (result.score.similarity 
            + 100 * (result.moreInfo.totalNumMapped 
                - result.moreInfo.totalNumContent) );
    }
    else {
        let total = result.moreInfo.totalNumContent;
        if (total > 0) {
            totalScore = (result.score.similarity * (result.moreInfo.totalNumMapped / total) );
        }
        else {
            totalScore = result.score.similarity;
        }
    }

    return {
        totalScore,
        ...result,
    };
}

function getSingleTemplateResponse(result, pageNum, pageSize) {
    let globalRequests = [];
    globalRequests = globalRequests.concat(initializeTemplate(result.template, pageNum));
    globalRequests = globalRequests.concat(result.requests);

    
    let matching = {
        pageSize: pageSize,
        pageElements: { ...result.matching },
        totalScore: result.totalScore,
        originalId: result.template.originalId,
        pageNum: pageNum,
        objectId: result.template.pageId,
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
    informationText += ' similarity+coverage: ' + (Math.round(result.totalScore * 100) / 100).toString();
    
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
    
    let pageSize = templates.getPageSizeInPX();

    let requests = [];
    let matching = [];
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
                if (result === null || result.totalScore < current.totalScore) {
                    result = current;
                }
                if (result.totalScore >= 90.0) {
                    break;
                }
                iterations++;
            }
            pageNum++;
            done = result.done;
            results.push(getSingleTemplateResponse(result, pageNum, pageSize));
        }
    }

    for (let result of results) {
        requests = requests.concat(result.requests);
        matching.push({ ...result.matching });
        matchedList.push(result.matched);
    }

    return {
        requests,
        matching,
        matchedList,
    };
}

async function fitToSlide_random(content, obj, pageId, pageNum, clusterBrowser) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);

    let pageSize = templates.getPageSizeInPX();

    let template = templates.getByOriginalId(pageId);

    let result = await tryFitBody(content, 0, template, clusterBrowser);
    //console.log('Fitted', 0, result.done, result);
    return getSingleTemplateResponse(result, pageNum, pageSize);
}

async function fitToBestSlide_total(content, obj, pageNum, clusterBrowser) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);

    let pageSize = templates.getPageSizeInPX();

    let poolTemplates = templates.getTemplates();

    let fitSessions = [];
    for (let original of poolTemplates) {
        let template = templates.copySingleTemplate(original);
        fitSessions.push(tryFitBody(content, 0, template, clusterBrowser));
    }

    let results = await Promise.all(fitSessions);

    let finalResult = null;

    for (let result of results) {
        if (finalResult === null || result.totalScore > finalResult.totalScore) {
            finalResult = result;
        }
    }
    return getSingleTemplateResponse(finalResult, pageNum, pageSize);
}

async function fitToAllSlides_random(content, obj, sort, clusterBrowser) {
    let templates = new Templates('', { width: {magnitude: 0, unit: 'EMU'}, height: {magnitude: 0, unit: 'EMU'}});
    templates.copyInstance(obj);
    
    let pageSize = templates.getPageSizeInPX();

    let poolTemplates = templates.getCustomTemplates();

    let requests = [];
    let matching = [];
    let matchedList = [];

    let fitBodySessions = [];

    for (let original of poolTemplates) {
        let template = templates.copySingleTemplate(original);
        fitBodySessions.push(tryFitBody(content, 0, template, clusterBrowser));
    }

    let results = await Promise.all(fitBodySessions);

    if (sort) {
        results.sort((p1, p2) => (p2.totalScore - p1.totalScore));
    }
    
    let pageNum = 0;
    for (let result of results) {
        pageNum++;
        let response = getSingleTemplateResponse(result, pageNum, pageSize);

        requests = requests.concat(response.requests);
        matching.push({ ...response.matching });
        matchedList.push(response.matched);
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
    fitToBestSlide_total,
    fitToAllSlides_random,
};
