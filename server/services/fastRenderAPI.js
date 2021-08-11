function getAbsLineHeight(paragraphStyle, fontStyle) {
    return (fontStyle.fontSize * (paragraphStyle.lineHeight / 100));
}

function getAbsCharWidth(paragraphStyle, fontStyle) {
    return fontStyle.fontSize * 0.6;
}

function fastRenderTexts(texts, paragraphStyles, boxStyle) {
    let spaceOccupation = 0;
    let totalLength = 0;
    let paragraphs = [];
    let n = Math.min(texts.length, paragraphStyles.length);
    for (let i = 0; i < n; i++) {
        const fontStyle = paragraphStyles[i].fontStyle;
        const paragraphStyle = paragraphStyles[i].style;
        const text = texts[i];
        
        let lineHeight = getAbsLineHeight(paragraphStyle, fontStyle);
        let charWidth = getAbsCharWidth(paragraphStyle, fontStyle);
        let numWordsPerLine = [];
        let numCharsPerLine = [];
        
        if (text === '') {
            paragraphs.push({
                fontStyle: fontStyle,
                paragraphStyle: paragraphStyle,
                contentText: text,
                lineHeight: lineHeight,
                charWidth: charWidth,
                numWordsPerLine: [],
                numCharsPerLine: [],
                numLines: 0,
                textLength: text.length,    
            });
            continue;
        }

        numWordsPerLine.push(text.split(' ').length);
        numCharsPerLine.push(text.length);
        
        spaceOccupation += lineHeight * charWidth * text.length;
        totalLength += text.length;

        paragraphs.push({
            fontStyle: fontStyle,
            paragraphStyle: paragraphStyle,
            contentText: text,
            lineHeight: lineHeight,
            charWidth: charWidth,
            numWordsPerLine: numWordsPerLine,
            numCharsPerLine: numCharsPerLine,
            numLines: numWordsPerLine.length,
            textLength: text.length,    
        });
    }

    spaceOccupation /= boxStyle.width * boxStyle.height;

    return {
        paragraphs: paragraphs,
        spaceOccupation: spaceOccupation,
        totalLength: totalLength,
    }
}
    
module.exports = {
    fastRenderTexts,
};
    