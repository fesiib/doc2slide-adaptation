import WebFont from "webfontloader";
import { getFirstParagraphMarker, getFirstText } from "./initializeSlide";
import { getRectangle } from "./Templates";

const EMU = 1 / 12700;
const PX = 0.75;

export function scoreShapeElements(shapeElements, template) {
    let score = 0.0;
    let total = 0.0;
    for (let pageElement of shapeElements) {
        if (pageElement.mapped) {
            let statistics = calculateStatistics(pageElement);

            let readability = calculateTextReadabilitySimple(statistics);
            let engagement = calculateTextEngagement(statistics);
            let grammatical = statistics.contentScore.grammatical;
            let semantic = statistics.contentScore.semantic;
            let importantWords = statistics.contentScore.importantWords;

            score += readability + grammatical + semantic + importantWords;
            total += 4;
        }
    }
    if (total === 0) {
        total = 1;
    }
    return (score / total) * 100;
}

function addWeight(weight, value) {
    return value * weight + (1.0 - weight);
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

function boxStyleToCSS(boxStyle) {
    return (
        " display: flex;"
        + " align-items: " + boxStyle.alignItems + ";"
        + " height: " + boxStyle.height.toString() + "pt;"
        + " width: " + boxStyle.width.toString() + "pt;"
        + " padding-left: " + boxStyle.paddingLeft.toString() + "pt;"
        + " padding-right: " + boxStyle.paddingRight.toString() + "pt;"
        + " padding-top: " + boxStyle.paddingTop.toString() + "pt;"
        + " padding-bottom: " + boxStyle.paddingBottom.toString() + "pt;"
        + " overflow: visible;"

        + " border: solid black 1pt; "
    );
}

function getBoxStyle(pageElement) {
    let rectangle = getRectangle(pageElement.size, pageElement.transform);
    
    let firstParagraphMarker = getFirstParagraphMarker(pageElement.shape.text);
    let paragraphStyle = {};

    if (firstParagraphMarker.hasOwnProperty('paragraphMarker')
        && firstParagraphMarker.paragraphMarker.hasOwnProperty('style')
    ) {
        paragraphStyle = firstParagraphMarker.paragraphMarker.style;
    }

    if (paragraphStyle.hasOwnProperty('direction') 
        && paragraphStyle.direction !== 'LEFT_TO_RIGHT'
    ) {
            throw Error("text is not left to right");
    }

    let paddingLeft = 0;
    if (consumeFontSize(paragraphStyle.indentStart)) {
        let magnitude = consumeFontSize(paragraphStyle.indentStart);
        paddingLeft = magnitude;
    }

    let paddingRight = 0
    if (consumeFontSize(paragraphStyle.indentEnd)) {
        let magnitude = consumeFontSize(paragraphStyle.indentEnd);
        paddingRight = magnitude;
    }

    let paddingBottom = 0;
    if (consumeFontSize(paragraphStyle.spaceBelow)) {
        let magnitude = consumeFontSize(paragraphStyle.spaceBelow);
        paddingBottom = magnitude;
    }

    let paddingTop = 0;
    if (consumeFontSize(paragraphStyle.spaceAbove)) {
        let magnitude = consumeFontSize(paragraphStyle.spaceAbove);
        paddingTop = magnitude;
    }

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

    let boxStyle = {
        alignItems,
        paddingLeft,
        paddingRight,
        paddingBottom,
        paddingTop,
        width,
        height,
        position: {
            x: rectangle.startX,
            y: rectangle.startY,
        },
    };
    return boxStyle;
}

function fontStyleToCSS(fontStyle, maxWidth) {
    return (
        "display: inline;"
        + " max-width: " + maxWidth.toString() + "pt;"
        + " overflow-wrap: break-word;"
        + " white-space: break-spaces;"
        + " background-color: " + fontStyle.backgroundColor + ";"
        + " color: " + fontStyle.color + ";"
        + " font-size: " + fontStyle.fontSize.toString() + "pt;"
        + " font-family: " + fontStyle.fontFamily + ";"
        + " font-weight: " + fontStyle.fontWeight.toString() + ";"
        + " font-style: " + fontStyle.fontStyle + ";"
        + " text-decoration: " + fontStyle.textDecoration + ";"
        //+ " baseline-shift: " + fontStyle.baselineShift + ";"
        + " font-variant: " + fontStyle.fontVariant + ";"
        + " line-height: " + fontStyle.lineHeight.toString() + "%;"
        + " letter-spacing: " + fontStyle.letterSpacing + ";"
        + " font-kerning: " + fontStyle.fontKerning + ";"
        + " text-align: " + fontStyle.textAlign + ";"
        + " text-indent: " + fontStyle.textIndent.toString() + "pt;"
    );
}

function getFontStyle(shapeText) {
    let firstText = getFirstText(shapeText);
    let firstParagraphMarker = getFirstParagraphMarker(shapeText);
    
    let textStyle = {};
    let paragraphStyle = {};

    if (firstParagraphMarker.hasOwnProperty('paragraphMarker')
        && firstParagraphMarker.paragraphMarker.hasOwnProperty('style')
    ) {
        paragraphStyle = firstParagraphMarker.paragraphMarker.style;
    }

    if (paragraphStyle.hasOwnProperty('direction') 
        && paragraphStyle.direction !== 'LEFT_TO_RIGHT'
    ) {
            throw Error("text is not left to right");
    }

    if (firstText.hasOwnProperty('textRun')
        && firstText.textRun.hasOwnProperty('style')
    ) {
        textStyle = firstText.textRun.style;
    }

    if (firstText.hasOwnProperty('autoText')
        && firstText.autoText.hasOwnProperty('style')
    ) {
        textStyle = firstText.autoText.style;
    }
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

    let lineHeight = 'normal';
    if (paragraphStyle.hasOwnProperty('lineSpacing')) {
        lineHeight = paragraphStyle.lineSpacing;
    }

    let letterSpacing = 'normal';
    let fontKerning = 'normal';

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
        textIndent = magnitude;
    }

    let retFontStyle = {
        backgroundColor,
        color,
        fontSize,
        fontFamily,
        fontWeight,
        fontStyle,
        textDecoration,
        baselineShift,
        fontVariant,
        lineHeight,
        letterSpacing,
        fontKerning,
        textAlign,
        textIndent,
    }
    return retFontStyle;
}

