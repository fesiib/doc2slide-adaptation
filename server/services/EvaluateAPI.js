const { getRectangle } = require("./Templates");

const EMU = 1 / 12700;

async function scoreShapeElementsFast(shapeElements) {    
    let statisticsList = [];

    for (let pageElement of shapeElements) {
        statisticsList.push(calculateStatistics(pageElement, null));    
    }

    return {
        readability: 100,
        engagement: calculateTextEngagement(statisticsList),
        grammatical: calculateTextGrammatical(statisticsList),
        semantic: calculateTextSemantic(statisticsList),
        importantWords: calculateTextImportantWords(statisticsList),
        similarity: calculateTextSimilarityFast(statisticsList),
    };
}

async function scoreImageElements(imageElements, browserCluster) {
    return {};
}

async function scoreShapeElements(shapeElements, browserCluster) {    
    let statisticsList = [];

    for (let pageElement of shapeElements) {
        statisticsList.push(calculateStatistics(pageElement, browserCluster));
    }

    statisticsList = await Promise.all(statisticsList);

    return {
        readability: calculateTextReadabilitySimple(statisticsList),
        engagement: calculateTextEngagement(statisticsList),
        grammatical: calculateTextGrammatical(statisticsList),
        semantic: calculateTextSemantic(statisticsList),
        importantWords: calculateTextImportantWords(statisticsList),
        similarity: calculateTextSimilarity(statisticsList),
    };
}

function calculateTextReadabilitySimple(statisticsList) {
    let totalScore = 0;
    let totalLength = 0;
    for (let statistics of statisticsList) {
        let score = single_calculateTextReadabilitySimple(statistics);
        totalScore += score * statistics.totalLength;
        totalLength += statistics.totalLength;
    }
    if (totalLength > 0)
        totalScore /= totalLength;
    return Math.round(totalScore * 10000) / 100;
}

function calculateTextEngagement(statisticsList) {
    let totalScore = 0;
    for (let statistics of statisticsList) {
        let score = single_calculateTextEngagement(statistics);
        totalScore += score;
    }
    if (statisticsList.length > 0)
        totalScore /= statisticsList.length;
    return Math.round(totalScore * 10000) / 100;
}

function calculateTextGrammatical(statisticsList) {
    let totalScore = 1;
    for (let statistics of statisticsList) {
        let score = 1;
        for (let single of statistics.scores) {
            score *= single.grammatical;
        }
        totalScore *= score;
    }
    return Math.round(totalScore * 10000) / 100;
}

function calculateTextSemantic(statisticsList) {
    let totalScore = 1;
    for (let statistics of statisticsList) {
        let score = 1;
        for (let single of statistics.scores) {
            score *= single.semantic;
        }
        totalScore *= score;
    }
    return Math.round(totalScore * 10000) / 100;
}

function calculateTextImportantWords(statisticsList) {
    let totalScore = 1;
    for (let statistics of statisticsList) {
        let score = 1;
        for (let single of statistics.scores) {
            score *= single.importantWords;
        }
        totalScore *= score;
    }
    return Math.round(totalScore * 10000) / 100;
}

function calculateTextSimilarity(statisticsList) {
    let totalDiff = 0;
    let totalArea = 0;
    for (let statistics of statisticsList) {
        let result = getAreaDiff(statistics);
        totalDiff += result.areaDiff;
        totalArea += result.originalArea;
        //console.log('Top: ', statistics, result.originalArea, result.areaDiff);
    }
    let totalScore = 0;
    if (totalArea > 0) {
        totalScore = (1 - totalDiff / totalArea);
    }

    return Math.round(totalScore * 10000) / 100;
}

function calculateTextSimilarityFast(statisticsList) {
    return 100;
}

function consumeRGBColor(rgbColor) {
    let ret = {
        red: 0,
        green: 0,
        blue: 0,
    };
    if (rgbColor.hasOwnProperty('red'))
        ret.red = rgbColor.red;
    if (rgbColor.hasOwnProperty('green'))
        ret.green = rgbColor.green;
    if (rgbColor.hasOwnProperty('blue'))
        ret.blue = rgbColor.blue;
    return ret;
}

