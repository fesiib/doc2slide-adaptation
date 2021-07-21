import { getFirstParagraphMarker, getFirstText } from "./initializeSlide";

export function scoreShapeElements(shapeElements, template) {
    for (let pageElement of shapeElements) {
        if (pageElement.mapped)
            console.log(getFontStyle(pageElement.shape.text));
    }
    return 0.0;
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

function getFontStyle(shapeText) {
    let firstParagraphMarker = getFirstParagraphMarker(shapeText);
    let firstText = getFirstText(shapeText);
    return null;
}

function renderShape(text, fontStyle) {
    return null;
}

function getAbsLineHeight(style) {
    return (this.fontSize * this.fontSize_scale * this.lineHeight);
}

function getContentHeight(element) {
    return element.getBoundingClientRect().height;
}


function getContentWidth(element) {
    return element.getBoundingClientRect().width;
}


function shapeElementCalculateStats(shapeElement) {
    if (!shapeElement.mapped) {
        return {
            allText: '',
            fontStyle: null,
            grammaticalReadability: 1.0,
            numWordsPerLine: [],
            numCharsPerLine: [],
            numLines: 0,
            textLength: 0,
        };
    }

    let fontStyle = getFontStyle(shapeElement.text);
    let content = shapeElement.mappedContent;
    let element = renderShape(content.text, fontStyle);

    let lineHeight = getAbsLineHeight(fontStyle);
    let allText = "";
    let numWordsPerLine = [];
    let numCharsPerLine = [];

    let grammatical = content.score.grammatical;

    if (getContentHeight(element) == 0) {
        return {
            allText: allText,
            fontStyle: fontStyle,
            grammatical: grammatical,
            numWordsPerLine: numWordsPerLine,
            numCharsPerLine: numCharsPerLine,
            numLines: 0,
            textLength: 0,
        };
    }
    let prevInnerHTML = this.inNode.innerHTML;
    
    this.inNode.innerHTML = "";
    let numWords = 0;
    let numChars = 0;
    let startNewLine = true;

    for (let i = 0; i < this.content.length; i++) {
        let part = this.content[i];
        let span = document.createElement("span");
        this.inNode.appendChild(span);
        let style = part.style;
        let seperator = part.seperator;
        let text = part.alternatives[part.which].text;
        if (text == "") {
            continue;
        }
        
        text += seperator;
        allText += text;

        let totalScore = part.alternatives[part.which].totalScore;
        grammatical *= totalScore;
        if (style) {
            span.style = this.fontStyle.highlighted();
        }
        else {
            span.style = this.fontStyle.normal();
        }
        let leftOver = text.split(" ").reverse();
        let prevHeight = this.getContentHeight();
        while (leftOver.length > 0) {
            console.assert(!(leftOver.length == 1 && leftOver[0] == ""));
            if (startNewLine) {
                prevHeight += lineHeight;
            }
            startNewLine = false;
            let curText = leftOver.reverse().join(" ");
            leftOver = [];
            while (true) { 
                let textNode = document.createTextNode(curText);
                span.appendChild(textNode);
                
                let curHeight = this.getContentHeight();
                
                if (Math.round((curHeight - prevHeight) / lineHeight) < 0) {
                    console.log(this.fontStyle);
                    throw new Error("curHeight < prevHeight");
                }
                if (Math.round((curHeight - prevHeight) / lineHeight) == 0) {
                    for (let word of curText.split(" ")) {
                        if (word != "" && word != "\n") {
                            numWords++;
                        }
                    }
                    numChars += curText.length;
                    if (leftOver.length > 0) {
                        startNewLine = true;
                        numWordsPerLine.push(numWords);
                        numCharsPerLine.push(numChars);
                        numWords = 0;
                        numChars = 0;
                    }
                    break;
                }
                else {
                    span.removeChild(textNode);
                    let words = curText.split(" ");
                    if (leftOver.length > 0) {
                        console.assert(words.pop() == "");
                    }
                    leftOver.push(words.pop());
                    if (words.length == 0) {
                        startNewLine = true;
                        numWordsPerLine.push(numWords);
                        numCharsPerLine.push(numChars);
                        numWords = 0;
                        numChars = 0;
                        break;    
                    }
                    curText = words.join(" ") + " ";
                }
            }
        }
    }

    numWordsPerLine.push(numWords);
    numCharsPerLine.push(numChars);
    numWords = 0;
    numChars = 0;

    this.inNode.innerHTML = prevInnerHTML;

    if (this.getNumLines() != numWordsPerLine.length) {
        console.log("Number of lines issues");
        console.log(this.fontStyle.getAbsLineHeight() + " " + this.getContentHeight());
        console.log(allText + " " + JSON.stringify(this.fontStyle));
    }
    //console.log(this.getTextLength());
    return {
        allText: allText,
        fontStyle: this.fontStyle,
        grammatical: grammatical,
        numWordsPerLine: numWordsPerLine,
        numCharsPerLine: numCharsPerLine,
        numLines: numWordsPerLine.length,
        textLength: this.getTextLength(),
        spaceOccupation: (this.getContentHeight() * this.getContentWidth())
            / (this.boxStyle.getContentHeight() * this.boxStyle.getContentWidth()),
    }
}

function calcTextReadabilitySimple(statistics) {
    const FONT_SIZE = statistics.fontStyle.fontSize_pref;
    const FONT_SIZE_std = 15;
    
    const TEXT_LENGTH = statistics.fontStyle.textLength_pref;
    const TEXT_LENGTH_std = 10;
    
    const NUM_LINES = statistics.fontStyle.numLines_pref;
    const NUM_LINES_std = 2;

    const LINE_HEIGHT = 1.8;
    const LETTER_SPACING = 2.0;
    const SPACE_OCCUPATION = 0.65;

    let weightFontSize = 1/7;
    let weightLetterSpacing = 1/7;
    let weightLineHeight = 1/7;
    let weightNumLines = 1/7;
    let weightShape = 1/7;
    let weightTextLength = 1/7;
    let weigthSpaceOccupation = 1/7;

    let valFontSize = normDistributionAround(
        FONT_SIZE,
        Math.min(FONT_SIZE / 2, FONT_SIZE_std),
        statistics.fontStyle.fontSize * statistics.fontStyle.fontSize_scale
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

    let valLetterSpacing = increasingFunc(
        LETTER_SPACING,
        statistics.fontStyle.letterSpacing,
    ) * weightLetterSpacing;
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
        if (prev != 0.0) {
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

    return valFontSize + valTextLength + valNumLines
        + valLetterSpacing + valLineHeight + valSpaceOccupation + valShape;

    // let valFontSize = Math.abs(statistics.fontStyle.fontSize - FONT_SIZE);
    // valFontSize = 1 / (1 + Math.exp(-valFontSize / 6));
    // valFontSize = addWeight(weightFontSize, valFontSize);
    
    // let valLineSpacing = 1 - Math.abs(statistics.fontStyle.lineHeight - LINE_HEIGHT) / LINE_HEIGHT;
    // valLineSpacing = addWeight(weightLineSpacing, valLineSpacing);
    
    // let valLetterSpacing = (statistics.fontStyle.letterSpacing + LETTER_SPACING) / (2 * LETTER_SPACING);
    // valLetterSpacing = addWeight(weightLetterSpacing, valLetterSpacing);
    
    // let valShape = 0.0;

    // let avgCharDiff = 0.0;
    // let maxNumChar = 0.0;
    // let prev = 0.0;
    // for (let numChar of statistics.numCharsPerLine) {
    //     maxNumChar = Math.max(maxNumChar, numChar);
    //     if (prev != 0.0) {
    //         avgCharDiff += Math.abs(numChar - prev);
    //     }
    //     prev = numChar;
    // }
    // if (statistics.numCharsPerLine.length > 1) {
    //     avgCharDiff /= (statistics.numCharsPerLine.length - 1);
    //     valShape = (maxNumChar - avgCharDiff) / maxNumChar;
    // }
    // else {
    //     valShape = 1.0;
    // }

    // valShape = addWeight(weightShape, valShape);

    // let valLines = 1.1 ^ -Math.max(statistics.numLines - NUM_LINES, 0);

    // valLines = addWeight(weightLines, valLines);
    //TextLength
    //let valTextLength = 

    // return valLines * valShape * valLetterSpacing * valLineSpacing * valFontSize;
}

// calcTextReadabilityComplex(statistics) {
//     const FONT_SIZE = 40.0;
//     const FONT_EMPHSIZE = 0.5; /// < 1.0
//     const LINE_SPACING = 1.5;
//     const MAX_LINE_HEIGHT = 2.0;
//     const MIN_LINE_HEIGHT = 1.0;
//     const LETTER_SPACING = 1.0;
//     const NUM_LINES = 5;
//     const NUM_WORDS = 2 //log10
    
    
//     let fontSize = Math.min(statistics.fontStyle.fontSize / FONT_SIZE, 1.0);
//     let fontFamily = 1.0;
//     let fontEmphasize = 0;
//     let fontUnderlineAndItalic = 1.0;
//     let fontUppercaseWords = 0;
//     let fontLineSpacing = 1.0;
//     let fontLetterSpacing = 1.0;
//     let fontKerning = 1.0;
//     let fontTextAlign = 1.0;
//     let shape = 1.0;
//     let lines = 1.0;
//     let bullets = 1.0;
//     let numWords = 1.0;

//     let wfontSize = 1.0/13;
//     let wfontFamily = 1.0/13;
//     let wfontEmphasize = 1.0/13;
//     let wfontUnderlineAndItalic = 1.0/13;
//     let wfontUppercaseWords = 1.0/13;
//     let wfontLineSpacing = 1.0/13;
//     let wfontLetterSpacing = 1.0/13;
//     let wfontKerning = 1.0/13;
//     let wfontTextAlign = 1.0/13;
//     let wshape = 1.0/13;
//     let wlines = 1.0/13;
//     let wbullets = 1.0/13;
//     let wnumWords = 1.0/13;

//     for (let part of this.content) {
//         if (part.style) {
//             fontEmphasize++;
//         }
//     }
//     if (fontEmphasize / this.content.length > FONT_EMPHSIZE) {
//         fontEmphasize = (1.0 - 
//             (fontEmphasize / this.content.length - FONT_EMPHSIZE) / (1.0 - FONT_EMPHSIZE));
//     }
//     else {
//         fontEmphasize = 0.0;
//     }
//     fontEmphasize = 0.7 + fontEmphasize * 0.3;

//     if (statistics.fontStyle.highlightTextDecoration.includes("underline")
//         || statistics.fontStyle.highlightTextDecoration.includes("line-through")
//         || statistics.fontStyle.highlightTextDecoration.includes("overline")
//     ) {
//         fontUnderlineAndItalic -= 0.5;
//     }

//     if (statistics.fontStyle.highlightFontStyle.includes("italic")
//         || statistics.fontStyle.highlightFontStyle.includes("oblique")
//     ) {
//         fontUnderlineAndItalic -= 0.5;
//     }
//     let totalNumWords = 0;
//     for (let word of statistics.allText.split(/\s|\n/)) {
//         let atleast = 0;
//         let isWord = false;
//         for (let ch of word) {
//             if (ch.match(/[A-Z]/)) {
//                 atleast++;
//                 isWord = true;
//             }
//             if (ch.match(/[a-z]/i)) {
//                 isWord = true;
//             }
//         }
//         if (atleast > 2) {
//             fontUppercaseWords++;
//         }
//         if (isWord) {
//             totalNumWords++;
//         }
//     }
//     fontUppercaseWords = 1.0 - fontUppercaseWords / totalNumWords;
//     if (totalNumWords > 0) {
//         numWords = 1.0 - Math.min(Math.log10(totalNumWords) / NUM_WORDS, 1.0);

//         numWords = 0.9 + 0.1 * numWords;
//     }

//     if (statistics.fontStyle.lineHeight < MIN_LINE_HEIGHT) {
//         fontLineSpacing = 1.0 - (LINE_SPACING - statistics.fontStyle.lineHeight) / LINE_SPACING;
//     }
//     if (statistics.fontStyle.lineHeight > MAX_LINE_HEIGHT) {
//         fontLineSpacing = 1.0 - Math.min(statistics.fontStyle.lineHeight - MAX_LINE_HEIGHT, 1.0);
//     }

//     if (statistics.fontStyle.letterSpacing > LETTER_SPACING) {
//         fontLetterSpacing = 1.0 - Math.min(statistics.fontStyle.letterSpacing - LETTER_SPACING, 1.0);
//     }

//     if (statistics.fontStyle.fontKerning == "none") {
//         fontKerning = 0.0;
//     }

//     fontKerning = fontKerning * 0.01 + 0.99;

//     if (statistics.fontStyle.textAlign == "right") {
//         fontTextAlign = 0.0;
//     }

//     fontTextAlign = fontTextAlign * 0.1 + 0.9;
//     let prev = -1;
//     let avgLineDiff = 0.0;
//     for (let chs of statistics.numCharsPerLine) {
//         if (prev == -1) {
//             prev = chs;
//             continue;
//         }
//         if (statistics.fontStyle.textAlign == "center") {
//             avgLineDiff += Math.abs(prev - chs) / 2;
//         }
//         else {
//             avgLineDiff += Math.abs(prev - chs) * 2;
//         }
//         prev = chs;
//     }
//     if (statistics.numLines > 1) {
//         avgLineDiff /= statistics.numLines - 1;
//     }
//     shape = 1.0 - fontSize * (avgLineDiff / (avgLineDiff + 1.0));

//     shape = shape * 0.1 + 0.9;

//     if (statistics.numLines > NUM_LINES) {
//         lines = (statistics.numLines - NUM_LINES) / ((statistics.numLines - NUM_LINES) + 1);
//     }

//     // result.readability = (
//     //     fontSize * wfontSize
//     //     + fontFamily * wfontFamily
//     //     + fontEmphasize * wfontEmphasize
//     //     + fontUnderlineAndItalic * wfontUnderlineAndItalic
//     //     + fontUppercaseWords * wfontUppercaseWords
//     //     + fontLineSpacing * wfontLineSpacing
//     //     + fontLetterSpacing *  wfontLetterSpacing
//     //     + fontKerning * wfontKerning
//     //     + fontTextAlign * wfontTextAlign
//     //     + shape * wshape
//     //     + lines * wlines
//     //     + bullets * wbullets
//     //     + numWords * wnumWords
//     // );

//     let readability = (
//         fontSize
//         * fontFamily
//         * fontEmphasize
//         * fontUnderlineAndItalic
//         * fontUppercaseWords
//         * fontLineSpacing
//         * fontLetterSpacing
//         * fontKerning
//         * fontTextAlign
//         * shape
//         * lines
//         * bullets
//         * numWords
//     )

//     return {
//         fontSize: fontSize,
//         fontFamily: fontFamily,
//         fontEmphasize: fontEmphasize,
//         fontUnderlineAndItalic: fontUnderlineAndItalic,
//         fontUppercaseWords: fontUppercaseWords,
//         fontLineSpacing: fontLineSpacing,
//         fontLetterSpacing: fontLetterSpacing,
//         fontKerning: fontKerning,
//         fontTextAlign: fontTextAlign,
//         shape: shape,
//         lines: lines,
//         bullets: bullets,
//         numWords: numWords,
//         total: readability,
//     }
// }

function calcTextEngagement(statistics) {
    let numQuestions = 0;
    let numAll = 0;
    for (let ch of statistics.allText) {
        if (ch == '?') {
            numQuestions++;
            numAll++;
        }
        else if (ch == '.') {
            numAll++;
        }
        else if (ch == '!') {
            numAll++;
        }
    }
    if (!statistics.allText.trim().endsWith('.')
        && !statistics.allText.trim().endsWith('!')
        && !statistics.allText.trim().endsWith('?')
    ) {
        numAll++;
    }
    return numQuestions / numAll;
}

function calcTextClarity(statistics) {
    let wUsage = 0.33;
    let wEmphasize = 0.33;
    let wGrammar = 0.33
    
    let textUsage = 0;
    let textTotal = 0;
    let textEmphasize = 0;
    for (let part of this.content) {
        if (part.style)
            textEmphasize += part.alternatives[part.which].len;
        textUsage += part.alternatives[part.which].len;
        textTotal += part.alternatives[0].len;
    }
    let clarity = 0.0;
    if (textTotal != 0) {
        clarity = wUsage * (textUsage / textTotal) 
        + wEmphasize * (textEmphasize / textUsage)
        + wGrammar * statistics.grammaticalReadability;
    }
    return clarity;
}