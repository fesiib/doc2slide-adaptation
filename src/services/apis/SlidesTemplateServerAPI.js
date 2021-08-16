import { getPresentation } from './SlidesAPI';

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
        settings: {
            fast: true,
            contentControl: true,
            method: 'greedy',
        },
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

export async function generateSlideRequests(presentationId, targetPageId, sourcePageId, pageNum, resources) {
    const SERVICE = '/slides/generate_slide_requests';

    let data = {
        presentationId,
        sourcePageId,
        targetPageId,
        pageNum,
        resources,
        settings: {
            fast: true,
            contentControl: true,
        },
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

export async function generateBestSlideRequests(presentationId, targetPageId, pageNum, resources) {
    const SERVICE = '/slides/generate_best_slide_requests';

    let data = {
        presentationId,
        targetPageId,
        pageNum,
        resources,
        settings: {
            fast: false,
            contentControl: false,
        },
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


export async function generateAllSlidesRequests(presentationId, sort, resources) {
    const SERVICE = '/slides/generate_all_slides_requests';

    let data = {
        presentationId,
        sort,
        resources,
        settings: {
            fast: false,
            contentControl: false,
        },
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

export async function clearPresentationRequests(presentationId) {
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

export async function clearSlideRequests(presentationId, pageNum) {
    return new Promise((resolve, reject) => {
        getPresentation(presentationId).then((response) => {
            let requests = [];
            if (Array.isArray(response.result.slides)
                && pageNum <= response.result.slides.length
            ) {
                for (let pageElement of response.result.slides[pageNum - 1].pageElements) {
                    requests.push({
                        deleteObject: {
                            objectId: pageElement.objectId,
                        }
                    });  
                }
            }
            resolve({
                requests,
                targetPageId: response.result.slides[pageNum - 1].objectId,
            });
        }).catch((reason) => {
            reject(reason);
        });
    });
}