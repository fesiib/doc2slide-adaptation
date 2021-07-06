import {gapi} from 'gapi-script';

import {parseSlideFiles} from './DriveAPI';

const CLIENT_ID = process.env.REACT_APP_clientId;
const API_KEY = process.env.REACT_APP_apiKey;

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = [
    "https://slides.googleapis.com/$discovery/rest?version=v1",
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/presentations.readonly https://www.googleapis.com/auth/drive.metadata.readonly";

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
 export function appendPre(message) {
    let pre = document.getElementById('content');
    let textContent = document.createTextNode(message + '\n');
    pre.appendChild(textContent);
}

/**
 *  On load, called to load the auth2 library and API client library.
 */
export function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    }, function(error) {
        appendPre(JSON.stringify(error, null, 2));
    });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
    const authorizeButton = document.getElementById('authorize_button');
    const signoutButton = document.getElementById('signout_button');
    if (authorizeButton === undefined || signoutButton === undefined) {
        return;
    }
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        parseSlideFiles();
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
    }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
    event.preventDefault();
    event.stopPropagation();
    gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
    event.preventDefault();
    event.stopPropagation();
    gapi.auth2.getAuthInstance().signOut();
}

export function bodyHTML() {
    return (
        <div>
            <button id="authorize_button" onClick={handleAuthClick} style={{display: 'none'}} >Authorize</button>
            <button id="signout_button" onClick={handleSignoutClick} style={{display: 'none'}} >Sign Out</button>
            
            <pre id="content" style={{whiteSpace: "pre-wrap"}}></pre>
        </div>
    );
}
