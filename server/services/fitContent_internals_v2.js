const { scoreElements_withStyles } = require('./apis/EvaluateAPI');
const { initializeTemplate, initializePageElementShape_withStyles, initializePageElementImage_withStyles } = require('./apis/initializeAPI');
const {HEADER_PLACEHOLDER, IMAGE_PLACEHOLDER, SUBHEADER_PLACEHOLDER } = require('./Template');

function getAppropriateTargetLengths(isCustom, pageElement, originalStyles, targetStyles) {
    let targetLenghts = pageElement.additional.canbeMapped.slice(0);
    if (!isCustom) {
        targetLenghts = [Infinity, Infinity, Infinity];
    }
    let styles = null;
    for (let curStyles of targetStyles.styles) {
        if (curStyles.type === pageElement.type) {
            styles = curStyles;
        }
    }

    if (styles === null) {
        for (let curStyles of originalStyles.styles) {
            if (curStyles.type === pageElement.type) {
                styles = curStyles;
            }
        }   
    }

    if (styles === null) {
        throw Error("cannot find styles of type: " + pageElement.type);
    }

    for (let targetLength of targetLenghts) {
        if (styles.recommendedLength >= 0)
            targetLength = Math.min(targetLength, styles.recommendedLength)
    }
    return targetLenghts;
}

function extractShapeElements(page) {
    let shapeElements = [];
    for (let pageElement of page.pageElements) {
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

function extractImageElements(page) {
    let imageElements = [];
    for (let pageElement of page.pageElements) {
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

function fitToImage(settings, pageElement, originalStyles, targetStyles) {
    let styles = null;

    for (let curStyles of targetStyles.styles) {
        if (curStyles.type === pageElement.type) {
            styles = curStyles;
        }
    }

    if (styles === null) {
        for (let curStyles of originalStyles.styles) {
            if (curStyles.type === pageElement.type) {
                styles = curStyles;
            }
        }   
    }

    // if (styles === null) {
    //     throw Error('could not find styles 2');
    // }

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
                styles: styles,
            });
            break;
        }
    }

    let matching = {};
    matching[pageElement.objectId] = pageElementInfo;
    return matching;
}

