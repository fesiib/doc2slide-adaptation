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
    if (!Array.isArray(page.pageElements)) {
        return [];
    }
    let shapeElements = [];
    for (let pageElement of page.pageElements) {
        if (pageElement.hasOwnProperty('additional')
            && pageElement.hasOwnProperty('shape')
        ) {
            shapeElements.push( { ...pageElement } );
        }
    }
    return shapeElements;
}

function extractImageElements(page) {
    if (!Array.isArray(page.pageElements)) {
        return [];
    }
    let imageElements = [];
    for (let pageElement of page.pageElements) {
        if (pageElement.hasOwnProperty('additional')
            && pageElement.hasOwnProperty('image')
        ) {
            imageElements.push({ ...pageElement } );
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

function initializeMapping(content, start, layoutTemplate) {
    let mapping = {};
    if (content.hasOwnProperty('header')) {
        mapping[content.header.id] = {
            wasMatched: false,
            type: null,
        };
    }
    if (content.hasOwnProperty('body')) {
        for (let i = start; i < content.body.length; i++) {
            bodyContent = content.body[i];
            if (bodyContent.hasOwnProperty('paragraph')) {
                mapping[bodyContent.paragraph.id] = {
                    wasMatched: false,
                    type: null,
                };
            }
            else if (bodyContent.hasOwnProperty('bullet')) {
                //TODO
                mapping[bodyContent.bullet.id] = {
                    wasMatched: false,
                    type: null,
                };
            }
        }
    }
    let shapeElements = extractShapeElements(layoutTemplate.page);
    let imageElements = extractImageElements(layoutTemplate.page);

    let elements = shapeElements.concat(imageElements);

    for (let pageElement of elements) {
        pageElement.mapped = [];
        pageElement.mappedContents = [];
        pageElement.isHeader = false;
    }

    return {
        mapping,
        elements,
    }
}

function getMappingNoPreserveType_DP(settings, content, start, layoutTemplate, stylesTemplate) {
    if (content.hasOwnProperty('header')) {
        content.header.type = 'ANY';
        content.header.format = 'any';
    }
    if (Array.isArray(content.body)) {
        for (let bodyContent of content.body) {
            if (bodyContent.hasOwnProperty('paragraph')) {
                bodyContent.paragraph.type = 'ANY';
                bodyContent.paragraph.format = 'any';
            }
        }
    }
    return getMappingPreserveType_DP(settings, content, start, layoutTemplate, stylesTemplate);
}

function getMappingPreserveType_DP(settings, content, start, layoutTemplate, stylesTemplate) {
    let {
        mapping,
        elements,
    } = initializeMapping(content, start, layoutTemplate);

    let done = start;

    const area = (rectangle) => {
        let width = rectangle.finishX - rectangle.startX;
        let height = rectangle.finishY - rectangle.startY;
        let area = width * height;
        return area;
    }
    
    elements.sort((p1, p2) => {
        return area(p2.rectangle) - area(p1.rectangle);
    });

    // Fit the header
    if (content.hasOwnProperty('header')) {
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
            mapping[content.header.id] = {
                wasMatched: true,
                type: headerPageElement.type,
            };
        }
    }

    let idTypes = {};

    for (let i = 0; i < elements.length; i++) {
        let pageElement = elements[i];
        if (pageElement.isHeader) {
            continue;
        }
        if (!idTypes.hasOwnProperty(pageElement.type)) {
            idTypes[pageElement.type] = [];
        }
        idTypes[pageElement.type].push(i);
    }

    if (Array.isArray(content.body)) {
        const CAN_FIT_MULTIPLE_CONTENTS = ["BODY"];

        let types = Object.keys(idTypes);

        let order = ['contentIdx'].concat(types);
        order.push('lastTypeIdx', 'toSameTypeInARow');
        order.reverse()

        let startState = {
            contentIdx: start,
            toSameTypeInARow: 0,
            lastTypeIdx: 0,
        };
        let nState = {
            contentIdx: content.body.length - start,
            toSameTypeInARow: content.body.length - start,
            lastTypeIdx: types.length + 1,
        }
        for (let key of types) {
            startState[key] = 0;
            nState[key] = idTypes[key].length;
        }
        
        const incrementState = (state) => {
            for (let key of order) {
                if (state[key] < nState[key]) {
                    state[key]++;
                    for (let prevKey of order) {
                        if (prevKey === key) {
                            break;
                        }
                        state[prevKey] = 0;
                    }
                    return true;
                }
            }
            return false;
        }

        const stateToIdx = (state) => {
            let pos = 0;
            let multConst = 1;
            for (let key of order) {
                pos += state[key] * multConst;
                multConst *= (nState[key] + 1);
            }
            return pos;
        }

        const canBeMapped = (bodyContent, type) => {
            if (!bodyContent.hasOwnProperty('paragraph')) {
                return false;
            }
            if (IMAGE_PLACEHOLDER.includes(type)) {
                if (!Array.isArray(bodyContent.paragraph.images)
                    || bodyContent.paragraph.images.length === 0
                ) {
                    return false;
                }
                return true;
            }
            if (settings.contentControl &&
                ( !bodyContent.paragraph.hasOwnProperty('singleWord')
                    || typeof bodyContent.paragraph.singleWord.text !== 'string'
                    || !bodyContent.paragraph.singleWord.hasOwnProperty('score')
                    || !bodyContent.paragraph.singleWord.score.hasOwnProperty('importantWords')
                    || !bodyContent.paragraph.singleWord.score.hasOwnProperty('grammatical')
                    || !bodyContent.paragraph.singleWord.score.hasOwnProperty('semantic')
                )
            ) {
                return false;
            }
            return true;
        }

        let dp = [], pr = [];

        let maxIdx = stateToIdx(nState);
        for (let idx = 0; idx <= maxIdx; idx++) {
            dp.push(-1);
            pr.push(null);
        }

        let curState = { ...startState };
        dp[stateToIdx(curState)] = 0;
        pr[stateToIdx(curState)] = { ...startState };

        while (true) {
            if (curState.contentIdx < nState.contentIdx && dp[stateToIdx(curState)] >= 0) {
                // skip current content
                let nextState = {
                    ...curState,
                    contentIdx: curState.contentIdx + 1,
                    lastTypeIdx: 0,
                    toSameTypeInARow: 0,
                };
                if (dp[stateToIdx(nextState)] < dp[stateToIdx(curState)]) {
                    pr[stateToIdx(nextState)] = { ...curState };
                    dp[stateToIdx(nextState)] = dp[stateToIdx(curState)];
                }
                for (let newTypeIdx = 0; newTypeIdx < types.length; newTypeIdx++) {
                    let newType = types[newTypeIdx];
                    let bodyContent = content.body[curState.contentIdx + start];
                    if (!canBeMapped(bodyContent, newType)) {
                        continue;
                    }
                    if (CAN_FIT_MULTIPLE_CONTENTS.includes(newType)
                        && newTypeIdx === curState.lastTypeIdx - 1
                        && curState[newType] <= nState[newType]
                        && curState[newType] > 0
                    ) {
                        let pageElement = elements[idTypes[newType][curState[newType] - 1]];
                        if (pageElement.additional.canbeMapped.length > curState.toSameTypeInARow) {
                            let add = 0;
                            if (!bodyContent.paragraph.hasOwnProperty('type')
                                || bodyContent.paragraph.type === 'ANY'
                                || bodyContent.paragraph.type === pageElement.type
                            ) {
                                add = 1;
                            }
                            let nextState = {
                                ...curState,
                                contentIdx: curState.contentIdx + 1,
                                toSameTypeInARow: curState.toSameTypeInARow + 1,
                                lastTypeIdx: newTypeIdx + 1,
                            };
                            if (dp[stateToIdx(nextState)] < dp[stateToIdx(curState)] + add) {
                                pr[stateToIdx(nextState)] = { ...curState };
                                dp[stateToIdx(nextState)] = dp[stateToIdx(curState)] + add;
                            }
                        }
                    }
                    if (curState[newType] < nState[newType]) {
                        let pageElement = elements[idTypes[newType][curState[newType]]];;
                        if (pageElement.additional.canbeMapped.length > 0) {
                            let add = 0;
                            if (!bodyContent.paragraph.hasOwnProperty('type')
                                || bodyContent.paragraph.type === 'ANY'
                                || bodyContent.paragraph.type === pageElement.type
                            ) {
                                add = 1;
                            }
                            let nextState = {
                                ...curState,
                                contentIdx: curState.contentIdx + 1,
                                lastTypeIdx: newTypeIdx + 1,
                                toSameTypeInARow: 1,
                            };
                            nextState[newType]++;
                            if (dp[stateToIdx(nextState)] < dp[stateToIdx(curState)] + add) {
                                pr[stateToIdx(nextState)] = { ...curState };
                                dp[stateToIdx(nextState)] = dp[stateToIdx(curState)] + add;
                            }
                        }
                    }
                }
            }
            if (!incrementState(curState)) {
                break;
            }
        }

        const isBetterState = (curState, otherState) => {
            if (curState.contentIdx > otherState.contentIdx) {
                return true;
            }
            let curSum = 0, otherSum = 0;
            for (let key of types) {
                curSum += curState[key];
                otherSum += otherState[key];
            }
            if (curSum > otherSum) {
                return true;
            }
            if (dp[stateToIdx(curState)] > dp[stateToIdx(otherState)]) {
                return true;
            }
            return false;
        }

        const isEqual = (curState, otherState) => {
            for (let key in curState) {
                if (!otherState.hasOwnProperty(key)) {
                    return false;
                }
                if (otherState[key] !== curState[key]) {
                    return false;
                }
            }
            for (let key in otherState) {
                if (!curState.hasOwnProperty(key)) {
                    return false;
                }
                if (otherState[key] !== curState[key]) {
                    return false;
                }
            }
            return true;
        };
        curState = { ...startState };
        let bestState = { ...startState };
        while (incrementState(curState)) {
            if (dp[stateToIdx(curState)] >= 0) {
                if (pr[stateToIdx(curState)] !== null && isBetterState(curState, bestState)) {
                    bestState = { ...curState };
                }
            }
        }

        done = bestState.contentIdx + start;

        while (!isEqual(bestState, pr[stateToIdx(bestState)])) {
            let prevState = pr[stateToIdx(bestState)];
            if (bestState.lastTypeIdx > 0) {
                let bodyContent = content.body[bestState.contentIdx - 1 + start]; 
                let curType = types[bestState.lastTypeIdx - 1];
                let pageElement = elements[idTypes[curType][bestState[curType] - 1]];
                pageElement.mapped.unshift({
                    paragraph: {
                        ...bodyContent.paragraph,
                        isOriginalContent: false,
                    },
                });
                mapping[bodyContent.paragraph.id] = {
                    wasMatched: true,
                    type: pageElement.type,
                };
            }
            bestState = { ...prevState };
        }
    }
    return {
        mapping,
        elements,
        done,
    };
}

function getMappingArea(settings, content, start, layoutTemplate, stylesTemplate) {
    let {
        mapping,
        elements,
    } = initializeMapping(content, start, layoutTemplate);

    let done = start;

    const area = (rectangle) => {
        let width = rectangle.finishX - rectangle.startX;
        let height = rectangle.finishY - rectangle.startY;
        let area = width * height;
        return area;
    }
    
    elements.sort((p1, p2) => {
        return area(p2.rectangle) - area(p1.rectangle);
    });

    let originalStyles = layoutTemplate.getStylesJSON();
    let targetStyles = stylesTemplate.getStylesJSON();

    // Fit the header
    if (content.hasOwnProperty('header')) {
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
            mapping[content.header.id] = {
                wasMatched: true,
                type: headerPageElement.type,
            };
        }
    }

    if (Array.isArray(content.body)) {
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
                    mapping[bodyContent.paragraph.id] = {
                        wasMatched: true,
                        type: pageElement.type,
                    };
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
                done++;
            }
            else {
                break;
            }
        }
    }
    return {
        mapping,
        elements,
        done,
    };
}

