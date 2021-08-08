import { getPresentation, getPresentationThumbnail } from "./apis/SlidesAPI";

export async function compareAllSlides(originalId, generatedId, matching, sort) {
    return new Promise(async (resolve) => {
        let originalObjectIds = [];
        let generatedObjectIds = [];
        
        let matchingList = [];


        for (let slide of matching) {
            matchingList.push({
                generatedObjectId: slide.objectId,
                pageNum: slide.pageNum,
                originalObjectId: slide.originalId,
                score: slide.totalScore,
            });
        }

        if (sort) {
            matchingList.sort((p1, p2) => (p2.score - p1.score));
        }
        else {
            matchingList.sort((p1, p2) => (p1.pageNum - p2.pageNum));    
        }

        for (let el of matchingList) {
            generatedObjectIds.push(el.generatedObjectId);
            originalObjectIds.push(el.originalObjectId);
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
                title: "Original",
                presentationId: originalId,
                imageLinks: originalResponses.map(value => value.result.contentUrl),
            },
            generated: {
                title: "Adapted",
                presentationId: generatedId,
                imageLinks: generatedResponses.map(value => value.result.contentUrl),
            },
        });
    });
}