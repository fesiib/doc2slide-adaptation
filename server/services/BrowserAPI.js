const puppeteer = require('puppeteer');

async function withBrowserScoreShapeElements(shapeElements, pageSize) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:3000', {waitUntil: 'load'});

    const bodyHTML = await page.evaluate(
        () => {
            return { doc: document.body.innerHTML, window: window};
        }
    );

    console.log(bodyHTML);

    // Get the "viewport" of the page, as reported by the page.
    const response = await page.evaluate(
        (shapeElements, pageSize) => {
            // console.log(window, window.scoreShapeElements);
            // let score = window.scoreShapeElements(shapeElements, pageSize);
            return window;
        },
        shapeElements, pageSize
    );

    console.log(response);

    await browser.close();
    return response;
}

module.exports = {

};