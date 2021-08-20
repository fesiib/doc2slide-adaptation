import { getPresentation } from './SlidesAPI';

const ADDR = 'http://server.hyungyu.com:7777';
//const ADDR = 'http://localhost:7777';


export async function uploadPresentation(presentation) {
    const SERVICE = '/layout_styles/upload_presentation';

    let data = {
        presentation,
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
    const SERVICE = '/layout_styles/generate_presentation_requests';

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

export async function generateSlideRequests(presentationId, targetPageId, layoutPageId, stylesPageId, pageNum, resources) {
    const SERVICE = '/layout_styles/generate_slide_requests';

    let data = {
        presentationId,
        targetPageId,
        layoutPageId,
        stylesPageId,
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

export async function generateAlternativesRequests(presentationId, sort, layoutPageId, stylesPageId, resources) {
    const SERVICE = '/layout_styles/generate_alternatives_requests';

    let data = {
        presentationId,
        sort,
        layoutPageId,
        stylesPageId,
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