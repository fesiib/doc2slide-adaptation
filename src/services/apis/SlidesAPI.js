import { gapi } from 'gapi-script';

export async function getPresentation(presentationId) {
    if (presentationId === null) {
        return {
            result: null,
        };
    }

    return gapi.client.slides.presentations.get({
        presentationId,
    });
}

export async function updatePresentation(presentationId, requests) {
   return gapi.client.slides.presentations.batchUpdate({
        presentationId,
        requests,
    });
}

export async function getPresentationThumbnail(presentationId, pageObjectId) {
    const thumbnailProperties = {
        thumbnailSize: 'MEDIUM',
    };
    return gapi.client.slides.presentations.pages.getThumbnail({
        presentationId,
        pageObjectId,
        thumbnailProperties,
    });
}