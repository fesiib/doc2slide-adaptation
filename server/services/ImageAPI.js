const axios = require('axios');

const ADDR = "http://server.hyungyu.com:5713/";

const REQUEST_TYPES = {
    images: {
        server_addr: ADDR,
        route: "getImages",
    },
    queries: {
        server_addr: ADDR,
        route: "findQueriess",
    },
};

function sendRequest(requestJSON, requestType, retries = 0) {
    return new Promise((resolve, reject) => {
        if (retries > 0) {
            console.log("Error: cannot access the server: " + requestType.route);
            reject([]);
        }
        axios({
            method: 'post',
            url: requestType.server_addr + requestType.route,
            data: requestJSON,
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then((response) => {
            resolve(response);
        })
            .catch((error) => {
                console.log("retrying because of: " + error);
                resolve(sendRequest(requestJSON, requestType, retries + 1));
            });
    });
}

async function getQueries(data) {
    let text = data.text;
    return new Promise((resolve, reject) => {
        let requestJSON = {text};
        sendRequest(requestJSON, REQUEST_TYPES.queries).then((response) => {
            resolve(response.surfaceWords);
        }).catch((error) => {
            reject(error);
        });
    });
}

async function getImages(data) {
    let queries = data.queries;
    let imageType = data.imageType;
    return new Promise((resolve, reject) => {
        let requestJSON = {
            query: queries.join(' OR '),
            imageType: imageType,
        };
        sendRequest(requestJSON, REQUEST_TYPES.images).then((response) => {
            resolve(response);
        }).catch((error) => {
            reject(error);
        });
    });
}

module.exports = {
    getQueries,
    getImages,
}