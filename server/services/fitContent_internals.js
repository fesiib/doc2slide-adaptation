const { scoreElements, getDominantTextStyle } = require('./apis/EvaluateAPI');
const { initializeTemplate, initializePageElementShape, initializePageElementImage } = require('./apis/initializeAPI');
const {HEADER_PLACEHOLDER, IMAGE_PLACEHOLDER, MAX_WORD_LENGTH, SUBHEADER_PLACEHOLDER } = require('./Template');

function extractShapeElements(slide) {
    let shapeElements = [];
    for (let pageElement of slide.pageElements) {
        if (pageElement.hasOwnProperty('additional')
            && pageElement.hasOwnProperty('shape')
        ) {
            let copyPageElement = { ...pageElement };
            copyPageElement.mapped = [];
            copyPageElement.mappedContents = [];
            copyPageElement.isHeader = false;
            shapeElements.push(copyPageElement);
        }
    }
    return shapeElements;
}

function extractImageElements(slide) {
    let imageElements = [];
    for (let pageElement of slide.pageElements) {
        if (pageElement.hasOwnProperty('additional')
            && pageElement.hasOwnProperty('image')
        ) {
            let copyPageElement = { ...pageElement };
            copyPageElement.mapped = [];
            copyPageElement.mappedContents = [];
            imageElements.push(copyPageElement);
        }
    }
    return imageElements;
}

function fitToParagraphMarker(settings, entity, paragraphLength) {
    let shortenings = entity.shortenings;
    let phrases = entity.phrases;
    let maxImportantWords = {
        ...entity.singleWord,
    };
    if (!settings.contentControl) {
        if (shortenings.length > 0) {
            return {
                ...shortenings[0],
            };
        }
        return maxImportantWords;
    }
    for (let shortening of shortenings) {
        if (shortening.text.length < paragraphLength) {
            if (shortening.score.importantWords > maxImportantWords.score.importantWords) {
                maxImportantWords = { ...shortening };
            }
        }
    }

    for (let phrase of phrases) {
        if (phrase.text.length < paragraphLength) {
            if (phrase.score.importantWords > maxImportantWords.score.importantWords) {
                maxImportantWords = { ...phrase };
            }
        }
    }
    return maxImportantWords;
}

function fitToImage(settings, pageElement) {
    let pageElementInfo = {
        rectangle: pageElement.rectangle,
        contents: [],
    };

    for (let content of pageElement.mapped) {
        if (content.hasOwnProperty('paragraph')) {
            if (content.paragraph.id === null) {
                continue;
            }
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
            break;
        }
    }

    let matching = {};
    matching[pageElement.objectId] = pageElementInfo;
    return matching;
}

function fitToShape_precise(settings, pageElement) {
    let textElements = pageElement.shape.text.textElements;
    let textElementIdx = 0;

    let pageElementInfo = {
        rectangle: pageElement.rectangle,
        contents: [],
    };
    for (let contentIdx = 0; contentIdx < pageElement.mapped.length; contentIdx++) {
        let content = pageElement.mapped[contentIdx];
        let paragraphLength = pageElement.additional.canbeMapped[contentIdx];
        while (textElementIdx < textElements.length
            && !textElements[textElementIdx].hasOwnProperty('paragraphMarker')    
        ) {
            textElementIdx++;
        }
        if (content.hasOwnProperty('paragraph')) {
            if (textElementIdx >= textElements.length
            ) {
                throw new Error('Mapped more paragraphs than needed', contents, textElements);
            }
            let result = fitToParagraphMarker(settings, content.paragraph, paragraphLength);
            pageElementInfo.contents.push({
                ...result,
                textElementIdx: textElementIdx,
                contentId: content.paragraph.id,
            });    
            textElementIdx++;
        }
    }
    let matching = {};
    matching[pageElement.objectId] = pageElementInfo;
    return matching;
}

