import { getPresentation } from './SlidesAPI';

const ADDR = 'http://192.168.1.147:7777';
//const ADDR = 'http://localhost:7777';

export async function generateSlideRequests(slideInfo, exampleInfo) {
    const SERVICE = '/example_adaptation/generate_slide_requests';

    let data = {
        "slide_info": slideInfo,
        "example_info": exampleInfo,
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

export async function processExample(exampleUrl, exampleId, exampleDeckId) {
    const SERVICE = '/example_adaptation/process_example';

    let data = {
        "url": exampleUrl,
        "example_id": exampleId,
        "example_deck_id": exampleDeckId,
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

export async function clearSlideRequests(presentationId, pageNum) {
    return new Promise((resolve, reject) => {
        getPresentation(presentationId).then((response) => {
            let requests = [];
            let slideId = null;
            if (!Array.isArray(response.result.slides)) {
                resolve({requests, slideId});
            }
            if (response.result.slides.length < pageNum) {
                resolve({requests, slideId});
            }
            const slide = response.result.slides[pageNum-1];
            slideId = slide.objectId;
            for (let pageElement of slide.pageElements) {
                requests.push({
                    deleteObject: {
                        objectId: pageElement.objectId,
                    }
                });  
            }
            resolve({
                requests,
                slideId,
            });
        }).catch((reason) => {
            reject(reason);
        });
    });
}