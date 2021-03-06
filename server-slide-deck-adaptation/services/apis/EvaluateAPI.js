const { fastRenderTexts } = require("./fastRenderAPI");
const { getRectangle,
    IMAGE_PLACEHOLDER,
    SLIDE_NUMBER_PLACEHOLDER,
    consumeRGBColor,
    getParagraphTexts,
    getParagraphTextStyles,
    stylesToTextStyle,
} = require("../Template");

const EMU = 1 / 12700;

async function scoreElements_withStyles(elements, browserCluster) {    
    let statisticsList = [];

    for (let pageElement of elements) {
        if (IMAGE_PLACEHOLDER.includes(pageElement.type)
            || SLIDE_NUMBER_PLACEHOLDER.includes(pageElement.type)
        ) {
            continue;
        }
        else {
            statisticsList.push(getCombinedStatistics(pageElement, browserCluster, 1));
        }
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

async function scoreElements(elements, browserCluster) {    
    let statisticsList = [];

    for (let pageElement of elements) {
        if (IMAGE_PLACEHOLDER.includes(pageElement.type)
            || SLIDE_NUMBER_PLACEHOLDER.includes(pageElement.type)
        ) {
            continue;
        }
        else {
            statisticsList.push(getCombinedStatistics(pageElement, browserCluster, 0));
        }
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
                if (optionalColor.opaqueColor.themeColor.startsWith('DARK')
                    || optionalColor.opaqueColor.themeColor.startsWith('TEXT')
                )
                    return 'black';
                else
                    return 'gray';
            }
        }
    }
    return null;
}

function consumeFontSize(fontSize, def) {
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
                    return def;
                }
            }
        }
    }
    return def;
}


