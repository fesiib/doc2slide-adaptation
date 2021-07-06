import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { resetApp } from "../reducers";
import { addFile } from "../reducers/presentationFiles";
import { parsePresentations } from "../services/DriveAPI";
import {handleClientLoad,
    bodyHTML,
} from '../services/GoogleAPI';

function Authorize() {
    const dispatch = useDispatch();

    const _addFile = (name, id) => {
        dispatch(addFile({
            name,
            id,
        }));
    }

    const callbackStatusChange = (isSignedIn) => {
        if (isSignedIn) {
            const callbackForEachPresentation = _addFile;
            parsePresentations(callbackForEachPresentation);
        }
        else {
            dispatch(resetApp());
        }
    }

    useEffect(() => {
        handleClientLoad(callbackStatusChange);
    });
    return bodyHTML();
}

export default Authorize;