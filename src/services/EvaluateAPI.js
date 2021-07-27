import WebFont from "webfontloader";
import { getRectangle } from "./Templates";

const EMU = 1 / 12700;
const PX = 0.75;

export function scoreShapeElements(shapeElements, pageSize) {
    let statisticsList = [];

    for (let pageElement of shapeElements) {
        if (pageElement.mapped) {
            const statistics = calculateStatistics(pageElement);
            //console.log(statistics);
            statisticsList.push(statistics);    
        }
    }

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

function createTextNode(text) {
    return document.createTextNode(text);
}

function boxStyleToCSS(boxStyle) {
    return (
        " display: flex;"
        + " flex-direction: " + "column;"
        + " justify-content: " + boxStyle.alignItems + ";"
        + " height: " + boxStyle.height.toString() + "pt;"
        + " width: " + boxStyle.width.toString() + "pt;"
        + " padding-left: " + "7.2pt;"
        + " padding-right: " + "7.2pt;"
        + " padding-top: " + "7.2pt;"
        + " padding-bottom: " + "7.2pt;"
        + " overflow: visible;"
        + " border: solid black 1pt; "
    );
}

function paragraphStyleToCSS(paragraphStyle, maxWidth) {
    let mainStyle = ("display: inline;"
        + " white-space: break-spaces;"
        + " line-height: " + paragraphStyle.lineHeight.toString() + "%;"
        + " text-align: " + paragraphStyle.textAlign + ";"
        + " text-indent: " + paragraphStyle.textIndent.toString() + "pt;"
        + " padding-left: " + paragraphStyle.paddingLeft.toString() + "pt;"
        + " padding-right: " + paragraphStyle.paddingRight.toString() + "pt;"
        + " padding-top: " + paragraphStyle.paddingTop.toString() + "pt;"
        + " padding-bottom: " + paragraphStyle.paddingBottom.toString() + "pt;"
    );

    if (maxWidth === null) {
        return mainStyle;
    }
    return (
        mainStyle
        + " max-width: " + maxWidth.toString() + "pt;"
        + " overflow-wrap: break-word;"
    );
}

function fontStyleToCSS(fontStyle) {
    return (" background-color: " + fontStyle.backgroundColor + ";"
        + " color: " + fontStyle.color + ";"
        + " font-size: " + fontStyle.fontSize.toString() + "pt;"
        + " font-family: " + fontStyle.fontFamily + ";"
        + " font-weight: " + fontStyle.fontWeight.toString() + ";"
        + " font-style: " + fontStyle.fontStyle + ";"
        + " text-decoration: " + fontStyle.textDecoration + ";"
        //+ " baseline-shift: " + fontStyle.baselineShift + ";"
        + " font-variant: " + fontStyle.fontVariant + ";"
        + " letter-spacing: " + fontStyle.letterSpacing + ";"
        + " font-kerning: " + fontStyle.fontKerning + ";"
    );
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
        if (textElement.hasOwnProperty('paragraphMarker') && text.length > 0) {
            paragraphContents.push(text);
            text = '';
        }
        if (textElement.hasOwnProperty('textRun') && textElement.textRun.hasOwnProperty('content')) {
            text += textElement.textRun.content;
        }
        if (textElement.hasOwnProperty('autoText') && textElement.autoText.hasOwnProperty('content')) {
            text += textElement.autoText.content;
        }
    }
    if (text.length > 0) {
        paragraphContents.push(text);
    }
    return paragraphContents;
}

