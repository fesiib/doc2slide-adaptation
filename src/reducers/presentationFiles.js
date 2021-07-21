const ADD_FILE = "ADD_FILE";
const REMOVE_FILE = "REMOVE_FILE";
const SELECT_FILE = "SELECT_FILE";
const EXTRACTED_FILE = "EXTRACTED_FILE";
const EXTRACTED_TEMPLATES = "EXTRACTED_TEMPLATES";

export const CREATION_SIGNAL = "signal";
export const ERROR_SIGNAL = "error";

export const addFile = (payload) => ({
    type: ADD_FILE,
    payload,
});

export const removeFile = (payload) => ({
    type: REMOVE_FILE,
    payload,
});

export const selectFile = (payload) => ({
    type: SELECT_FILE,
    payload,
});

export const extractedFile = (payload) => ({
    type: EXTRACTED_FILE,
    payload,
});

export const extractedTemplates = (payload) => ({
    type: EXTRACTED_TEMPLATES,
    payload,
});

const initialState = {
    cnt: 0,
    files: [],
    filesExt: {},
    selected: null,
    selectedExt: null,
    templates: {},
};

const presentationFiles = (state = initialState, action) => {
    switch (action.type) {
        case ADD_FILE: {
            for (let el of state.files) {
                if (el.id === action.payload.id) {
                    return {...state};
                }
            }
            return {
                ...state,
                cnt: state.cnt + 1,
                files: [...state.files, action.payload],
            }
        }
        case REMOVE_FILE: {
            let position = 0;
            let selected = state.selected;
            let selectedExt = state.selectedExt;
            while (position < state.files.length && state.files[position].id !== action.payload.id)
                position++;
            if (position === state.files.length) {
                return {...state};
            }
            if (selected === action.payload.id) {
                selected = null;
                selectedExt = null;
            } 
            return {
                ...state,
                cnt: state.cnt - 1,
                files: [state.files.slice(0, position), ...state.files.slice(position+1)],
                selected: selected,
                selectedExt: selectedExt,
            }
        }
        case SELECT_FILE: {
            let filesExt = {...state.filesExt};
            let selected = action.payload.id;
            let selectedExt = filesExt[selected];
            if (action.payload.id === state.selected) {
                selected = null;
                selectedExt = null;
            }
            else if (selectedExt === undefined 
                || selectedExt === ERROR_SIGNAL
                || selectedExt === ''
            ) {
                filesExt[selected] = '';
                selectedExt = CREATION_SIGNAL;
            }
            return {
                ...state,
                selected: selected,
                selectedExt: selectedExt,
                filesExt: filesExt,
            }
        }
        case EXTRACTED_FILE: {
            let filesExt = {...state.filesExt};
            let extractedFor = action.payload.forId;
            let extractedId = action.payload.id;

            filesExt[extractedFor] = extractedId;

            if (extractedFor === state.selected) {
                return {
                    ...state,
                    selectedExt: extractedId,
                    filesExt: filesExt,
                }
            }
            else {
                return {
                    ...state,
                    filesExt: filesExt,
                }
            }
        }
        case EXTRACTED_TEMPLATES: {
            let templates = action.payload.templates;
            let forId = action.payload.forId;
            let newTemplates = { ...state.templates };
            newTemplates[forId] = templates;
            return {
                ...state,
                templates: newTemplates,
            };
        }
        default:
                return state;
    }
}

export default presentationFiles;