import { gapi } from 'gapi-script';

export async function getPresentation(presentationId) {
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