function consumeWeightedFontFamily(weightedFontFamily) {
    if (typeof weightedFontFamily === 'object') {
        return weightedFontFamily;
    }
    return null;
}

function consumeOptionalColor(optionalColor) {
    if (typeof optionalColor === 'object') {
        if (optionalColor.hasOwnProperty('opaqueColor')) {
            if (optionalColor.opaqueColor.hasOwnProperty('rgbColor')) {
                let rgbColor = consumeRGBColor(optionalColor.opaqueColor.rgbColor);
                return 'rgb(' + rgbColor.red + ', ' + rgbColor.green + ', ' + rgbColor.blue + ')';
            }
            else if (optionalColor.opaqueColor.hasOwnProperty('themeColor')) {
                if (optionalColor.opaqueColor.themeColor.startsWith('DARK'))
                    return 'black';
                else
                    return 'gray';
            }
        }
    }
    return null;
}

function consumeFontSize(fontSize) {
    if (typeof fontSize === 'object') {
        if (fontSize.hasOwnProperty('unit')) {
            if (fontSize.hasOwnProperty('magnitude')) {
                if (fontSize.unit === 'PT') {
                    return fontSize.magnitude;
                }
                else if (fontSize.unit === 'EMU') {
                    return fontSize.magnitude * EMU;
                }
                else {
                    return null;
                }
            }
        }
    }
    return null;
}


function getParagraphStyle(paragraphStyle, bulletStyle) {
    if (typeof paragraphStyle !== 'object') {
        paragraphStyle = {};
    }
    if (typeof bulletStyle !== 'object') {
        bulletStyle = {};
    }
    if (paragraphStyle.hasOwnProperty('direction') 
        && paragraphStyle.direction !== 'LEFT_TO_RIGHT'
    ) {
            throw Error("text is not left to right");
    }

    let paddingLeft = 0;
    if (consumeFontSize(paragraphStyle.indentStart)) {
        let magnitude = consumeFontSize(paragraphStyle.indentStart);
        paddingLeft += magnitude;
    }

    let paddingRight = 0;
    if (consumeFontSize(paragraphStyle.indentEnd)) {
        let magnitude = consumeFontSize(paragraphStyle.indentEnd);
        paddingRight += magnitude;
    }

    let paddingBottom = 0;
    if (consumeFontSize(paragraphStyle.spaceBelow)) {
        let magnitude = consumeFontSize(paragraphStyle.spaceBelow);
        paddingBottom += magnitude;
    }

    let paddingTop = 0;
    if (consumeFontSize(paragraphStyle.spaceAbove)) {
        let magnitude = consumeFontSize(paragraphStyle.spaceAbove);
        paddingTop += magnitude;
    }

    let collapseLists = false;

    if (paragraphStyle.hasOwnProperty('spacingMode')
        && paragraphStyle.spacingMode === 'COLLAPSE_LISTS'
    ) {
        collapseLists = true;
    }

    let textAlign = 'left';
    if (paragraphStyle.hasOwnProperty('alignment')) {
        if (paragraphStyle.alignment === 'END') {
            textAlign = 'right';    
        }
        if (paragraphStyle.alignment === 'CENTER') {
            textAlign = 'center';    
        }
        if (paragraphStyle.alignment === 'JUSTIFIED') {
            textAlign = 'justified';    
        }
    }

    let textIndent = 0;
    if (consumeFontSize(paragraphStyle.indentFirstLine)) {
        let magnitude = consumeFontSize(paragraphStyle.indentFirstLine);
        textIndent = (magnitude - paddingLeft);
    }

    let lineHeight = 'normal';
    if (paragraphStyle.hasOwnProperty('lineSpacing')) {
        lineHeight = paragraphStyle.lineSpacing;
    }

    let glyph = '';
    let isListElement = false;
    if (bulletStyle.hasOwnProperty('listId')) {
        isListElement = true;
        if (bulletStyle.hasOwnProperty('glyph')) {
            glyph = bulletStyle.glyph;
        }    
        textIndent = 0;
    }

    return {
        paddingLeft,
        paddingRight,
        paddingBottom,
        paddingTop,
        textAlign,
        textIndent,
        lineHeight,
        collapseLists,
        glyph,
        isListElement,
    };
}

