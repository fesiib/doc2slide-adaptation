import {gapi} from 'gapi-script';

const CLIENT_ID = process.env.REACT_APP_clientId;
const API_KEY = process.env.REACT_APP_apiKey;

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = [
    "https://slides.googleapis.com/$discovery/rest?version=v1",
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file";

/**
 *  On load, called to load the auth2 library and API client library.
 */
export function handleClientLoad(callbackStatusChange) {
    gapi.load('client:auth2', () => initClient(callbackStatusChange));
}

export function gapiSignIn() {
    gapi.auth2.getAuthInstance().signIn();
}

export function gapiSignOut() {
    gapi.auth2.getAuthInstance().signOut();
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient(callbackStatusChange) {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(callbackStatusChange);
        callbackStatusChange(gapi.auth2.getAuthInstance().isSignedIn.get());
    }, function(error) {
        console.log(JSON.stringify(error, null, 2));
    });
}