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
            reject(null);
        }
        else {
            axios({
                method: 'post',
                url: requestType.server_addr + requestType.route,
                data: requestJSON,
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then((response) => {
                resolve(response.data);
            })
                .catch((error) => {
                    console.log("retrying because of: " + error);
                    resolve(sendRequest(requestJSON, requestType, retries + 1));
                });
        }
    });
}

async function getQueries(data) {
    return new Promise((resolve, reject) => {
        sendRequest(data, REQUEST_TYPES.queries).then((response) => {
            resolve(response);
        }).catch((error) => {
            reject(error);
        });
    });
}

async function getImages(data) {
    return new Promise((resolve, reject) => {
        sendRequest(data, REQUEST_TYPES.images).then((response) => {
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
