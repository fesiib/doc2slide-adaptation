import { createPresentation } from './apis/DriveAPI';
import { getPresentation, updatePresentation } from './apis/SlidesAPI';
import { 
    clearSlideRequests, 
    generateSlideRequests,
    processExample,
} from './apis/AdaptationAPI';

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
            processExample(exampleUrl, exampleId, exampleDeckId).then((response) => {
                let exampleInfo = response.example_info;
                generateSlideRequests(slideInfo, exampleInfo)
                .then((response) => {
                    let requests = clearRequests.concat(response.requests);
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
        }).catch((reason) => {
            reject(reason);
        });
    });
}