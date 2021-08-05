import { getPresentation, getPresentationThumbnail } from "./apis/SlidesAPI";

export async function compareAllSlides(originalId, originalTemplates, generatedId) {
    return new Promise((resolve) => {
        let originalObjectIds = [];
        let generatedObjectIds = [];

        for (let id of originalTemplates.__customTemplateIds) {
            let template = originalTemplates.__templates[id];
            originalObjectIds.push(template.originalId);
        }

        getPresentation(generatedId).then(async (response) => {
            let slides = response.result.slides;
            for (let slide of slides) {
                generatedObjectIds.push(slide.objectId);
            }
            let originalSessions = [];
            let generatedSessions = [];
            for (let id of originalObjectIds) {
                originalSessions.push(getPresentationThumbnail(originalId, id));
            }
            for (let id of generatedObjectIds) {
                generatedSessions.push(getPresentationThumbnail(generatedId, id));
            }
            let originalResponses = await Promise.all(originalSessions);
            let generatedResponses = await Promise.all(generatedSessions);
            console.log(originalResponses, generatedResponses);
            resolve({
                original: {
                    title: originalTemplates.title,
                    presentationId: originalId,
                    imageLinks: originalResponses.map(value => value.result.contentUrl),
                },
                generated: {
                    title: '(Adapted) ' + originalTemplates.title,
                    presentationId: generatedId,
                    imageLinks: generatedResponses.map(value => value.result.contentUrl),
                },
            });
        });
    });
}