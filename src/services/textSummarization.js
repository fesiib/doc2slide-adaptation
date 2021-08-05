import {
    textTFIDF,
    textAbstract,
} from './apis/TextAPI';

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