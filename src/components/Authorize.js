import { useEffect } from "react";
import {handleClientLoad,
    bodyHTML,
} from '../services/GoogleAPI';

function Authorize() {
    useEffect(() => {
        handleClientLoad();
    });
    
    return bodyHTML();
}

export default Authorize;