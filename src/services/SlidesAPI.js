import {gapi} from 'gapi-script';
import { createPresentation } from './DriveAPI';
import { fitToAllSlides } from './fitContent';

import {appendPre} from './GoogleAPI';
import {initializePresentation} from './initializeSlide';

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

/**
 * Function that extracts the template and creates slide with the template.
 * 
 * @param {str} forId 
 * @returns 
 */

export async function extract(forId) {

    return new Promise((resolve, reject) => {
        gapi.client.slides.presentations.get({
            presentationId: forId
        }).then(function(response) {
            let title = 'TEMPLATE_' + response.result.title;
            createPresentation(title, (id) => {
                if (id === undefined) {
                    throw Error('Could not create Presentation');
                }
                let requests = initializePresentation(response.result);
                // reject('Testing');
                // return;
                console.log(requests);
                gapi.client.slides.presentations.batchUpdate({
                    presentationId: id,
                    requests: requests,
                }).then((response) => {
                    resolve(id);
                });
            });
        }, function(response) {
            appendPre('Error in extract: ' + response.result.error.message);
        });
    });
}

export async function tryFitContent(content, presentationId) {
    return new Promise((resolve, reject) => {
        gapi.client.slides.presentations.get({
            presentationId,
        }).then(function(response) {
            let requests = fitToAllSlides(content, response.result);

            console.log(requests);
            gapi.client.slides.presentations.batchUpdate({
                presentationId,
                requests,
            }).then((response) => {
                resolve(true);
            }, (response) => {
                reject(response.result.error.messge);
            });
        }, function(response) {
            appendPre('Fit Error' + response.result.error.message);
        });
    });
}