function fitToShape(settings, pageElement) {
    let contents = pageElement.mapped;

    let textElements = pageElement.shape.text.textElements;
    let textElementIdx = 0;

    let lastParagraphMarker = null;
    let lastTextStyle = null;
    let lastEndIndex = 0;
    let lastParagraphLength = MAX_WORD_LENGTH;

    let pageElementInfo = {
        rectangle: pageElement.rectangle,
        contents: [],
    };

    while (textElementIdx < textElements.length) {
        if (textElements[textElementIdx].hasOwnProperty('paragraphMarker')) {
            paragraphMarker = textElements[textElementIdx].paragraphMarker;
            lastParagraphMarker = { ...paragraphMarker };
            let l = textElements[textElementIdx].startIndex;
            let r = textElements[textElementIdx].endIndex;

            if (l === undefined)
                l = 0;
            if (r === undefined) {
                r = l;
            }
            lastTextStyle = getDominantTextStyle({}, textElements, textElementIdx, l, r);
            lastEndIndex = r;

            if (!paragraphMarker.hasOwnProperty('bullet')) {
                lastParagraphLength = r;
                break;
            }
            delete lastParagraphMarker.bullet;
        }
        textElementIdx++;
    }
    
    if (lastParagraphMarker === null) {
        throw Error("PageElement without any paragraph: " + pageElement.objectId);
    }

    for (let content of contents) {
        while (textElementIdx < textElements.length
            && !textElements[textElementIdx].hasOwnProperty('paragraphMarker')    
        ) {
            textElementIdx++;
        }
        if (content.hasOwnProperty('paragraph')) {
            if (textElementIdx >= textElements.length
                || textElements[textElementIdx].paragraphMarker.hasOwnProperty('bullet')
            ) {
                textElements.splice(textElementIdx, 0, 
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
            lastParagraphMarker = textElements[textElementIdx].paragraphMarker;
            let l = textElements[textElementIdx].startIndex;
            let r = textElements[textElementIdx].endIndex;
            if (l === undefined) {
                l = 0;
            }
            if (r === undefined) {
                r = l;
            }
            if (r - l > 0 && lastParagraphLength < MAX_WORD_LENGTH) {
                lastParagraphLength = r - l;
            }

            lastTextStyle = getDominantTextStyle({}, textElements, textElementIdx, l, r);
            lastEndIndex = r;

            let result = fitToParagraphMarker(settings, content.paragraph, lastParagraphLength);
            pageElementInfo.contents.push({
                ...result,
                textElementIdx: textElementIdx,
                contentId: content.paragraph.id,
            });    
            textElementIdx++;
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

async function tryFitBody(settings, content, start, template, clusterBrowser) {
    let done = start;
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

    let elements = shapeElements.concat(imageElements);

    const area = (rectangle) => {
        let width = rectangle.finishX - rectangle.startX;
        let height = rectangle.finishY - rectangle.startY;
        let area = width * height;
        return area;
    }
    
    elements.sort((p1, p2) => {
        return area(p2.rectangle) - area(p1.rectangle);
    });

    let totalNumMapped = 0;
    let totalNumContent = 0;
    let totalNumSlideElements = elements.length;

    // Fit the header
    if (content.hasOwnProperty('header')) {
        totalNumContent++;
        let headerPageElement = null;
        let headerIdx = HEADER_PLACEHOLDER.length + 1;
        for (let pageElement of elements) {
            if (pageElement.additional.canbeMapped.length < 1
                || pageElement.additional.canbeMappedMin > 1
            ) {
                continue;
            }
            
            if (HEADER_PLACEHOLDER.includes(pageElement.type)) {
                let curIdx = HEADER_PLACEHOLDER.findIndex((el) => el === pageElement.type);
                if (headerIdx <= curIdx) {
                    continue;
                }
                headerPageElement = pageElement;
                headerIdx = curIdx;
            }
            if (SUBHEADER_PLACEHOLDER.includes(pageElement.type)) {
                let curIdx = HEADER_PLACEHOLDER.length;
                if (headerIdx <= curIdx) {
                    continue;
                }
                headerPageElement = pageElement;
                headerIdx = curIdx;    
            }
        }
        if (headerPageElement !== null) {
            headerPageElement.mapped.push({paragraph : { ...content.header} });
            headerPageElement.isHeader = true;
            totalNumMapped++;
        }
    }

    if (Array.isArray(content.body)) {
        totalNumContent += (content.body.length - start);

        let pageElementIdx = 0;
        for (let i = start; i < content.body.length; i++) {
            let didMapped = false;
            let bodyContent = content.body[i];
            while (pageElementIdx < elements.length) {
                let pageElement = elements[pageElementIdx];
                let targetLengths = pageElement.additional.canbeMapped;
                let targetLengthIdx = pageElement.mapped.length;
                if (targetLengths.length <= targetLengthIdx
                    || pageElement.additional.canbeMappedMin > (content.body.length - i)
                    || pageElement.isHeader || didMapped
                ) {
                    pageElementIdx++;
                    continue;
                }
                if (bodyContent.hasOwnProperty('paragraph')) {
                    let currentLength = content.body[i].paragraph.singleWord.text.length;
                    if (IMAGE_PLACEHOLDER.includes(pageElement.type)) {
                        if (!Array.isArray(bodyContent.paragraph.images)
                            || !settings.contentControl
                        ) {
                            pageElementIdx++;
                            continue;
                        }
                    }
                    else {
                        if (!bodyContent.paragraph.hasOwnProperty('singleWord')
                            || typeof bodyContent.paragraph.singleWord.text !== 'string'
                            || !bodyContent.paragraph.singleWord.hasOwnProperty('score')
                            || !bodyContent.paragraph.singleWord.score.hasOwnProperty('importantWords')
                            || !bodyContent.paragraph.singleWord.score.hasOwnProperty('grammatical')
                            || !bodyContent.paragraph.singleWord.score.hasOwnProperty('semantic')
                        ) {
                            pageElementIdx++;
                            continue;
                        }
                    }
                    while (targetLengthIdx < targetLengths.length
                        && template.isCustom
                        && settings.contentControl
                        && targetLengths[targetLengthIdx] <= currentLength
                    ) {
                        pageElement.mapped.push({
                            paragraph: {
                                id: null,
                                images: [],
                                phrases: [],
                                shortenings: [],
                                singleWord: {
                                    text: '',
                                    score: {
                                        grammatical: 1,
                                        importantWords: 1,
                                        semantic: 1,
                                    },
                                }
                            },
                        });
                        targetLengthIdx++;
                    }
                    if (targetLengthIdx >= targetLengths.length) {
                        pageElementIdx++;
                        continue;
                    }
                    pageElement.mapped.push({ ...bodyContent });
                    didMapped = true;
                    break;
                }
                else if (bodyContent.hasOwnProperty('bullet')) {
                    didMapped = true;
                    //TODO
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

    for (let pageElement of elements) {
        let currentMatching = {};
        if (IMAGE_PLACEHOLDER.includes(pageElement.type)) {
            currentMatching = fitToImage(settings, pageElement);
        }
        else if (template.isCustom) {
            currentMatching = fitToShape_precise(settings, pageElement);
        }
        else {
            currentMatching = fitToShape(settings, pageElement);
        }

        let currentContents = currentMatching[pageElement.objectId].contents;

        for (let currentContent of currentContents) {
            let mappedContent = {
                text: currentContent.text,
                score: currentContent.score,
                textElementIdx: currentContent.textElementIdx,
                url: currentContent.url,
            };
            pageElement.mappedContents.push(mappedContent);
        }

        while (pageElement.mappedContents.length > 0) {
            let n = pageElement.mappedContents.length;
            if (pageElement.mappedContents[n - 1].text === '') {
                pageElement.mappedContents.pop();
            }
            else {
                break;
            }
        }

        // currentMatching[pageElement.objectId].contents = currentContents.filter((val) => {
        //     return val.contentId !== null;
        // });

        matching = {
            ...currentMatching,
            ...matching,
        };
    }

    let score = await scoreElements(elements, clusterBrowser);
    
    for (let pageElement of elements) {
        if (IMAGE_PLACEHOLDER.includes(pageElement.type)) {
            requests = requests.concat(initializePageElementImage(pageElement));
        }
        else {
            requests = requests.concat(initializePageElementShape(pageElement));
        }
    }

    let result = {
        score: score,
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

    let totalScore = (result.score.similarity * 4 + result.score.importantWords) / 5;

    if (totalScore < 0) {
        totalScore += 10 * (
            (result.moreInfo.totalNumMapped 
                - result.moreInfo.totalNumContent) 
            + (result.moreInfo.totalNumMapped    
                - result.moreInfo.totalNumSlideElements)
        );
    }
    else {
        let total = Math.max(result.moreInfo.totalNumSlideElements, result.moreInfo.totalNumContent);
        if (total > 0) {
            totalScore *= (result.moreInfo.totalNumMapped / total);
        }
    }

    return {
        totalScore,
        ...result,
    };
}

function getSingleTemplateResponse(result, targetPageId, pageNum, pageSize) {
    let globalRequests = [];
    globalRequests = globalRequests.concat(initializeTemplate(result.template, targetPageId, pageNum));
    globalRequests = globalRequests.concat(result.requests);

    
    let matching = {
        pageSize: pageSize,
        pageElements: { ...result.matching },
        totalScore: result.totalScore,
        originalId: result.template.originalId,
        pageNum: pageNum,
        objectId: targetPageId === null ? result.template.pageId : targetPageId,
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

module.exports = {
    tryFitBody, 
    getSingleTemplateResponse,

};