function getDominantTextStyle(textStyle, textElements, start, L, R) {
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
            paragraph.fontStyle = getFontStyle(textStyle);
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

function shapeToDOM(paragraphStyles, boxStyle) {
    for (let paragraph of paragraphStyles) {
        WebFont.load({
            google: {
                families: [paragraph.fontStyle.fontFamily],
            }
        });
    }
    
    let outerDiv = document.createElement('div');
    outerDiv.setAttribute('style', boxStyleToCSS(boxStyle));
    let innerDivs = [];

    for (let paragraph of paragraphStyles) {
        let maxWidth = boxStyle.width + paragraph.style.paddingLeft + paragraph.style.paddingRight - 14.4;
        let innerDiv = document.createElement('div');
        innerDiv.setAttribute('style', 
            paragraphStyleToCSS(paragraph.style, maxWidth) 
            + fontStyleToCSS(paragraph.fontStyle)
        );
        innerDivs.push(innerDiv);
    }
    return {
        outerDiv,
        innerDivs,
    };
}

function isInWord(ch) {
    let result = ch.match(/\w/g);
    if (!Array.isArray(result)) {
        return false;
    }
    if (result.length === 0) {
        return false;
    }
    return true;
}

function isWhiteSpace(ch) {
    let result = ch.match(/\s/g);
    if (!Array.isArray(result)) {
        return false;
    }
    if (result.length === 0) {
        return false;
    }
    return true;
}

function getAbsLineHeight(paragraphStyle, fontStyle) {
    return (fontStyle.fontSize * (paragraphStyle.lineHeight / 100));
}

function getAbsCharWidth(paragraphStyle, fontStyle) {
    let div = document.createElement('div');
    div.setAttribute('style', 
        paragraphStyleToCSS(paragraphStyle, null) 
        + fontStyleToCSS(fontStyle)
    );
    document.body.appendChild(div);
    let alphabet = "abcdefghijklmnopqrstuvwxyz";
    let text = alphabet + alphabet.toUpperCase() + " ";
    div.appendChild(createTextNode(text));
    let ret = getContentWidth(div) / text.length;
    document.body.removeChild(div);
    return ret;
}

function getContentHeight(element) {
    return element.getBoundingClientRect().height * PX;
}

function getContentWidth(element) {
    return element.getBoundingClientRect().width * PX;
}

function renderTexts(texts, paragraphStyles, boxStyle) {
    let element = shapeToDOM(paragraphStyles, boxStyle);
    document.body.appendChild(element.outerDiv);

    let spaceOccupation = 0;
    let totalLength = 0;
    let paragraphs = [];
    let n = Math.min(texts.length, paragraphStyles.length);
    for (let i = 0; i < n; i++) {
        const fontStyle = paragraphStyles[i].fontStyle;
        const paragraphStyle = paragraphStyles[i].style;
        const text = texts[i];
        const innerDiv = element.innerDivs[i];

        element.outerDiv.appendChild(innerDiv);

        let lineHeight = getAbsLineHeight(paragraphStyle, fontStyle);
        let numWordsPerLine = [];
        let numCharsPerLine = [];
        let numWords = 0;
        let numChars = 0;
        
        let inWord = false;
        let startedWithWhiteSpace = false;
        innerDiv.innerHTML = '';
        innerDiv.appendChild(createTextNode(text.charAt(0)));
        inWord = isInWord(text.charAt(0));
        numChars++;
        startedWithWhiteSpace = isWhiteSpace(text.charAt(0));

        for (let i = 1; i < text.length; i++) {
            let ch = text.charAt(i);
            let prevHeight = getContentHeight(innerDiv);
            innerDiv.appendChild(createTextNode(ch));
            let curHeight = getContentHeight(innerDiv);
            if ((curHeight - prevHeight) >= lineHeight / 2) {
                //start of the newline
                
                let toNextLine = 0;

                if (!startedWithWhiteSpace && inWord && numWords === 0) {
                    numWords += inWord;
                    inWord = false;
                }
                else if (inWord) {
                    let j = i - 1;
                    while (j >= 0 && isInWord(text.charAt(j))) {
                        j--;
                    }
                    toNextLine = (i - j - 1);
                }
                
                numWordsPerLine.push(numWords);
                numCharsPerLine.push(numChars - toNextLine);

                numWords = 0;
                numChars = toNextLine;
                if (toNextLine === 0) {
                    startedWithWhiteSpace = isWhiteSpace(ch);
                }
                else {
                    startedWithWhiteSpace = false;
                }
            }
            else {
                if (curHeight !== prevHeight) {
                    console.log('ERROR', curHeight, prevHeight, lineHeight);
                }
            }
            if (isInWord(ch)) {
                inWord = true;
            }
            else {
                numWords += inWord;
                inWord = false;
            }
            numChars++;
        }

        numWordsPerLine.push(numWords + inWord);
        numCharsPerLine.push(numChars);
        
        spaceOccupation += (getContentHeight(innerDiv) * getContentWidth(innerDiv));
        totalLength += text.length;

        paragraphs.push({
            fontStyle: fontStyle,
            paragraphStyle: paragraphStyle,
            contentText: text,
            numWordsPerLine: numWordsPerLine,
            numCharsPerLine: numCharsPerLine,
            numLines: numWordsPerLine.length,
            textLength: text.length,    
        });
    }

    spaceOccupation /= (getContentHeight(element.outerDiv) * getContentWidth(element.outerDiv));

    //document.body.removeChild(element.outerDiv);
    return {
        paragraphs: paragraphs,
        spaceOccupation: spaceOccupation,
        totalLength: totalLength,
    }
}

function calculateStatistics(pageElement) {
    if (!pageElement.mapped) {
        return {
            boxStyle: null,
            paragraphs: [],
            spaceOccupation: 0,
            totalLength: 0,
            originalStatistics: {
                paragraphs: [],
                spaceOccupation: 0,
                totalLength: 0,
            }
        }
    }

    let paragraphStyles = getParagraphStyles(pageElement);
    let boxStyle = getBoxStyle(pageElement);

    let originalTexts = getParagraphTexts(pageElement);
    let texts = pageElement.mappedContents.map((val, idx) => val.text);
    let scores = pageElement.mappedContents.map((val, idx) => val.score);
    
    let statistics = renderTexts(texts, paragraphStyles, boxStyle);
    let originalStatistics = renderTexts(originalTexts, paragraphStyles, boxStyle);

    return {
        ...statistics,
        boxStyle: boxStyle,
        scores: scores,
        originalStatistics: originalStatistics,
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
        let lineHeight = getAbsLineHeight(curParagraph.paragraphStyle, curParagraph.fontStyle);
        let charWidth = getAbsCharWidth(curParagraph.paragraphStyle, curParagraph.fontStyle);
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
    return {
        areaDiff,
        originalArea
    };
}