function getParagraphStyle(paragraphStyle) {
    if (typeof paragraphStyle !== 'object') {
        paragraphStyle = {};
    }
    if (paragraphStyle.hasOwnProperty('direction') 
        && paragraphStyle.direction !== 'LEFT_TO_RIGHT'
    ) {
            throw Error("text is not left to right");
    }

    let paddingLeft = 0;
    if (consumeFontSize(paragraphStyle.indentStart, 0)) {
        let magnitude = consumeFontSize(paragraphStyle.indentStart, 0);
        paddingLeft += magnitude;
    }

    let paddingRight = 0;
    if (consumeFontSize(paragraphStyle.indentEnd, 0)) {
        let magnitude = consumeFontSize(paragraphStyle.indentEnd, 0);
        paddingRight += magnitude;
    }

    let paddingBottom = 0;
    if (consumeFontSize(paragraphStyle.spaceBelow, 0)) {
        let magnitude = consumeFontSize(paragraphStyle.spaceBelow, 0);
        paddingBottom += magnitude;
    }

    let paddingTop = 0;
    if (consumeFontSize(paragraphStyle.spaceAbove, 0)) {
        let magnitude = consumeFontSize(paragraphStyle.spaceAbove, 0);
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
    if (consumeFontSize(paragraphStyle.indentFirstLine, 0)) {
        let magnitude = consumeFontSize(paragraphStyle.indentFirstLine, 0);
        textIndent = (magnitude - paddingLeft);
    }

    let lineHeight = 115;
    if (paragraphStyle.hasOwnProperty('lineSpacing')) {
        lineHeight = paragraphStyle.lineSpacing;
    }

    let isListElement = false;
    if (paragraphStyle.hasOwnProperty('bulletPreset')) {
        isListElement = true;
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
        isListElement,
    };
}

function getFontStyle(textStyle) {
    let weightedFontFamily = consumeWeightedFontFamily(textStyle.weightedFontFamily);

    let backgroundColor = 'transparent';
    let color = 'transparent';
    let fontSize = 14;
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
    if (consumeFontSize(textStyle.fontSize, fontSize) !== null) {
        let magnitude = consumeFontSize(textStyle.fontSize, fontSize);
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

function getParagraphStyles_withStyles(pageElement) {
    let allStyles = pageElement.mappedContents.map((val, idx) => val.styles);

    let paragraphStyles = [];
    
    for (let styles of allStyles) {
        let {
            paragraphStyle,
            textStyle,
        } = stylesToTextStyle(styles);
        paragraphStyles.push({
            style: getParagraphStyle(paragraphStyle),
            fontStyle: getFontStyle(textStyle),
        });
    }

    return paragraphStyles;
}

function getParagraphStyles(pageElement) {
    if (!pageElement.hasOwnProperty('shape')
        || !pageElement.shape.hasOwnProperty('text')
        || !Array.isArray(pageElement.shape.text.textElements)
    ) {
        return [];
    }
    let paragraphStyles = [];
    let paragraphs = getParagraphTextStyles(pageElement);
    for (let { paragraphStyle, textStyle } of paragraphs) {
        let paragraph = {
            style: {},
            fontStyle: {},
        };
        paragraph.style = getParagraphStyle(paragraphStyle);
        try {
            paragraph.fontStyle = getFontStyle(textStyle);
        }
        catch(error) {
            console.log('Error in Font Style extraction with: ', textStyle, error);
            continue;
        }
        paragraphStyles.push(paragraph);
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

async function getCombinedStatistics(pageElement, browserCluster, type) {
    let paragraphStyles = getParagraphStyles(pageElement);
    let boxStyle = getBoxStyle(pageElement);

    let originalTexts = getParagraphTexts(pageElement);
    let texts = pageElement.mappedContents.map((val, idx) => val.text);
    let scores = pageElement.mappedContents.map((val, idx) => val.score);

    let results = [];

    if (type === 0) {
        results.push(calculateStatistics(texts, scores, paragraphStyles, boxStyle, browserCluster));
        results.push(calculateStatistics(originalTexts, scores, paragraphStyles, boxStyle, browserCluster));
    }
    else {
        results.push(calculateStatistics(texts, scores, getParagraphStyles_withStyles(pageElement), boxStyle, browserCluster));
        results.push(calculateStatistics(originalTexts, scores, paragraphStyles, boxStyle, browserCluster));    
    }

    results = await Promise.all(results);
    //console.log(results[0], results[1]);

    return {
        ...results[0],
        originalStatistics: results[1],
    };
}

async function calculateStatistics(texts, scores, paragraphStyles, boxStyle, browserCluster) {

    let result = null;

    if (browserCluster === null) {
        result = await fastRenderTexts(texts, paragraphStyles, boxStyle);
    }
    else {
        result = await browserCluster.execute( async ({page}) => {
            await page.goto('about:blank');
            await page.addScriptTag({path: './bundles/renderBundle.js', type: 'text/javascript'});
            page.on('console', (msg) => console.log('Puppeteer PAGELOG Generated: ', msg.text()));
        
            return page.evaluate(
                (texts, paragraphStyles, boxStyle) => {
                    return window.renderTexts(texts, paragraphStyles, boxStyle);
                }, texts, paragraphStyles, boxStyle
            );
        });
    }

    return {
        ...result,
        scores: scores,
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
    if (std === 0) {
        if (mean === x) {
            return 1;
        }
        return 0;
    }
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
        if (paragraph.numCharsPerLine.length > 1 && maxNumChar > 0.0) {
            avgCharDiff /= (paragraph.numCharsPerLine.length - 1);
            valShape = (maxNumChar - avgCharDiff) / maxNumChar;
        }
        else {
            valShape = 1.0;
        }
        valShape = valShape * weightShape;

        let valSum = (valFontSize + valTextLength + valNumLines + valLineHeight + valShape);
        if (statistics.totalLength > 0)
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
            oriParagraph = {
                numCharsPerLine: [],
                lineHeight: 0,
                charWidth: 0,
            };
        }

        if (curParagraph === null) {
            addToOriginalArea = 0;
            curParagraph = { ...oriParagraph };
            oriParagraph = {
                numCharsPerLine: [],
                lineHeight: 0,
                charWidth: 0,
            };
        }
        let n = Math.max(curParagraph.numCharsPerLine.length, oriParagraph.numCharsPerLine.length);
        let curAreaDiff = 0;
        for (let i = 0; i < n; i++) {
            let cur = 0;
            let original = 0;
            if (i < curParagraph.numCharsPerLine.length) {
                cur = curParagraph.numCharsPerLine[i] * curParagraph.lineHeight * curParagraph.charWidth;
            }
            if (i < oriParagraph.numCharsPerLine.length) {
                original = oriParagraph.numCharsPerLine[i] * oriParagraph.lineHeight * oriParagraph.charWidth;
            }

            if (addToOriginalArea === 1) {
                originalArea += original;
            }
            if (addToOriginalArea === 0) {
                originalArea += cur;
            }

            curAreaDiff += Math.abs(original - cur);
        }
        areaDiff += curAreaDiff;
    }
    return {
        areaDiff,
        originalArea
    };
}
module.exports = {
    scoreElements,
    scoreElements_withStyles,
};