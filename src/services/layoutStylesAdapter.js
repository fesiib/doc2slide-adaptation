import { createPresentation } from './apis/DriveAPI';
import { clearPresentationRequests, clearSlideRequests, generateAlternativesRequests, generatePresentationRequests, generateSlideRequests, uploadPresentation } from './apis/layoutStylesAPI';
import { getPresentation, updatePresentation } from './apis/SlidesAPI';

export async function testPresentation_v2(presentationId, copies, resources) {
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
                                        console.log('Matching:', title, response.matchings, response.mappings);
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

export async function comparePresentation_v2(presentationId, sort, resources) {
    return new Promise((resolve, reject) => {
        getPresentation(presentationId).then((response) => {
            let presentation = response.result;
            let titleSuffix = 'compare_template_' + presentation.title;
            uploadPresentation(presentation).then((response) => {
                let title = titleSuffix;
                createPresentation(title).then((response) => {
                    let newId = response.presentationId;
                    if (newId === undefined) {
                        reject('Creation failed');
                    }
                    clearPresentationRequests(newId).then((response) => {
                        let clearRequests = response.requests;
                        generateAlternativesRequests(presentationId, sort, 40, null, null, resources)
                        .then((response) => {
                            let requests = clearRequests;
                            for (let obj of response.requestsList) {
                                requests = requests.concat(obj.requests);
                            }
                            console.log('Matching:', title, response.matchings, response.mappings);
                            updatePresentation(newId, requests).then((response) => {
                                resolve({
                                    response,
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

export async function justUploadPresentation_v2(presentationId) {
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
export async function uploadPresentation_v2(presentationId) {
    return new Promise((resolve, reject) => {
        getPresentation(presentationId).then((response) => {
            let presentation = response.result;
            let title = 'TEMPLATE_' + presentation.title;
            uploadPresentation(presentation).then((response) => {
                console.log('Extraction Result: ', response);
                let templates = response.extractedTemplates;
                let requests = [];

                for (let layout of response.layouts) {
                    requests = requests.concat(layout.requests);
                }
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
                                templates: templates,
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

export async function generatePresentation_v2(referencePresentationId, presentationId, resources) {
    return new Promise((resolve, reject) => {
        clearPresentationRequests(presentationId).then((response) => {
            let clearRequests = response.requests;
            generatePresentationRequests(referencePresentationId, resources)
            .then((response) => {
                let requests = clearRequests.concat(response.requests);
                let matchings = response.matchings;
                let mappings = response.mappings;
                let pageCnt = Object.keys(matchings).length;
                console.log('Matching:', matchings, mappings);
                updatePresentation(presentationId, requests).then((response) => {
                    resolve({
                        pageCnt,
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

export async function generateSlide_v2(referencePresentationId, presentationId, layoutPageId, stylesPageId, pageNum, resources) {
    return new Promise((resolve, reject) => {
        clearSlideRequests(presentationId, pageNum).then((response) => {
            let clearRequests = response.requests;
            let targetPageId = response.targetPageId;
            generateSlideRequests(referencePresentationId, targetPageId, layoutPageId, stylesPageId, pageNum, resources)
            .then((response) => {
                let requests = clearRequests.concat(response.requests);
                console.log('Matched:', response.matching, response.mapping);
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

export async function generateAlternatives(referencePresentationId, presentationId, layoutPageId, stylesPageId, sort, resources) {
    return new Promise((resolve, reject) => {
        clearPresentationRequests(presentationId).then((response) => {
            let clearRequests = response.requests;
            generateAlternativesRequests(referencePresentationId, sort, 40, layoutPageId, stylesPageId, resources)
            .then((response) => {
                let requests = clearRequests;
                for (let obj of response.requestsList) {
                    requests = requests.concat(obj.requests);
                }
                console.log(requests);
                console.log('All Slides Matched:', response.matchings, response.mappings);
                updatePresentation(presentationId, requests).then(() => {
                    resolve(response);
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