function shapeToDOM(fontStyle, boxStyle) {
    WebFont.load({
        google: {
            families: [fontStyle.fontFamily],
        }
    });
    
    let outerDiv = document.createElement('div');
    outerDiv.setAttribute('style', boxStyleToCSS(boxStyle));
    let innerDiv = document.createElement('div');

    let maxWidth = boxStyle.width - boxStyle.paddingLeft - boxStyle.paddingRight;

    innerDiv.setAttribute('style', fontStyleToCSS(fontStyle, maxWidth));

    outerDiv.appendChild(innerDiv);
    return {
        outerDiv,
        innerDiv,
    };
}

function isInWord(ch) {
    return ch.match(/\w/g);
}

function isWhiteSpace(ch) {
    return ch.match(/\s/g);
}

function getAbsLineHeight(fontStyle) {
    return (fontStyle.fontSize * (fontStyle.lineHeight / 100));
}

function getContentHeight(element) {
    return element.getBoundingClientRect().height * PX;
}


function getContentWidth(element) {
    return element.getBoundingClientRect().width * PX;
}


function calculateStatistics(pageElement) {
    if (!pageElement.mapped) {
        return {
            contentText: '',
            fontStyle: null,
            boxStyle: null,
            contentScore: {
                grammatical: 1,
                semantic: 1,
                importantWords: 1,
            },
            numWordsPerLine: [],
            numCharsPerLine: [],
            numLines: 0,
            textLength: 0,
        };
    }

    let fontStyle = getFontStyle(pageElement.shape.text);
    let boxStyle = getBoxStyle(pageElement);
    let content = pageElement.mappedContent;
    let element = shapeToDOM(fontStyle, boxStyle);
    document.body.appendChild(element.outerDiv);
    let lineHeight = getAbsLineHeight(fontStyle);
    let numWordsPerLine = [];
    let numCharsPerLine = [];
    let numWords = 0;
    let numChars = 0;
    
    let inWord = false;
    let startedWithWhiteSpace = false;
    element.innerDiv.innerHTML = content.text.charAt(0);
    inWord = isInWord(content.text.charAt(0));
    numChars++;
    startedWithWhiteSpace = isWhiteSpace(content.text.charAt(0));

    for (let i = 1; i < content.text.length; i++) {
        let ch = content.text.charAt(i);
        let prevHeight = getContentHeight(element.innerDiv);
        element.innerDiv.innerHTML += ch;
        let curHeight = getContentHeight(element.innerDiv);
        if ((curHeight - prevHeight) >= lineHeight / 2) {
            //start of the newline
            
            let toNextLine = 0;

            if (!startedWithWhiteSpace && inWord && numWords === 0) {
                numWords += inWord;
                inWord = false;
            }
            else if (inWord) {
                let j = i - 1;
                while (j >= 0 && isInWord(content.text.charAt(j))) {
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

    let spaceOccupation = (getContentHeight(element.innerDiv) * getContentWidth(element.innerDiv))
                            / (getContentHeight(element.outerDiv) * getContentWidth(element.outerDiv));

    document.body.removeChild(element.outerDiv);
    return {
        contentText: content.text,
        fontStyle: fontStyle,
        boxStyle: boxStyle,
        contentScore: content.score,
        numWordsPerLine: numWordsPerLine,
        numCharsPerLine: numCharsPerLine,
        numLines: numWordsPerLine.length,
        textLength: content.text.length,
        spaceOccupation: spaceOccupation,
    };
}

function calculateTextReadabilitySimple(statistics) {
    const FONT_SIZE = 20;
    const FONT_SIZE_std = 15;
    
    const TEXT_LENGTH = statistics.textLength;
    const TEXT_LENGTH_std = 10;
    
    const NUM_LINES = 6;
    const NUM_LINES_std = 2;

    const LINE_HEIGHT = 1.8;
    const SPACE_OCCUPATION = 0.65;

    let weightFontSize = 1/6;
    let weightLineHeight = 1/6;
    let weightNumLines = 1/6;
    let weightShape = 1/6;
    let weightTextLength = 1/6;
    let weigthSpaceOccupation = 1/6;

    let valFontSize = normDistributionAround(
        FONT_SIZE,
        Math.min(FONT_SIZE / 2, FONT_SIZE_std),
        statistics.fontStyle.fontSize
    ) * weightFontSize;
    let valTextLength = normDistributionAround(
        TEXT_LENGTH,
        Math.min(TEXT_LENGTH / 2, TEXT_LENGTH_std),
        statistics.textLength,
    ) * weightTextLength;
    
    let valNumLines = normDistributionAround(
        NUM_LINES,
        Math.min(NUM_LINES_std, NUM_LINES / 2),
        statistics.numLines,
    ) * weightNumLines;

    let valLineHeight = increasingFunc(
        LINE_HEIGHT,
        statistics.fontStyle.lineHeight,
    ) * weightLineHeight;

    let valSpaceOccupation = increasingFunc(
        SPACE_OCCUPATION,
        statistics.spaceOccupation,
    ) * weigthSpaceOccupation;

    let valShape = 0.0;

    let avgCharDiff = 0.0;
    let maxNumChar = 0.0;
    let prev = 0.0;
    for (let numChar of statistics.numCharsPerLine) {
        maxNumChar = Math.max(maxNumChar, numChar);
        if (prev !== 0.0) {
            avgCharDiff += Math.abs(numChar - prev);
        }
        prev = numChar;
    }
    if (statistics.numCharsPerLine.length > 1) {
        avgCharDiff /= (statistics.numCharsPerLine.length - 1);
        valShape = (maxNumChar - avgCharDiff) / maxNumChar;
    }
    else {
        valShape = 1.0;
    }
    valShape = valShape * weightShape;

    return valFontSize + valTextLength + valNumLines + valLineHeight + valSpaceOccupation + valShape;
}

function calculateTextEngagement(statistics) {
    let sentences = statistics.contentText.match(/[^?!.][?!.]/g);
    let questions = statistics.contentText.match(/[^?!.][?]/g);

    let cntSentences = 0;
    let cntQuestions = 0;
    if (Array.isArray(sentences))
        cntSentences = sentences.length;
    if (Array.isArray(questions))
        cntQuestions = questions.length;

    if (cntSentences === 0) {
        cntSentences = 1;
    }
    return cntQuestions / cntSentences;
}