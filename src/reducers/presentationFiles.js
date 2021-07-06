const ADD_FILE = "ADD_FILE";
const REMOVE_FILE = "REMOVE_FILE";
const SELECT_FILE = "SELECT_FILE";

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

const initialState = {
    cnt: 0,
    files: [],
    selected: null,
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
            while (position < state.files.length && state.files[position].id !== action.payload.id)
                position++;
            if (position === state.files.length) {
                return {...state};
            }
            if (selected === action.payload.id) {
                selected = null;
            } 
            return {
                ...state,
                cnt: state.cnt - 1,
                files: [state.files.slice(0, position), ...state.files.slice(position+1)],
                selected: selected,
            }
        }
        case SELECT_FILE: {
            let selected = action.payload.id;
            if (action.payload.id === state.selected) {
                selected = null;
            }
            return {
                ...state,
                selected: action.payload.id,
            }
        }
        default:
                return state;
    }
}

export default presentationFiles;