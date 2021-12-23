import {combineReducers} from 'redux';
//import user from "./user";

import presentationFiles from './presentationFiles';
import content from './content';
import contentDoc from './contentDoc';

const RESET_APP = "RESET_APP";

const appReducer = combineReducers({
    presentationFiles,
    content,
    contentDoc,
});

export const resetApp = () => ({
    type: RESET_APP,
});

const rootReducer = (state, action) => {
    if (action.type === RESET_APP) {
        return appReducer(undefined, action);
    }
    return appReducer(state, action);
}

export default rootReducer;