function getFontStyle(textStyle) {
    let weightedFontFamily = consumeWeightedFontFamily(textStyle.weightedFontFamily);

    let backgroundColor = 'transparent';
    let color = 'transparent';
    let fontSize = 16;
    let fontFamily = 'Arial';
    let fontWeight = 400;

    if (consumeOptionalColor(textStyle.backgroundColor) !== null) {
        backgroundColor = consumeOptionalColor(textStyle.backgroundColor);
    }
    if (consumeOptionalColor(textStyle.foregroundColor) !== null) {
        color = consumeOptionalColor(textStyle.foregroundColor);
    }
    else {
        throw Error('no color');
    }
    if (consumeFontSize(textStyle.fontSize) !== null) {
        let magnitude = consumeFontSize(textStyle.fontSize);
        fontSize = magnitude;
    }
    else {
        throw Error('no font size');
    }
    if (weightedFontFamily !== null && weightedFontFamily.hasOwnProperty('fontFamily')) {
        fontFamily = weightedFontFamily.fontFamily;
    }
    else {
        throw Error('no fontFamily');
    }
    if (weightedFontFamily !== null && weightedFontFamily.hasOwnProperty('weight')) {
        fontWeight = weightedFontFamily.weight;
    }

    let fontStyle = 'normal';
    if (textStyle.italic) {
        fontStyle = 'italic';
    }
    
    let textDecoration = 'none';
    if (textStyle.strikethrough) {
        textDecoration = 'line-through';
    }
    if (textStyle.underline) {
        textDecoration = 'underline';
        if (textStyle.strikethrough) {
            textDecoration += ' line-through';
        }
    }

    let baselineShift = 'baseline';
    if (textStyle.baselineOffset === 'SUPERSCRIPT') {
        baselineShift = 'super';
    }
    if (textStyle.bselineOffset === 'SUBSCRIPT') {
        baselineShift = 'sub';
    }

    let fontVariant = 'normal';
    if (textStyle.smallCaps) {
        fontVariant = 'small-caps';
    }

    let letterSpacing = 'normal';
    let fontKerning = 'auto';

    return {
        backgroundColor,
        color,
        fontSize,
        fontFamily,
        fontWeight,
        fontStyle,
        textDecoration,
        baselineShift,
        fontVariant,
        letterSpacing,
        fontKerning,
    };
}

function getBoxStyle(pageElement) {
    let rectangle = getRectangle(pageElement.size, pageElement.transform);

    let width = (rectangle.finishX - rectangle.startX) * EMU;
    let height = (rectangle.finishY - rectangle.startY) * EMU;
    
    let alignItems = 'flex-start';
    if (pageElement.shape.hasOwnProperty('shapeProperties')
        && pageElement.shape.shapeProperties.hasOwnProperty('contentAlignment')
    ) {
        let contentAlignment = pageElement.shape.shapeProperties.contentAlignment;
        if (contentAlignment === 'MIDDLE') {
            alignItems = 'center'
        }
        if (contentAlignment === 'BOTTOM') {
            alignItems = 'flex-end';
        }
    }

    return {
        alignItems,
        width,
        height,
        position: {
            x: rectangle.startX,
            y: rectangle.startY,
        },
    };
}

function getParagraphTexts(pageElement) {
    if (!pageElement.hasOwnProperty('shape')
        || !pageElement.shape.hasOwnProperty('text')
        || !Array.isArray(pageElement.shape.text.textElements)
    ) {
        return [];
    }
    let textElements = pageElement.shape.text.textElements;
    
    let paragraphContents = [];
    let text = '';
    for (let i = 0; i < textElements.length; i++) {
        const textElement = textElements[i];
        if (textElement.hasOwnProperty('paragraphMarker')) {
            if (i > 0) {
                if (text.endsWith('\n')) {
                    text = text.slice(0, text.length - 1);
                }
                paragraphContents.push(text);
                text = '';
            }
        }
        if (textElement.hasOwnProperty('textRun') && textElement.textRun.hasOwnProperty('content')) {
            text += textElement.textRun.content;
        }
        if (textElement.hasOwnProperty('autoText') && textElement.autoText.hasOwnProperty('content')) {
            text += textElement.autoText.content;
        }
    }
    if (textElements.length > 0) {
        if (text.endsWith('\n')) {
            text = text.slice(0, text.length - 1);
        }
        paragraphContents.push(text);
    }
    return paragraphContents;
}

