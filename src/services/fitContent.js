import Templates from './Templates';

export function fitToAllSlides(content, templates) {
    console.log(content, templates);
    if (!(templates instanceof Templates)) {
        throw Error(templates + 'not instance of Templates');
    }

    let globalRequests = [];
    for (let template of templates.getTemplates()) {
        let slide = template.page;
        if (!Array.isArray(slide.pageElements)) {
            continue;
        }

        let shapeElements = [];
        let imageElements = [];

        for (let pageElement of slide.pageElements) {
            if (pageElement.hasOwnProperty('additional')) {
                if (pageElement.hasOwnProperty('shape')) {
                    globalRequests.push({
                        insertText: {
                            objectId: pageElement.objectId,
                            text: 'TEXT_BOX',
                            insertionIndex: 0,
                        }
                    });
                    
                    globalRequests.push({
                        deleteText: {
                            objectId: pageElement.objectId,
                            textRange: {
                                type: 'ALL',
                            }
                        }
                    });
                    let shape = JSON.parse(JSON.stringify(pageElement.shape));
                    shape.mapped = false;
                    shape.objectId = pageElement.objectId;
                    shapeElements.push(shape);
                }
                else if (pageElement.hasOwnProperty('image')) {
                    let image = JSON.parse(JSON.stringify(pageElement.image));
                    image.mapped = false;
                    image.objectId = pageElement.objectId;
                    imageElements.push(image);
                }
            }
        }

        // Fit the header
        if (content.hasOwnProperty('header') && content.header.length > 0) {
            for (let shape of shapeElements) {
                if (shape.hasOwnProperty('placeholder')
                    && shape.placeholder.hasOwnProperty('type')
                ) {
                    if (shape.placeholder.type === 'HEADER'
                        || shape.placeholder.type === 'TITLE'
                        || shape.placeholder.type === 'CENTERED_TITLE'
                        || shape.placeholder.type === 'SUBTITLE'
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
                if (shape.hasOwnProperty('placeholder')
                    && shape.placeholder.hasOwnProperty('type')
                ) {
                    if (shape.placeholder.type === 'BODY'
                        || shape.placeholder.type === 'FOOTER'
                        || shape.placeholder.type === 'OBJECT'
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