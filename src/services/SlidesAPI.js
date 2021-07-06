import {gapi} from 'gapi-script';

import {appendPre} from './GoogleAPI';

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

export async function extract(forId) {
    return new Promise((resolve, reject) => {
        gapi.client.slides.presentations.get({
            presentationId: forId
        }).then(function(response) {
            const sourceResult = response.result;
            gapi.client.slides.presentations.create({
                title: "TEMPLATE" + sourceResult.title,
            }).then((response) => {
                //Extract the Template From `soureceResult`
                resolve(response.result.presentationId);
            }, (response) => {
                appendPre('Error: ' + response.result.error.message);    
            });
        }, function(response) {
            appendPre('Error: ' + response.result.error.message);
        });
    });
}