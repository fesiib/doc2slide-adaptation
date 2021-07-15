export function fitToAllSlides(content, source) {
    if (!Array.isArray(source.slides)) {
        throw Error('There is no slides');
    }
    let globalRequests = [];
    for (let slide of source.slides) {
        console.log(slide);
        if (!Array.isArray(slide.pageElements)) {
            continue;
        }

        let shapeElements = [];
        let imageElements = [];

        for (let pageElement of slide.pageElements) {
            if (!pageElement.hasOwnProperty('shape')
                || !pageElement.shape.hasOwnProperty('text')
                || !Array.isArray(pageElement.shape.text.textElements)
                || pageElement.shape.text.textElements.length !== 2
            ) {
                continue;
            }
            console.log(pageElement.shape.text.textElements[1].textRun.content);
            let info = {};
            try {
                info = JSON.parse(pageElement.shape.text.textElements[1].textRun.content);
            }
            catch(error) {
                console.log(error);
                continue;
            }
            if (info.hasOwnProperty('additional')) {
                globalRequests.push({
                    deleteText: {
                        objectId: pageElement.objectId,
                        textRange: {
                            type: 'ALL',
                        }
                    }
                });
                if (Array.isArray(info.additional.text)
                    && info.additional.text.length > 0    
                ) {
                    // TEXT BOX, 
                    let shape = { ...info };
                    shape.mapped = false;
                    shape.objectId = pageElement.objectId;
                    shapeElements.push(shape);
    
                }
                else if (Array.isArray(info.additional.contentUrl)
                    && info.additional.contentUrl.length > 0
                ) {
                    let image = { ...info };
                    image.mapped = false;
                    image.objectId = pageElement.objectId;
                    imageElements.push(image);
                }
            }
        }

        // Fit the header
        if (content.hasOwnProperty('header') && content.header.length > 0) {
            for (let shape of shapeElements) {
                if (shape.hasOwnProperty('placeholderType')   ) {
                    if (shape.placeholderType === 'HEADER'
                        || shape.placeholderType === 'TITLE'
                        || shape.placeholderType === 'CENTERED_TITLE'
                        || shape.placeholderType === 'SUBTITLE'
                    ) {
                        shape.taken = true;
                        globalRequests.push({
                            insertText: {
                                objectId: shape.objectId,
                                text: content.header,
                                insertionIndex: 0,
                            }
                        });
                        break;
                    }
                }
            }
        }
        
        // Fit the content
        if (content.hasOwnProperty('body') && Array.isArray(content.body)) {
            let contentId = 0;
            for (let shape of shapeElements) {
                if (shape.taken) {
                    continue;
                }
                if (contentId >= content.body.length) {
                    break;
                }
                if (shape.hasOwnProperty('placeholderType')) {
                    if (shape.placeholderType === 'BODY'
                        || shape.placeholderType === 'FOOTER'
                        || shape.placeholderType === 'OBJECT'
                    ) {
                        globalRequests.push({
                            insertText: {
                                objectId: shape.objectId,
                                text: content.body[contentId],
                                insertionIndex: 0,
                            }
                        });
                        contentId++;
                        shape.taken = true;
                    }
                    else {
                        console.log("Cannot fit to shape: ", shape);
                    }
                }
            }
        }
    }
    return globalRequests;
}