function fitToShape(settings, pageElement, originalStyles, targetStyles, targetLengths) {
    let styles = null;

    for (let curStyles of targetStyles.styles) {
        if (curStyles.type === pageElement.type) {
            styles = curStyles;
        }
    }

    if (styles === null) {
        for (let curStyles of originalStyles.styles) {
            if (curStyles.type === pageElement.type) {
                styles = curStyles;
            }
        }   
    }

    if (styles === null) {
        throw Error('could not find styles 1');
    }

    let pageElementInfo = {
        rectangle: pageElement.rectangle,
        contents: [],
    };
    for (let contentIdx = 0; contentIdx < pageElement.mapped.length; contentIdx++) {
        let content = pageElement.mapped[contentIdx];
        let targetLength = targetLengths[contentIdx];
        if (content.hasOwnProperty('paragraph')) {
            let result = fitToParagraphMarker(settings, content.paragraph, targetLength);
            pageElementInfo.contents.push({
                ...result,
                contentId: content.paragraph.id,
                styles: styles,
            });    
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

async function tryFitBody_v2(settings, content, start, layoutTemplate, stylesTemplate, clusterBrowser) {
    let done = start;
    let matching = {};
    let requests = [];

    if (!Array.isArray(layoutTemplate.page.pageElements)) {
        return {
            totalScore: 0,
            score: {
                similarity: 0,
            },
            layoutTemplate,
            stylesTemplate,
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

    let shapeElements = extractShapeElements(layoutTemplate.page);
    let imageElements = extractImageElements(layoutTemplate.page);

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

    let originalStyles = layoutTemplate.getStylesJSON();
    let targetStyles = stylesTemplate.getStylesJSON();

    // Fit the header
    if (content.hasOwnProperty('header')) {
        totalNumContent++;
        let headerPageElement = null;
        let headerIdx = HEADER_PLACEHOLDER.length + SUBHEADER_PLACEHOLDER.length;
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
                let curIdx = SUBHEADER_PLACEHOLDER.findIndex((el) => el === pageElement.type);
                curIdx += HEADER_PLACEHOLDER.length;
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

                let targetLengths = getAppropriateTargetLengths(layoutTemplate.isCustom, pageElement, originalStyles, targetStyles);
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
                        && layoutTemplate.isCustom
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
        let targetLengths = getAppropriateTargetLengths(layoutTemplate.isCustom, pageElement, originalStyles, targetStyles);
        let currentMatching = {};
        if (IMAGE_PLACEHOLDER.includes(pageElement.type)) {
            currentMatching = fitToImage(settings, pageElement, originalStyles, targetStyles);
        }
        else {
            currentMatching = fitToShape(settings, pageElement, originalStyles, targetStyles, targetLengths);
        }

        let currentContents = currentMatching[pageElement.objectId].contents;

        for (let currentContent of currentContents) {
            let mappedContent = {
                text: currentContent.text,
                score: currentContent.score,
                url: currentContent.url,
                styles: currentContent.styles,
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

    let score = await scoreElements_withStyles(elements, clusterBrowser);
    
    for (let pageElement of elements) {
        if (IMAGE_PLACEHOLDER.includes(pageElement.type)) {
            requests = requests.concat(initializePageElementImage_withStyles(pageElement));
        }
        else {
            requests = requests.concat(initializePageElementShape_withStyles(pageElement));
        }
    }

    let result = {
        score: score,
        layoutTemplate,
        stylesTemplate,
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

function getSingleTemplateResponse_v2(result, targetPageId, pageNum, pageSize) {
    let globalRequests = [];
    globalRequests = globalRequests.concat(initializeTemplate(result.layoutTemplate, targetPageId, pageNum));
    globalRequests = globalRequests.concat(result.requests);

    let matching = {
        pageSize: pageSize,
        pageElements: { ...result.matching },
        totalScore: result.totalScore,
        layoutPageId: result.layoutTemplate.originalId,
        stylesPageId: result.stylesTemplate.originalId,
        pageNum: pageNum,
        objectId: targetPageId === null ? result.layoutTemplate.pageId : targetPageId,
    };
    
    globalRequests.push({
        deleteText: {
            objectId: result.layoutTemplate.informationBoxId,
            textRange: {
                type: 'ALL',
            }
        }
    });

    let informationText = '';
    let layoutPageNumStr = result.layoutTemplate.pageNum.toString();
    let stylesPageNumStr = result.stylesTemplate.pageNum.toString();
    if (result.layoutTemplate.isCustom) {
        informationText = '(Layout) Page ' + layoutPageNumStr + ' ';
    }
    else {
        informationText = '(Layout) Layout ' + layoutPageNumStr + ' ';   
    }

    if (result.stylesTemplate.isCustom) {
        informationText += '(Styles) Page ' + stylesPageNumStr + ' ';
    }
    else {
        informationText += '(Styles) Layout ' + stylesPageNumStr + ' ';   
    }

    for (let field in result.score) {
        let curScore = result.score[field];
        curScore = Math.round(curScore * 100) / 100;
        informationText += field + ": " + curScore.toString() + ', ';
    }
    informationText += ' similarity+coverage: ' + (Math.round(result.totalScore * 100) / 100).toString();
    
    globalRequests.push({
        insertText: {
            objectId: result.layoutTemplate.informationBoxId,
            text: informationText,
        }
    });
    return {
        requests: globalRequests,
        matching: matching,
        matched: result.moreInfo.totalNumMapped,
    };
}

module.exports = {
    tryFitBody_v2, 
    getSingleTemplateResponse_v2,
};