const ADDR = "http://server.hyungyu.com:7777/slides/";

const REQUEST_TYPES = {
    images: {
        server_addr: ADDR,
        route: "get_images",
    },
    queries: {
        server_addr: ADDR,
        route: "get_queries",
    },
};

function sendRequest(requestJSON, requestType, retries = 0) {
    return new Promise((resolve, reject) => {
        if (retries > 0) {
            console.log("Error: cannot access the server: " + requestType.route);
            reject([]);
        }
        else {
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
                        resolve(response);
                    })
                        .catch((error) => {
                            console.log("retrying because of: " + error);
                            resolve(sendRequest(requestJSON, requestType, retries + 1));
                        });
        }
    });
}


async function getQueries(text) {
    return new Promise((resolve, reject) => {
        let requestJSON = {text};
        sendRequest(requestJSON, REQUEST_TYPES.queries).then((response) => {
            resolve(response.surfaceWords);
        }).catch((error) => {
            reject(error);
        });
    });
}

async function getImages(queries, imageType) {
    return new Promise((resolve, reject) => {
        if (queries.length === 0) {
            resolve([]);
        }
        else {
            let requestJSON = {
                query: queries.join(' OR '),
                imageType: imageType,
            };
            sendRequest(requestJSON, REQUEST_TYPES.images).then((response) => {
                resolve(response);
            }).catch((error) => {
                reject(error);
            });
        }
    });
}


export async function imageAll(text) {
    const imageType = 'all';
    return new Promise((resolve, reject) => {
        getQueries(text).then((queries) => {
            getImages(queries, imageType).then((images) => {
                resolve(images);
            });
        }).catch((error) => {
            reject(error);
        });
    });
}