function getDominantTextStyle(textStyle, textElements, start, L, R) {
    if (L > R) {
        return textStyle;
    }
    let cntStyle = {};
    let dominantStyle = '{}';
    for (let i = start + 1; i < textElements.length; i++) {
        const textElement = textElements[i];
        let l = 0;
        let r = 0;
        if (textElement.hasOwnProperty('startIndex')) {
            l = textElement.startIndex;
        }
        if (textElement.hasOwnProperty('endIndex')) {
            r = textElement.endIndex;
        }

        if (l < L) {
            throw Error('Text Element crosses paragraph');
        }
        if (r > R) {
            break;
        }
        if (textElement.hasOwnProperty('textRun') && textElement.textRun.hasOwnProperty('style')) {
            let styleStr = JSON.stringify({ ...textStyle, ...textElement.textRun.style });
            if (!cntStyle.hasOwnProperty(styleStr)) {
                cntStyle[styleStr] = 0;
            }
            if (textElement.textRun.hasOwnProperty('content'))
                cntStyle[styleStr] += textElement.textRun.content.length;    
            dominantStyle = styleStr;
        }
        else if (textElement.hasOwnProperty('autoText') && textElement.autoText.hasOwnProperty('style')) {
            let styleStr = JSON.stringify({ ...textStyle, ...textElement.autoText.style });
            if (!cntStyle.hasOwnProperty(styleStr)) {
                cntStyle[styleStr] = 0;
            }
            cntStyle[styleStr] += 1;
            dominantStyle = styleStr;
        }
    }
    for (let style in cntStyle) {
        if (cntStyle[dominantStyle] < cntStyle[style]) {
            dominantStyle = style;
        }
    }
    return JSON.parse(dominantStyle);
}

function getParagraphStyles(pageElement) {
    if (!pageElement.hasOwnProperty('shape')
        || !pageElement.shape.hasOwnProperty('text')
        || !Array.isArray(pageElement.shape.text.textElements)
    ) {
        return [];
    }
    const textElements = pageElement.shape.text.textElements;
    
    let paragraphStyles = [];
    for (let i = 0; i < textElements.length; i++) {
        const textElement = textElements[i];
        if (textElement.hasOwnProperty('paragraphMarker')) {
            let paragraph = {};

            let bullet = {};
            let style = {};

            let listId = null;
            let nestingLevel = 0;
            if (textElement.paragraphMarker.hasOwnProperty('bullet')) {
                bullet = { ...textElement.paragraphMarker.bullet };
                if (textElement.paragraphMarker.bullet.hasOwnProperty('listId')) {
                    listId = textElement.paragraphMarker.bullet.listId;
                }
                if (textElement.paragraphMarker.bullet.hasOwnProperty('nestingLevel')) {
                    nestingLevel = textElement.paragraphMarker.bullet.nestingLevel;
                }
            }
            if (textElement.paragraphMarker.hasOwnProperty('style')) {
                style = { ...textElement.paragraphMarker.style };
            }
            paragraph.style = getParagraphStyle(style, bullet);
            
            let l = 0;
            let r = 0;
            if (textElement.hasOwnProperty('startIndex'))
                l = textElement.startIndex;
            if (textElement.hasOwnProperty('endIndex')) {
                r = textElement.endIndex;
            }
            let textStyle = {};
            if (listId !== null) {
                textStyle = pageElement.shape.text.lists[listId].nestingLevel[nestingLevel].bulletStyle;
                if (typeof textStyle !== 'object') {
                    textStyle = {};
                }
            }
            
            textStyle = getDominantTextStyle(textStyle, textElements, i, l, r);
            try {
                paragraph.fontStyle = getFontStyle(textStyle);
            }
            catch(error) {
                console.log('Error in Font Style extraction with: ', textStyle, error);
                continue;
            }
            paragraphStyles.push(paragraph);
        }
    }

    for (let i = 1; i < paragraphStyles.length; i++) {
        if (paragraphStyles[i].style.isListElement && paragraphStyles[i - 1].style.isListElement) {
            if (paragraphStyles[i].style.collapseLists)
                paragraphStyles[i].style.paddingTop = 0;
            if (paragraphStyles[i - 1].style.collapseLists)
                paragraphStyles[i - 1].style.paddingBottom = 0;
        }
    }

    return paragraphStyles;
}

