import {combineReducers} from 'redux';
//import user from "./user";

import presentationFiles from './presentationFiles';

const RESET_APP = "RESET_APP";

const appReducer = combineReducers({
    presentationFiles
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