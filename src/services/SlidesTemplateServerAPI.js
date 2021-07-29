import { createPresentation } from './DriveAPI';
import { getPresentation, updatePresentation } from './SlidesAPI';

const ADDR = 'http://localhost:2999';


export async function uploadSlides(presentation) {
    const SERVICE = '/slides/upload_slides';

    let data = {
        presentation
    };

    const URL = ADDR + SERVICE;
    
    return new Promise((resolve, reject) => {
        fetch(URL, {
            method: 'POST',
            mode: 'cors',
            //cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            //credentials: 'same-origin', // include, *same-origin, omit
            headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: JSON.stringify(data)
        }).then( (response) => response.json())
            .then((response) => {
                resolve(response);
            })
            .catch((reason) => {
                reject(reason);
            });
    });
}

export async function generateSlideDeckRequests(presentationId, resources) {
    const SERVICE = '/slides/generate_slide_deck_requests';

    let data = {
        presentationId,
        resources,
    };

    const URL = ADDR + SERVICE;
    
    return new Promise((resolve, reject) => {
        fetch(URL, {
            method: 'POST',
            mode: 'cors',
            //cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            //credentials: 'same-origin', // include, *same-origin, omit
            headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: JSON.stringify(data)
        }).then( (response) => response.json())
            .then((response) => {
                resolve(response);
            })
            .catch((reason) => {
                reject(reason);
            });
    });
}

export async function generateSlideSingleRequests(presentationId, pageId, resources) {
    const SERVICE = '/slides/generate_slide_single_requests';

    let data = {
        presentationId,
        pageId,
        resources,
    };

    const URL = ADDR + SERVICE;
    
    return new Promise((resolve, reject) => {
        fetch(URL, {
            method: 'POST',
            mode: 'cors',
            //cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            //credentials: 'same-origin', // include, *same-origin, omit
            headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: JSON.stringify(data)
        }).then( (response) => response.json())
            .then((response) => {
                resolve(response);
            })
            .catch((reason) => {
                reject(reason);
            });
    });
}

/**
 * Function that extracts the template and creates slide with the template.
 * 
 * @param {str} presentationId 
 * @returns 
 */
export async function extract(presentationId) {
    return new Promise((resolve, reject) => {
        getPresentation(presentationId).then((response) => {
            let presentation = response.result;
            let title = 'TEMPLATE_' + presentation.title;
            uploadSlides(presentation).then((response) => {
                console.log('Extraction Result: ', response);
                createPresentation(title, (newId) => {
                    if (newId === undefined) {
                        reject('Creation failed');
                    }
                    resolve({
                        presentationId: newId,
                    });
                });
            });
        });
    });
}

export async function generateSlideDeck(referencePresentationId, presentationId, resources) {
    return new Promise((resolve, reject) => {
        clearSlideDeckRequests(presentationId).then((response) => {
            let clearRequests = response.requests;
            generateSlideDeckRequests(referencePresentationId, resources)
            .then((response) => {
                let requests = clearRequests.concat(response.requests);
                let matching = response.matching;
                console.log('Matching:', matching);
                updatePresentation(presentationId, requests).then((response) => {
                    resolve({
                        response,
                    });
                }).catch((reason) => {
                    reject(reason);
                });
            }).catch((reason) => {
                reject(reason);
            });
        }).catch((reason) => {
            reject(reason);
        });
    });
}

async function clearSlideDeckRequests(presentationId) {
    return new Promise((resolve, reject) => {
        getPresentation(presentationId).then((response) => {
            let requests = [];
            if (response.result.hasOwnProperty('slides')) {
                for (let slide of response.result.slides) {
                    requests.push({
                        deleteObject: {
                            objectId: slide.objectId,
                        }
                    });
                }    
            }
            resolve({
                requests,
            });
        }).catch((reason) => {
            reject(reason);
        });
    });
}