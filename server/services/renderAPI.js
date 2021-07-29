const WebFont = require('webfontloader');

const PX = 0.75;

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

async function renderTexts(texts, paragraphStyles, boxStyle) {
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
            lineHeight: lineHeight,
            charWidth: getAbsCharWidth(paragraphStyle, fontStyle),
            numWordsPerLine: numWordsPerLine,
            numCharsPerLine: numCharsPerLine,
            numLines: numWordsPerLine.length,
            textLength: text.length,    
        });
    }

    spaceOccupation /= (getContentHeight(element.outerDiv) * getContentWidth(element.outerDiv));

    document.body.removeChild(element.outerDiv);
    return {
        paragraphs: paragraphs,
        spaceOccupation: spaceOccupation,
        totalLength: totalLength,
    }
}

module.exports = renderTexts;