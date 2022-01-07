import { createPresentation } from './apis/DriveAPI';
import { getPresentation, updatePresentation } from './apis/SlidesAPI';
import { 
    clearPresentationRequests,
    clearSlideRequests, 
    generateSlideRequests,
    processExample,
    processExampleDesign,
} from './apis/AdaptationAPI';

const SLIDE_HEIGHT = 405;
const SLIDE_WIDTH = 720;
const EXAMPLES_LINK = "http://server.hyungyu.com:3001/frame_parsed";

export function getExampleURL(exampleDeckId, exampleId) {
    return EXAMPLES_LINK + "/" + exampleDeckId.toString() + "/" + exampleId.toString() + ".jpg";
}


async function process(exampleUrl, exampleId, exampleDeckId, slideInfo) {
    return new Promise((resolve, reject) => {
        processExample(exampleUrl, exampleId, exampleDeckId).then((response) => {
            let exampleInfo = response.example_info;
            generateSlideRequests(slideInfo, exampleInfo)
            .then((response) => {
                resolve({
                    response,
                    exampleInfo,
                });
            }).catch((reason) => {
                reject(reason);
            });
        }).catch((reason) => {
            reject(reason);
        });
    })
}

async function processBBS(exampleUrl, bbs, slideInfo) {
    return new Promise((resolve, reject) => {
        processExampleDesign(exampleUrl, bbs).then((response) => {
            let exampleInfo = response.example_info;
            generateSlideRequests(slideInfo, exampleInfo)
            .then((response) => {
                resolve({
                    response,
                    exampleInfo,
                });
            }).catch((reason) => {
                reject(reason);
            });
        }).catch((reason) => {
            reject(reason);
        });
    })
}

export async function generateSlide(exampleUrl, exampleId, exampleDeckId, presentationId, pageNum) {
    return new Promise((resolve, reject) => {
        clearSlideRequests(presentationId, pageNum).then((response) => {
            let clearRequests = response.requests;
            let slideInfo = {
                slide_id: response.slideId,
                slide_height: response.slideHeight,
                slide_width: response.slideWidth,
            };
            if (slideInfo.slide_id === null) {
                throw Error("No such page" + pageNum.toString());
            }
            process(exampleUrl, exampleId, exampleDeckId, slideInfo).then(({response, exampleInfo}) => {
                let requests = clearRequests.concat(response.requests);
                updatePresentation(presentationId, requests).then((response) => {
                    resolve({
                        exampleInfo,
                        updateResult: response,
                    });
                }).catch((reason) => {
                    reject(reason);
                });
            }).catch((reason) => {
                reject(reason);
            })
        }).catch((reason) => {
            reject(reason);
        });
    });
}

export async function generateSlideFromBBS(exampleUrl, bbs, presentationId, pageNum) {
    return new Promise((resolve, reject) => {
        clearSlideRequests(presentationId, pageNum).then((response) => {
            let clearRequests = response.requests;
            let slideInfo = {
                slide_id: response.slideId,
                slide_height: response.slideHeight,
                slide_width: response.slideWidth,
            };
            if (slideInfo.slide_id === null) {
                throw Error("No such page" + pageNum.toString());
            }
            processBBS(exampleUrl, bbs, slideInfo).then(({response, exampleInfo}) => {
                let requests = clearRequests.concat(response.requests);
                updatePresentation(presentationId, requests).then((response) => {
                    resolve({
                        exampleInfo,
                        updateResult: response,
                    });
                }).catch((reason) => {
                    reject(reason);
                });
            }).catch((reason) => {
                reject(reason);
            })
        }).catch((reason) => {
            reject(reason);
        });
    });
}

export async function generateAllSlides(examples, presentationId) {
    return new Promise((resolve, reject) => {
        clearPresentationRequests(presentationId).then((response) => {
            let requests = response.requests;
            let processingList = []
            for (let example of examples) {
                const exampleId = example.exampleId;
                const exampleDeckId = example.exampleDeckId;
                const exampleUrl = getExampleURL(exampleDeckId, exampleId);

                const pageId = "slide_" + example.exampleDeckId.toString() + '_' + example.exampleId.toString();
                requests.push({
                    createSlide: {
                        objectId: pageId,
                    },
                });
                let slideInfo = {
                    slide_id: pageId,
                    slide_height: SLIDE_HEIGHT,
                    slide_width: SLIDE_WIDTH,
                };
                
                processingList.push(process(exampleUrl, exampleId, exampleDeckId, slideInfo));
                break;
            }
            Promise.all(processingList).then((responses) => {
                let exampleInfos = []
                for (let {response, exampleInfo} of responses) {
                    exampleInfos.push(exampleInfo);
                    requests = requests.concat(response.requests);
                }
                updatePresentation(presentationId, requests).then((response) => {
                    resolve({
                        exampleInfos,
                        updateResult: response,
                    });
                }).catch((reason) => {
                    reject(reason);
                });
            })
        })
    });
}