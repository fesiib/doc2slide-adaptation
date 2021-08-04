import { createPresentation } from './DriveAPI';
import { getPresentation, updatePresentation } from './SlidesAPI';

//const ADDR = 'http://server.hyungyu.com:7777';
const ADDR = 'http://localhost:7777';


export async function uploadPresentation(presentation) {
    const SERVICE = '/slides/upload_presentation';

    let data = {
        presentation
    };

    const URL = ADDR + SERVICE;
    
    const request = {
        method: 'POST',
        mode: 'cors',
        //cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        //credentials: 'same-origin', // include, *same-origin, omit
        headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify(data)
    };

    return new Promise((resolve, reject) => {
        fetch(URL, request).then( (response) => response.json())
            .then((response) => {
                resolve(response);
            })
            .catch((reason) => {
                reject(reason);
            });
    });
}

export async function generatePresentationRequests(presentationId, resources) {
    const SERVICE = '/slides/generate_presentation_requests';

    let data = {
        presentationId,
        resources,
    };

    const URL = ADDR + SERVICE;
    
    const request = {
        method: 'POST',
        mode: 'cors',
        //cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        //credentials: 'same-origin', // include, *same-origin, omit
        headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify(data)
    };

    return new Promise((resolve, reject) => {
        fetch(URL, request).then( (response) => response.json())
            .then((response) => {
                resolve(response);
            })
            .catch((reason) => {
                reject(reason);
            });
    });
}

export async function generateSlideRequests(presentationId, pageId, insertionIndex, resources) {
    const SERVICE = '/slides/generate_slide_requests';

    let data = {
        presentationId,
        pageId,
        insertionIndex,
        resources,
    };

    const URL = ADDR + SERVICE;
    
    const request = {
        method: 'POST',
        mode: 'cors',
        //cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        //credentials: 'same-origin', // include, *same-origin, omit
        headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify(data)
    };

    return new Promise((resolve, reject) => {
        fetch(URL, request).then( (response) => response.json())
            .then((response) => {
                resolve(response);
            })
            .catch((reason) => {
                reject(reason);
            });
    });
}

export async function testPresentation(presentationId, copies, resources) {
    return new Promise((resolve, reject) => {
        getPresentation(presentationId).then((response) => {
            let presentation = response.result;
            let titleSuffix = 'test_template_' + presentation.title;
            let testSessions = [];
            uploadPresentation(presentation).then((response) => {
                for (let copy = 1; copy <= copies; copy++) {
                    let title = copy.toString() + '_' + titleSuffix;
                    testSessions.push(
                        new Promise((resolve_inner, reject_inner) => {
                            createPresentation(title).then((response) => {
                                let newId = response.presentationId;
                                if (newId === undefined) {
                                    reject_inner('Creation failed');
                                }
                                clearPresentationRequests(newId).then((response) => {
                                    let clearRequests = response.requests;
                                    generatePresentationRequests(presentationId, resources)
                                    .then((response) => {
                                        let requests = clearRequests.concat(response.requests);
                                        let matching = response.matching;
                                        console.log('Matching:', title, matching);
                                        updatePresentation(newId, requests).then((response) => {
                                            resolve_inner({
                                                response,
                                            });
                                        });
                                    });
                                });
                            });
                        })
                    );
                }
                Promise.all(testSessions).then((response) => {
                    resolve(response);
                })
            });
        });
    })
}

export async function justUploadPresentation(presentationId) {
    return new Promise((resolve) => {
        getPresentation(presentationId).then((response) => {
            let presentation = response.result;
            let title = 'TEMPLATE_' + presentation.title;
            uploadPresentation(presentation).then((response) => {
                console.log('Extraction Result: ', response);
                resolve(true);
            });
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
            uploadPresentation(presentation).then((response) => {
                console.log('Extraction Result: ', response);
                let requests = response.requests;
                createPresentation(title).then((response) => {
                    let newId = response.presentationId;
                    if (newId === undefined) {
                        reject('Creation failed');
                    }
                    clearPresentationRequests(newId).then((response) => {
                        requests = requests.concat(response.requests);
                        updatePresentation(newId, requests).then(() => {
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
    });
}

export async function generatePresentation(referencePresentationId, presentationId, resources) {
    return new Promise((resolve, reject) => {
        clearPresentationRequests(presentationId).then((response) => {
            let clearRequests = response.requests;
            generatePresentationRequests(referencePresentationId, resources)
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

export async function generateSlide(referencePresentationId, presentationId, pageNum, targetPageId, resources) {
    return new Promise((resolve, reject) => {
        clearSlideRequests(presentationId, pageNum).then((response) => {
            let clearRequests = response.requests;
            generateSlideRequests(referencePresentationId, targetPageId, pageNum, resources)
            .then((response) => {
                let requests = clearRequests.concat(response.requests);
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

async function clearPresentationRequests(presentationId) {
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

async function clearSlideRequests(presentationId, pageNum) {
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