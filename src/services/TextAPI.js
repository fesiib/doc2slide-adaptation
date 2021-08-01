import { appendPre } from "./GoogleAPI";

const ADDR = "http://server.hyungyu.com:9382/";

const REQUEST_TYPES = {
    simple: {
        server_addr: ADDR,
        route: "get_shortenings_simple",
    },
    tfidf: {
        server_addr: ADDR,
        route: "get_shortenings_tfidf",
    },
    abstract: {
        server_addr: ADDR,
        route: "get_shortenings_abstract",
    },
};

const REQUEST_PATTERN = {
    content: {
        text: "",
    },
};

function processResult(response) {
    let results = {
        shortenings: [],
        singleWord: {},
        phrases: [],
    };
    let shortenings = response.result.shortenings;
    results.singleWord = response.result.singleWord;
    results.phrases = response.result.phrases;
    //let importantSegments = response.result.importantSegments;
    //let originalText = response.request.content.text;
    for (let tuple of shortenings) {
        let text = tuple.text;
        let score = tuple.score;
        //let deletedSegments = tuple.deleted;
        results.shortenings.push({
            text, score
        });            
    }
    return results;
}

function sendRequest(text, requestType, retries = 0) {
    return new Promise((resolve, reject) => {
        if (retries > 3) {
            appendPre("Error: cannot access the server: " + requestType.route);
            reject([]);
        }
        let requestJSON = JSON.parse(JSON.stringify(REQUEST_PATTERN));
        requestJSON.content.text = text;
        const request = new Request(
            requestType.server_addr + requestType.route,
            {
                method: 'POST',
                body: JSON.stringify(requestJSON),
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );
        fetch(
            request,
        )
            .then( (response) => response.json())
                .then((response) => {
                    let result = processResult(response);
                    resolve(result);
                })
                    .catch((error) => {
                        console.log("retrying because of: " + error);
                        resolve(sendRequest(text, requestType, retries + 1));
                    });
    });
}

export function textTFIDF(text) {
    return sendRequest(text, REQUEST_TYPES.tfidf);
}

export function textAbstract(text) {
    return sendRequest(text, REQUEST_TYPES.abstract);   
}

export async function processContent(request, possibleResponse, shouldUpdate) {
    if (!shouldUpdate) {
        return possibleResponse;
    }
    let headerText = request.header;
    let bodyTexts = request.body;
    let headerPromise = textTFIDF(headerText);
    let bodyPromises = [];
    for (let part of bodyTexts) {
        let text = part.paragraph;
        bodyPromises.push(
            new Promise(async (resolve) => {
                let result = await textTFIDF(text);
                resolve({
                    paragraph: result
                });
            })
        );
    }
    let header = await headerPromise;
    let body = await Promise.all(bodyPromises);
    return {
        header,
        body,
    };
}


export async function processContentDoc(request, possibleResponse, shouldUpdate) {
    if (!shouldUpdate) {
        return possibleResponse;
    }
    let titleText = request.title;
    let sectionsTexts = request.sections;
    let titlePromise = textTFIDF(titleText);
    let sectionsPromises = [];
    for (let section of sectionsTexts) {
        sectionsPromises.push(processContent(section, null, true));
    }
    let title = await titlePromise;
    let sections = await Promise.all(sectionsPromises);
    console.log(title, sections);
    return {
        title,
        sections,
    };
}
