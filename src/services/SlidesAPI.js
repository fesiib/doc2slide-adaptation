import { gapi } from 'gapi-script';
import { createPresentation } from './DriveAPI';
import { fitToAllSlides_simple } from './fitContent';

import { appendPre }  from './GoogleAPI';
import { initializePresentation } from './initializeSlide';
import { extractTemplates } from './extractSlide';

/**
 * Prints the number of slides and elements in a sample presentation:
 * https://docs.google.com/presentation/d/19wwZsmNWZYuAKsMeg1x7eXSdxvpH8dnAnN7xQAp5gD4/edit
 */

export function listSlides(presentationId) {

    gapi.client.slides.presentations.get({
        presentationId: presentationId
    }).then(function(response) {
        let presentation = response.result;
        let length = presentation.slides.length;
        appendPre('The presentation contains ' + length + ' slides:');
        for (let i = 0; i < length; i++) {
            let slide = presentation.slides[i];
            appendPre('- Slide #' + (i + 1) + ' contains ' +
                slide.pageElements.length + ' elements.')
        }
    }, function(response) {
        appendPre('Error: ' + response.result.error.message);
    });
}

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

// export async function extract(forId) {

//     return new Promise((resolve, reject) => {
//         gapi.client.slides.presentations.get({
//             presentationId: forId
//         }).then(function(response) {
//             let title = 'TEMPLATE_' + response.result.title;
//             createPresentation(title, (id) => {
//                 if (id === undefined) {
//                     throw Error('Could not create Presentation');
//                 }
//                 let templates = extractTemplates(response.result)
//                 let requests = initializePresentation(templates);
//                 // reject('Testing');
//                 // return;
//                 console.log(requests);
//                 gapi.client.slides.presentations.batchUpdate({
//                     presentationId: id,
//                     requests: requests,
//                 }).then((response) => {
//                     resolve({
//                         id,
//                         templates,
//                     });
//                 });
//             });
//         }, function(response) {
//             appendPre('Error in extract: ' + response.result.error.message);
//         });
//     });
// }

// export async function tryFitContent(content, presentationId, templates, fitContent) {
//     return new Promise((resolve, reject) => {
//         let requests = fitContent(content, templates);

//         console.log(requests);
//         gapi.client.slides.presentations.batchUpdate({
//             presentationId,
//             requests,
//         }).then((response) => {
//             resolve(true);
//         }, (response) => {
//             reject(response.result.error.messge);
//         });
//     });
// }