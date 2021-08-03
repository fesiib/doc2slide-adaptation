import { gapi } from 'gapi-script';

const FOLDER_ID = '1-CAXsYgbb2lgdQuMN7EHrZdVgzsn6yhD';
const FILE_TYPE = 'application/vnd.google-apps.presentation';

export function parsePresentations(callback) {
    let pageToken = null;
    let queryString = `mimeType='${FILE_TYPE}' and parents in '${FOLDER_ID}'`;
    gapi.client.drive.files.list({
        q: queryString,
        fields: 'nextPageToken, files(id, name)',
        spaces: 'drive',
        pageToken: pageToken
    }).then(function(response) {
        let files = response.result.files;
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                let file = files[i];
                callback(file.name, file.id);
            }
        }
    });
}

const TEMPLATES_FOLDER_ID = '1Njrblq2ifh7iKWkNwCM5uvhtue_8o5Qj';

export function createPresentation(title) {
    return new Promise((resolve, reject) => {
        let presentationMetaData = {
            name: title,
            parents: [TEMPLATES_FOLDER_ID],
            mimeType: FILE_TYPE,
        };
        gapi.client.drive.files.create({
            resource: presentationMetaData,
            fields: 'id',
        }).then((response) => {
            let presentation = response.result;
            resolve({
                presentationId: presentation.id,
            });
        }, (response) => {
            reject('Error in createPresentation: ' + response.result.error.message);
        });
    });
}