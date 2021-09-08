import { copyPresentation, createPresentation } from './apis/DriveAPI';
import { generateDuplicatePresentationRequests, clearPresentationRequests, clearSlideRequests, generateAlternativesRequests, generatePresentationRequests, generateSlideRequests, uploadPresentation, generateDuplicateAlternativesRequests } from './apis/layoutStylesAPI';
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
                    // testSessions.push(
                    //     generateDuplicatePresentation(presentationId, title, resources).then((response) => {
                    //         console.log(response);
                    //     })
                    // );

                    testSessions.push(
                        new Promise((resolve_inner, reject_inner) => {
                            createPresentation(title).then((response) => {
                                let newId = response.presentationId;
                                if (newId === undefined) {
                                    reject_inner('Creation failed');
                                }
                                clearPresentationRequests(newId).then((response) => {
                                    let clearRequests = response.requests;

                                    getPresentation("1OLAg7zmqTEC8cMI6BrV8rIJDeaDJrFA_uwgZngHn-SI").then((response) => {
                                        let userPresentation = response.result;
                                        generatePresentationRequests(presentationId, userPresentation, resources)
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
                generateDuplicateAlternatives(presentationId, presentationId, null, null, sort, resources).then((response) => {
                    console.log(response);
                });
                // createPresentation(title).then((response) => {
                //     let newId = response.presentationId;
                //     if (newId === undefined) {
                //         reject('Creation failed');
                //     }
                //     clearPresentationRequests(newId).then((response) => {
                //         let clearRequests = response.requests;
                //         generateAlternativesRequests(presentationId, sort, 40, null, null, resources)
                //         .then((response) => {
                //             let requests = clearRequests;
                //             for (let obj of response.requestsList) {
                //                 requests = requests.concat(obj.requests);
                //             }
                //             console.log('Matching:', title, response.matchings, response.mappings);
                //             updatePresentation(newId, requests).then((response) => {
                //                 resolve({
                //                     response,
                //                 });
                //             });
                //         });
                //     });
                // });
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
            getPresentation("1OLAg7zmqTEC8cMI6BrV8rIJDeaDJrFA_uwgZngHn-SI").then((response) => {
                let userPresentation = response.result;
                generatePresentationRequests(referencePresentationId, userPresentation, resources)
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
            });
        }).catch((reason) => {
            reject(reason);
        });
    });
}

export async function generateDuplicatePresentation(referencePresentationId, title, resources) {
    return new Promise((resolve, reject) => {
        copyPresentation("duplicate_presentation_" + title, referencePresentationId).then((response) => {
            let presentationId = response.presentationId;
            generateDuplicatePresentationRequests(referencePresentationId, resources)
            .then((response) => {
                let requests = response.requests;
                let matchings = response.matchings;
                let mappings = response.mappings;
                let pageCnt = Object.keys(matchings).length;
                console.log('Matching:', matchings, mappings);
                updatePresentation(presentationId, requests).then((response) => {
                    resolve({
                        presentationId,
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

export async function generateDuplicateAlternatives(referencePresentationId, presentationId, idx, stylesPageId, sort, resources) {
    return new Promise((resolve, reject) => {
        getPresentation(presentationId).then((response) => {
            let presentation = response.result;
            let userPageId = null;
            if (idx !== null) {
                if (Array.isArray(presentation.slides) && idx <= presentation.slides.length) {
                    userPageId = presentation.slides[idx - 1].objectId;
                }
            }

            copyPresentation("duplicate_alternatives_" + presentation.title, (userPageId === null ? referencePresentationId : presentationId)).then((response) => {
                let newPresentationId = response.presentationId;
                generateDuplicateAlternativesRequests(presentation, referencePresentationId, sort, 40, userPageId, null, resources)
                .then((response) => {
                    let requests = response.setupRequests;
                    for (let pageRequests of response.requestsList) {
                        requests = requests.concat(pageRequests.requests);
                    }
                    let matchings = response.matchings;
                    let mappings = response.mappings;
                    let pageCnt = Object.keys(matchings).length;
                    console.log('Matching:', matchings, mappings);
                    updatePresentation(newPresentationId, requests).then((response) => {
                        resolve({
                            presentationId: newPresentationId,
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
    });
}