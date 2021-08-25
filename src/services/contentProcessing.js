import { imageAll } from './apis/ImageAPI';
import {
    textTFIDF,
    textAbstract,
} from './apis/TextAPI';

export async function processContent(request, possibleResponse, shouldUpdate) {
    if (!shouldUpdate) {
        return possibleResponse;
    }
    
    let headerTextPromise = textTFIDF(request.header);
    let headerImagePromise = imageAll(request.header);

    let bodyTextPromises = [];
    let bodyImagePromises = [];
    for (let part of request.body) {
        let text = part.paragraph;
        bodyTextPromises.push(
            new Promise(async (resolve) => {
                let result = await textTFIDF(text);
                resolve(result);
            })
        );
        bodyImagePromises.push(
            new Promise(async (resolve) => {
                let result = await imageAll(text);
                resolve(result);
            })
        );
    }

    let headerText = await headerTextPromise;
    let headerImage = await headerImagePromise;
    let bodyText = await Promise.all(bodyTextPromises);
    let bodyImage = await Promise.all(bodyImagePromises);

    let header = {
        ...headerText,
        images: headerImage
    };
    let body = [];

    for (let i = 0; i < request.body.length; i++) {
        body.push({
            paragraph: {
                ...bodyText[i],
                images: bodyImage[i],
            }
        });
    }

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
    for (let section of sections) {
        section.mapToSingleSlide = true;
    }
    return {
        title,
        sections,
    };
}