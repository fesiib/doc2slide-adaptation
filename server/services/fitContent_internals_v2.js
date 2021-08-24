const { scoreElements_withStyles } = require('./apis/EvaluateAPI');
const { initializeTemplate, initializePageElementShape_withStyles, initializePageElementImage_withStyles, addTextBox } = require('./apis/initializeAPI');
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
    let maxImportantWords = {
        text: '',
        score: {
            grammatical: 1,
            importantWords: 0,
            semantic: 1,
        },
    };
    let shortenings = entity.shortenings;
    if (!settings.contentControl) {
        if (shortenings.length > 0) {
            if (shortenings[0].hasOwnProperty('text')) {
                maxImportantWords.text = shortenings[0].text;
            }
            if (shortenings[0].hasOwnProperty('score'))  {
                maxImportantWords.score = {
                    ...maxImportantWords.score,
                    ...shortenings[0].score,
                }
            }
        }
        return maxImportantWords;
    }
    if (Array.isArray(shortenings)) {
        for (let shortening of shortenings) {
            if (!shortening.hasOwnProperty('text')
                || !shortening.hasOwnProperty('score')
                || !shortening.score.hasOwnProperty('importantWords')
            ) {
                continue;
            }
            if (shortening.text.length < paragraphLength) {
                if (shortening.score.importantWords > maxImportantWords.score.importantWords
                    || (
                        shortening.score.importantWords === maxImportantWords.score.importantWords
                        && shortening.text.length > maxImportantWords.text.length
                    )
                ) {
                    maxImportantWords = { ...shortening };
                }
            }
        }    
    }


    let phrases = entity.phrases;
    if (Array.isArray(phrases)) {
        for (let phrase of phrases) {
            if (!phrase.hasOwnProperty('text')
                || !phrase.hasOwnProperty('score')
                || !phrase.score.hasOwnProperty('importantWords')
            ) {
                continue;
            }
            if (phrase.text.length < paragraphLength) {
                if (phrase.score.importantWords > maxImportantWords.score.importantWords
                    || (
                        phrase.score.importantWords === maxImportantWords.score.importantWords
                        && phrase.text.length > maxImportantWords.text.length
                    )
                ) {
                    maxImportantWords = { ...phrase };
                }
            }
        }
    }

    if (entity.hasOwnProperty('singleWord')) {
        let singleWord = entity.singleWord;
        if (singleWord.hasOwnProperty('text')
            && singleWord.hasOwnProperty('score')
            && singleWord.score.hasOwnProperty('importantWords')
        ) {
            if (singleWord.text.length < paragraphLength
                && singleWord.score.importantWords > maxImportantWords.score.importantWords
            ) {
                maxImportantWords = { ...singleWord };
            }
        }
    }
    return maxImportantWords;
}


function fitToImage(settings, pageElement, originalBox, originalStyles, targetStyles) {
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
        box: originalBox,
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
                isOriginalContent: content.paragraph.isOriginalContent,
            });
            break;
        }
    }

    let matching = {};
    matching[pageElement.objectId] = pageElementInfo;
    return matching;
}

function fitToShape(settings, pageElement, originalBox, originalStyles, targetStyles, targetLengths) {
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
        box: originalBox,
        contents: [],
    };
    for (let contentIdx = 0; contentIdx < pageElement.mapped.length; contentIdx++) {
        let content = pageElement.mapped[contentIdx];
        let targetLength = targetLengths[contentIdx];
        if (content.hasOwnProperty('paragraph')) {
            if (content.paragraph.id === null) {
                continue;
            }
            let result = fitToParagraphMarker(settings, content.paragraph, targetLength);
            pageElementInfo.contents.push({
                ...result,
                contentId: content.paragraph.id,
                styles: styles,
                isOriginalContent: content.paragraph.isOriginalContent,
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

    let originalLayout = layoutTemplate.getLayoutJSON();

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
            headerPageElement.mapped.push({
                paragraph: { 
                    ...content.header,
                    isOriginalContent: false,
                },
            });
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
                    if (IMAGE_PLACEHOLDER.includes(pageElement.type)) {
                        if (!Array.isArray(bodyContent.paragraph.images)
                            //|| !settings.contentControl
                        ) {
                            pageElementIdx++;
                            continue;
                        }
                    }
                    else {
                        if (settings.contentControl &&
                            ( !bodyContent.paragraph.hasOwnProperty('singleWord')
                                || typeof bodyContent.paragraph.singleWord.text !== 'string'
                                || !bodyContent.paragraph.singleWord.hasOwnProperty('score')
                                || !bodyContent.paragraph.singleWord.score.hasOwnProperty('importantWords')
                                || !bodyContent.paragraph.singleWord.score.hasOwnProperty('grammatical')
                                || !bodyContent.paragraph.singleWord.score.hasOwnProperty('semantic')
                            )
                        ) {
                            pageElementIdx++;
                            continue;
                        }
                    }
                    while (targetLengthIdx < targetLengths.length
                        && layoutTemplate.isCustom
                        && settings.contentControl
                        && targetLengths[targetLengthIdx] <= content.body[i].paragraph.singleWord.text.length
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
                                },
                                isOriginalContent: false,  
                            },
                        });
                        targetLengthIdx++;
                    }
                    if (targetLengthIdx >= targetLengths.length) {
                        pageElementIdx++;
                        continue;
                    }
                    pageElement.mapped.push({
                        paragraph: {
                            ...bodyContent.paragraph,
                            isOriginalContent: false,
                        },
                    });
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

        let originalBox = {};
        for (let box of originalLayout.boxes) {
            if (box.objectId === pageElement.objectId) {
                originalBox = { ...box };
                break;
            }
        }

        if (settings.putOriginalContent 
            && pageElement.mapped.length === 0
            && originalBox.hasOwnProperty('originalContents')
        ) {
            // put OriginalContent
            for (let content of originalBox.originalContents) {
                pageElement.mapped.push(content);
            }
        }
        if (IMAGE_PLACEHOLDER.includes(pageElement.type)) {
            currentMatching = fitToImage(settings, pageElement, originalBox, originalStyles, targetStyles);
        }
        else {
            currentMatching = fitToShape(settings, pageElement, originalBox, originalStyles, targetStyles, targetLengths);
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

function getSingleTemplateResponse_v2(settings, result, targetPageId, pageNum, pageSize) {
    let globalRequests = [];
    globalRequests = globalRequests.concat(initializeTemplate(result.layoutTemplate, targetPageId, pageNum));
    globalRequests = globalRequests.concat(result.requests);

    if (targetPageId === null) {
        targetPageId = result.layoutTemplate.pageId;
    }

    let matching = {
        pageSize: pageSize,
        pageElements: { ...result.matching },
        totalScore: result.totalScore,
        layoutPageId: result.layoutTemplate.originalId,
        stylesPageId: result.stylesTemplate.originalId,
        pageNum: pageNum,
        objectId: targetPageId,
    };

    if (settings.debug) {
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
        
        globalRequests = globalRequests.concat(addTextBox(result.layoutTemplate.informationBoxId, targetPageId, informationText));
    }
    
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