async function fitToPage(settings, mappingFunction, content, start, layoutTemplate, stylesTemplate, clusterBrowser) {
    let matching = {};
    let {
        mapping,
        elements,
        done,
    } = mappingFunction(settings, content, start, layoutTemplate, stylesTemplate);
    let requests = [];


    let originalStyles = layoutTemplate.getStylesJSON();
    let targetStyles = stylesTemplate.getStylesJSON();
    let originalLayout = layoutTemplate.getLayoutJSON();
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


        // let putOriginalContent = true;
        // for (let mappedContent of pageElement.mapped) {
        //     if (mappedContent.paragraph.id !== null
        //         && typeof mappedContent.paragraph.id === 'string'
        //     ) {
        //         putOriginalContent = false;
        //         break;
        //     }
        // }

        if (settings.putOriginalContent 
            && pageElement.additional.canbeMapped.length > 0
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

    let totalNumMapped = 0;

    for (let contentId in mapping) {
        if (mapping[contentId].hasOwnProperty('wasMatched')) {
            if (mapping[contentId].wasMatched)
                totalNumMapped++;
        }
    }

    let result = {
        score: score,
        layoutTemplate,
        stylesTemplate,
        done,
        content,
        matching,
        mapping,
        requests,
        moreInfo: {
            totalNumMapped: totalNumMapped,
            totalNumContent: Object.keys(mapping),
            totalNumSlideElements: elements.length,    
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

// async function tryFitBody_v2(settings, content, start, layoutTemplate, stylesTemplate, clusterBrowser) {
//     let done = start;
//     let matching = {};
//     let mapping = {};
//     let requests = [];

//     let totalNumContent = 0;
//     if (content.hasOwnProperty('header')) {
//         totalNumContent++;
//         mapping[content.header.id] = {
//             wasMatched: false,
//             type: null,
//         };
//     }
//     if (content.hasOwnProperty('body')) {
//         for (let i = start; i < content.body.length; i++) {
//             bodyContent = content.body[i];
//             if (bodyContent.hasOwnProperty('paragraph')) {
//                 totalNumContent++;
//                 mapping[bodyContent.paragraph.id] = {
//                     wasMatched: false,
//                     type: null,
//                 };
//             }
//             else if (bodyContent.hasOwnProperty('bullet')) {
//                 //TODO
//                 mapping[bodyContent.bullet.id] = {
//                     wasMatched: false,
//                     type: null,
//                 };
//             }
//         }
//     }

//     if (!Array.isArray(layoutTemplate.page.pageElements)) {
//         return {
//             totalScore: 0,
//             score: {
//                 similarity: 0,
//             },
//             layoutTemplate,
//             stylesTemplate,
//             done,
//             matching,
//             mapping,
//             requests,
//             moreInfo: {
//                 totalNumMapped: 0,
//                 totalNumContent: totalNumContent,
//                 totalNumSlideElements: 0,    
//             },
//         };
//     }

//     let shapeElements = extractShapeElements(layoutTemplate.page);
//     let imageElements = extractImageElements(layoutTemplate.page);

//     let elements = shapeElements.concat(imageElements);

//     const area = (rectangle) => {
//         let width = rectangle.finishX - rectangle.startX;
//         let height = rectangle.finishY - rectangle.startY;
//         let area = width * height;
//         return area;
//     }
    
//     elements.sort((p1, p2) => {
//         return area(p2.rectangle) - area(p1.rectangle);
//     });

//     let totalNumMapped = 0;
//     let totalNumSlideElements = elements.length;

//     let originalStyles = layoutTemplate.getStylesJSON();
//     let targetStyles = stylesTemplate.getStylesJSON();

//     let originalLayout = layoutTemplate.getLayoutJSON();

//     // Fit the header
//     if (content.hasOwnProperty('header')) {
//         let headerPageElement = null;
//         let headerIdx = HEADER_PLACEHOLDER.length + SUBHEADER_PLACEHOLDER.length;
//         for (let pageElement of elements) {
//             if (pageElement.additional.canbeMapped.length < 1
//                 || pageElement.additional.canbeMappedMin > 1
//             ) {
//                 continue;
//             }
            
//             if (HEADER_PLACEHOLDER.includes(pageElement.type)) {
//                 let curIdx = HEADER_PLACEHOLDER.findIndex((el) => el === pageElement.type);
//                 if (headerIdx <= curIdx) {
//                     continue;
//                 }
//                 headerPageElement = pageElement;
//                 headerIdx = curIdx;
//             }
//             if (SUBHEADER_PLACEHOLDER.includes(pageElement.type)) {
//                 let curIdx = SUBHEADER_PLACEHOLDER.findIndex((el) => el === pageElement.type);
//                 curIdx += HEADER_PLACEHOLDER.length;
//                 if (headerIdx <= curIdx) {
//                     continue;
//                 }
//                 headerPageElement = pageElement;
//                 headerIdx = curIdx;    
//             }
//         }
//         if (headerPageElement !== null) {
//             headerPageElement.mapped.push({
//                 paragraph: { 
//                     ...content.header,
//                     isOriginalContent: false,
//                 },
//             });
//             headerPageElement.isHeader = true;
//             totalNumMapped++;
//             mapping[content.header.id] = {
//                 wasMatched: true,
//                 type: headerPageElement.type,
//             };
//         }
//     }

//     if (Array.isArray(content.body)) {
//         let pageElementIdx = 0;
//         for (let i = start; i < content.body.length; i++) {
//             let didMapped = false;
//             let bodyContent = content.body[i];
//             while (pageElementIdx < elements.length) {
//                 let pageElement = elements[pageElementIdx];
//                 let targetLengths = getAppropriateTargetLengths(layoutTemplate.isCustom, pageElement, originalStyles, targetStyles);
//                 let targetLengthIdx = pageElement.mapped.length;
//                 if (targetLengths.length <= targetLengthIdx
//                     || pageElement.additional.canbeMappedMin > (content.body.length - i)
//                     || pageElement.isHeader || didMapped
//                 ) {
//                     pageElementIdx++;
//                     continue;
//                 }
//                 if (bodyContent.hasOwnProperty('paragraph')) {
//                     if (IMAGE_PLACEHOLDER.includes(pageElement.type)) {
//                         if (!Array.isArray(bodyContent.paragraph.images)
//                             //|| !settings.contentControl
//                         ) {
//                             pageElementIdx++;
//                             continue;
//                         }
//                     }
//                     else {
//                         if (settings.contentControl &&
//                             ( !bodyContent.paragraph.hasOwnProperty('singleWord')
//                                 || typeof bodyContent.paragraph.singleWord.text !== 'string'
//                                 || !bodyContent.paragraph.singleWord.hasOwnProperty('score')
//                                 || !bodyContent.paragraph.singleWord.score.hasOwnProperty('importantWords')
//                                 || !bodyContent.paragraph.singleWord.score.hasOwnProperty('grammatical')
//                                 || !bodyContent.paragraph.singleWord.score.hasOwnProperty('semantic')
//                             )
//                         ) {
//                             pageElementIdx++;
//                             continue;
//                         }
//                     }
//                     while (targetLengthIdx < targetLengths.length
//                         && layoutTemplate.isCustom
//                         && settings.contentControl
//                         && targetLengths[targetLengthIdx] <= content.body[i].paragraph.singleWord.text.length
//                     ) {
//                         pageElement.mapped.push({
//                             paragraph: {
//                                 id: null,
//                                 images: [],
//                                 phrases: [],
//                                 shortenings: [],
//                                 singleWord: {
//                                     text: '',
//                                     score: {
//                                         grammatical: 1,
//                                         importantWords: 1,
//                                         semantic: 1,
//                                     },
//                                 },
//                                 isOriginalContent: false,  
//                             },
//                         });
//                         targetLengthIdx++;
//                     }
//                     if (targetLengthIdx >= targetLengths.length) {
//                         pageElementIdx++;
//                         continue;
//                     }
//                     pageElement.mapped.push({
//                         paragraph: {
//                             ...bodyContent.paragraph,
//                             isOriginalContent: false,
//                         },
//                     });
//                     mapping[bodyContent.paragraph.id] = {
//                         wasMatched: true,
//                         type: pageElement.type,
//                     };
//                     didMapped = true;
//                     break;
//                 }
//                 else if (bodyContent.hasOwnProperty('bullet')) {
//                     didMapped = true;
//                     //TODO
//                     break;
//                 }
//             }
//             if (didMapped) {
//                 totalNumMapped++;
//                 done++;
//             }
//             else {
//                 break;
//             }
//         }
//     }

//     for (let pageElement of elements) {
//         let targetLengths = getAppropriateTargetLengths(layoutTemplate.isCustom, pageElement, originalStyles, targetStyles);
//         let currentMatching = {};

//         let originalBox = {};
//         for (let box of originalLayout.boxes) {
//             if (box.objectId === pageElement.objectId) {
//                 originalBox = { ...box };
//                 break;
//             }
//         }


//         // let putOriginalContent = true;
//         // for (let mappedContent of pageElement.mapped) {
//         //     if (mappedContent.paragraph.id !== null
//         //         && typeof mappedContent.paragraph.id === 'string'
//         //     ) {
//         //         putOriginalContent = false;
//         //         break;
//         //     }
//         // }

//         if (settings.putOriginalContent 
//             && pageElement.additional.canbeMapped.length > 0
//             && pageElement.mapped.length === 0
//             && originalBox.hasOwnProperty('originalContents')
//         ) {
//             // put OriginalContent
//             for (let content of originalBox.originalContents) {
//                 pageElement.mapped.push(content);
//             }
//         }
//         if (IMAGE_PLACEHOLDER.includes(pageElement.type)) {
//             currentMatching = fitToImage(settings, pageElement, originalBox, originalStyles, targetStyles);
//         }
//         else {
//             currentMatching = fitToShape(settings, pageElement, originalBox, originalStyles, targetStyles, targetLengths);
//         }

//         let currentContents = currentMatching[pageElement.objectId].contents;

//         for (let currentContent of currentContents) {
//             let mappedContent = {
//                 text: currentContent.text,
//                 score: currentContent.score,
//                 url: currentContent.url,
//                 styles: currentContent.styles,
//             };
//             pageElement.mappedContents.push(mappedContent);
//         }

//         while (pageElement.mappedContents.length > 0) {
//             let n = pageElement.mappedContents.length;
//             if (pageElement.mappedContents[n - 1].text === '') {
//                 pageElement.mappedContents.pop();
//             }
//             else {
//                 break;
//             }
//         }

//         // currentMatching[pageElement.objectId].contents = currentContents.filter((val) => {
//         //     return val.contentId !== null;
//         // });

//         matching = {
//             ...currentMatching,
//             ...matching,
//         };
//     }

//     let score = await scoreElements_withStyles(elements, clusterBrowser);
    
//     for (let pageElement of elements) {
//         if (IMAGE_PLACEHOLDER.includes(pageElement.type)) {
//             requests = requests.concat(initializePageElementImage_withStyles(pageElement));
//         }
//         else {
//             requests = requests.concat(initializePageElementShape_withStyles(pageElement));
//         }
//     }

//     let result = {
//         score: score,
//         layoutTemplate,
//         stylesTemplate,
//         done,
//         content,
//         matching,
//         mapping,
//         requests,
//         moreInfo: {
//             totalNumMapped,
//             totalNumContent,
//             totalNumSlideElements,    
//         }
//     };

//     let totalScore = (result.score.similarity * 4 + result.score.importantWords) / 5;

//     if (totalScore < 0) {
//         totalScore += 10 * (
//             (result.moreInfo.totalNumMapped 
//                 - result.moreInfo.totalNumContent) 
//             + (result.moreInfo.totalNumMapped    
//                 - result.moreInfo.totalNumSlideElements)
//         );
//     }
//     else {
//         let total = Math.max(result.moreInfo.totalNumSlideElements, result.moreInfo.totalNumContent);
//         if (total > 0) {
//             totalScore *= (result.moreInfo.totalNumMapped / total);
//         }
//     }

//     return {
//         totalScore,
//         ...result,
//     };
// }

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
        mapping: result.mapping,
    };
}

module.exports = {
    //tryFitBody_v2, 
    getSingleTemplateResponse_v2,
    fitToPage,
    getMappingPreserveType_DP,
    getMappingArea,
    getMappingNoPreserveType_DP,
};