async function calculateStatistics(pageElement, browserCluster) {
    let paragraphStyles = getParagraphStyles(pageElement);
    let boxStyle = getBoxStyle(pageElement);

    let originalTexts = getParagraphTexts(pageElement);
    let texts = pageElement.mappedContents.map((val, idx) => val.text);
    let scores = pageElement.mappedContents.map((val, idx) => val.score);

    let result = null;

    if (browserCluster === null) {
        result = [];
    }
    else {
        let statistics = browserCluster.execute( async ({page}) => {
            await page.goto('about:blank');
            await page.addScriptTag({path: './bundles/renderBundle.js', type: 'text/javascript'});
            page.on('console', (msg) => console.log('Puppeteer PAGELOG Generated: ', msg.text()));
        
            return page.evaluate(
                (texts, paragraphStyles, boxStyle) => {
                    return window.renderTexts(texts, paragraphStyles, boxStyle);
                }, texts, paragraphStyles, boxStyle
            );
        });
        let originalStatistics = browserCluster.execute( async ({page}) => {
            await page.goto('about:blank');
            await page.addScriptTag({path: './bundles/renderBundle.js', type: 'text/javascript'});
            page.on('console', (msg) => console.log('Puppeteer PAGELOG Original: ', msg));
        
            return page.evaluate(
                (originalTexts, paragraphStyles, boxStyle) => {
                    return window.renderTexts(originalTexts, paragraphStyles, boxStyle);
                }, originalTexts, paragraphStyles, boxStyle
            );
        });
    
        result = await Promise.all([statistics, originalStatistics]);
    }

    return {
        ...result[0],
        boxStyle: boxStyle,
        scores: scores,
        originalStatistics: result[1],
    };
}

function increasingFunc(mx, x) {
    if (x > mx) {
        return 1.0;
    }
    return (x - (x * x) / (2 * mx)) / (mx / 2);
}

function __normal(mean, std, x) {
    return 1 / (std * Math.sqrt(2 * Math.PI)) * Math.exp((-1 / 2) * ((x - mean) / std) * ((x - mean) / std));
}

function normDistributionAround(mean, std, x) {
    const maxValue = __normal(mean, std, mean);
    return __normal(mean, std, x) / maxValue;
}



