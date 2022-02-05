import {combineReducers} from 'redux';
//import user from "./user";

import content from './content';
import loadingState from './loadingState';
import example from './example';

const RESET_APP = "RESET_APP";

const appReducer = combineReducers({
    example,
    loadingState,
    content, 
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