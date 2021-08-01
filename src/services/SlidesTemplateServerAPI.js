import { createPresentation } from './DriveAPI';
import { getPresentation, updatePresentation } from './SlidesAPI';

const ADDR = 'http://localhost:7777';


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
                    updatePresentation(newId, response.requests).then(() => {
                        resolve({
                            presentationId: newId,
                        });
                    }).catch((reason) => {
                        reject(reason);
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

export async function generateSlideSingle(referencePresentationId, presentationId, pageNum, targetPageId, resources) {
    return new Promise((resolve, reject) => {
        clearSlideSingleRequests(presentationId, pageNum).then((response) => {
            let clearRequests = response.requests;
            generateSlideSingleRequests(referencePresentationId, targetPageId, resources)
            .then((response) => {
                let requests = clearRequests.concat(response.requests);

                for (let request of requests) {
                    if (request.hasOwnProperty('createSlide')) {
                        request.createSlide.insertionIndex = pageNum;
                    }
                }

                let matching = response.matching;
                let matched = response.matched;
                console.log('Matched:', matched, matching);
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

async function clearSlideSingleRequests(presentationId, pageNum) {
    return new Promise((resolve, reject) => {
        getPresentation(presentationId).then((response) => {
            let requests = [];
            if (response.result.hasOwnProperty('slides')) {
                requests.push({
                    deleteObject: {
                        objectId: response.result.slides[pageNum].objectId,
                    }
                });  
            }
            resolve({
                requests,
            });
        }).catch((reason) => {
            reject(reason);
        });
    });
}