function single_calculateTextReadabilitySimple(statistics) {
    const FONT_SIZE = 20;
    const FONT_SIZE_std = 15;

    const TEXT_LENGTH_std = 10;
    
    const NUM_LINES = 6;
    const NUM_LINES_std = 2;

    const LINE_HEIGHT = 1.8;
    const SPACE_OCCUPATION = 0.65;

    let result = 0;

    for (let paragraph of statistics.paragraphs) {
        const TEXT_LENGTH = paragraph.textLength;

        let weightFontSize = 1/5;
        let weightLineHeight = 1/5;
        let weightNumLines = 1/5;
        let weightShape = 1/5;
        let weightTextLength = 1/5;

        let valFontSize = normDistributionAround(
            FONT_SIZE,
            Math.min(FONT_SIZE / 2, FONT_SIZE_std),
            paragraph.fontStyle.fontSize
        ) * weightFontSize;
        let valTextLength = normDistributionAround(
            TEXT_LENGTH,
            Math.min(TEXT_LENGTH / 2, TEXT_LENGTH_std),
            paragraph.textLength,
        ) * weightTextLength;
        
        let valNumLines = normDistributionAround(
            NUM_LINES,
            Math.min(NUM_LINES_std, NUM_LINES / 2),
            paragraph.numLines,
        ) * weightNumLines;

        let valLineHeight = increasingFunc(
            LINE_HEIGHT,
            paragraph.paragraphStyle.lineHeight,
        ) * weightLineHeight;

        let valShape = 0.0;

        let avgCharDiff = 0.0;
        let maxNumChar = 0.0;
        let prev = 0.0;
        for (let numChar of paragraph.numCharsPerLine) {
            maxNumChar = Math.max(maxNumChar, numChar);
            if (prev !== 0.0) {
                avgCharDiff += Math.abs(numChar - prev);
            }
            prev = numChar;
        }
        if (paragraph.numCharsPerLine.length > 1) {
            avgCharDiff /= (paragraph.numCharsPerLine.length - 1);
            valShape = (maxNumChar - avgCharDiff) / maxNumChar;
        }
        else {
            valShape = 1.0;
        }
        valShape = valShape * weightShape;

        let valSum = (valFontSize + valTextLength + valNumLines + valLineHeight + valShape);

        result += valSum * (paragraph.textLength / statistics.totalLength);
    }
    

    let weigthSpaceOccupation = 1/6;

    let valSpaceOccupation = increasingFunc(
        SPACE_OCCUPATION,
        statistics.spaceOccupation,
    ) * weigthSpaceOccupation;

    return (result * (1 - weigthSpaceOccupation)) + valSpaceOccupation;
}

function single_calculateTextEngagement(statistics) {
    let cntSentences = 0;
    let cntQuestions = 0;
    for (let paragraph of statistics.paragraphs) {
        let sentences = paragraph.contentText.match(/[^?!.][?!.]/g);
        let questions = paragraph.contentText.match(/[^?!.][?]/g);

        if (Array.isArray(sentences))
            cntSentences += sentences.length;
        if (Array.isArray(questions))
            cntQuestions += questions.length;
    }

    if (cntSentences === 0) {
        cntSentences = 1;
    }

    return cntQuestions / cntSentences;
}

function getAreaDiff(statistics) {
    let k = Math.max(statistics.paragraphs.length, statistics.originalStatistics.paragraphs.length);

    let areaDiff = 0;
    let originalArea = 0;

    for (let j = 0; j < k; j++) {
        let addToOriginalArea = -1;

        let curParagraph = null;
        let oriParagraph = null;
        if (j < statistics.paragraphs.length) {
            curParagraph = { ...statistics.paragraphs[j] };
        }
        if (j < statistics.originalStatistics.paragraphs.length) {
            oriParagraph = { ...statistics.originalStatistics.paragraphs[j] };
            addToOriginalArea = 1;
        }

        if (oriParagraph === null) {
            oriParagraph = {numCharsPerLine: []};
        }

        if (curParagraph === null) {
            addToOriginalArea = 0;
            curParagraph = { ...oriParagraph };
            oriParagraph = {numCharsPerLine: []};
        }
        let lineHeight = curParagraph.lineHeight;
        let charWidth = curParagraph.charWidth;
        let n = Math.max(curParagraph.numCharsPerLine.length, oriParagraph.numCharsPerLine.length);
        let curAreaDiff = 0;
        for (let i = 0; i < n; i++) {
            let cur = 0;
            let original = 0;
            if (i < curParagraph.numCharsPerLine.length) {
                cur = curParagraph.numCharsPerLine[i] * lineHeight * charWidth;
            }
            if (i < oriParagraph.numCharsPerLine.length) {
                original = oriParagraph.numCharsPerLine[i] * lineHeight * charWidth;
            }

            if (addToOriginalArea === 1) {
                originalArea += original;
            }
            if (addToOriginalArea === 0) {
                originalArea += cur;
            }

            curAreaDiff += Math.abs(original - cur);
        }
        //console.log('Bottom', curParagraph, oriParagraph, curAreaDiff);
        areaDiff += curAreaDiff;
    }
    //console.log(areaDiff, originalArea, statistics.paragraphs, statistics.originalStatistics.paragraphs);
    return {
        areaDiff,
        originalArea
    };
}
module.exports = {
    scoreShapeElements,
    getDominantTextStyle,
    scoreImageElements,
};
