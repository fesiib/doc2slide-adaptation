import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { resetApp } from "../reducers";
import { addFile } from "../reducers/presentationFiles";
import { parsePresentations } from "../services/apis/DriveAPI";
import {handleClientLoad,
    gapiSignIn,
    gapiSignOut,
} from '../services/apis/GoogleAPI';

function Authorize() {
    const dispatch = useDispatch();

    const [authorizeDisplay, setAuthorizeDisplay] = useState('none');
    const [signoutDisplay, setSignoutDisplay] = useState('none');

    const _addFile = (name, id) => {
        dispatch(addFile({
            name,
            id,
        }));
    }

    const callbackStatusChange = (isSignedIn) => {
        if (isSignedIn) {
            setAuthorizeDisplay('none');
            setSignoutDisplay('block');
            const callbackForEachPresentation = _addFile;
            parsePresentations(callbackForEachPresentation);
        }
        else {
            dispatch(resetApp());
            setAuthorizeDisplay('block');
            setSignoutDisplay('none');
        }
    }

    /**
     *  Sign in the user upon button click.
     */
    const handleAuthClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        gapiSignIn();
    }

    /**
     *  Sign out the user upon button click.
     */
    const handleSignoutClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        gapiSignOut();
    }

    useEffect(() => {
        handleClientLoad(callbackStatusChange);
    }, []);

    return (
        <div>
            <button onClick={handleAuthClick} style={{display: authorizeDisplay}} >Authorize</button>
            <button onClick={handleSignoutClick} style={{display: signoutDisplay}} >Sign Out</button>
        </div>
    );
}

export default Authorize;