const SELECT_EXAMPLE = "SELECT_EXAMPLE";
const ADD_BB = "ADD_BB";
const DEL_BB = "DEL_BB";
const UPDATE_BB = "UPDATE_BB";
const CLEAR_BBS = "CLEAR_BBS";

export const selectExample = (payload) => ({
    type: SELECT_EXAMPLE,
    payload
});

export const addBB = (payload) => ({
    type: ADD_BB,
    payload
});

export const delBB = (payload) => ({
    type: DEL_BB,
    payload
});

export const updateBB = (payload) => ({
    type: UPDATE_BB,
    payload
});

const initialState = {
    exampleDeckId: 0,
    exampleId: 1,
    bbs: {},
    idCnt: 0,
};

/*
"slide_deck_id": slide_deck_id,
"slide_id": slide_id,
"image_height": height,
"image_width": width,
"type": CLASS_LABELS[classes_pred[i]],
"conf": round(scores[i] * 100),
'left': int(xmin * width),
'top': int(ymin * height),
'width': int((xmax-xmin) * width),
'height': int((ymax-ymin) * height),
'object_id': i,
*/ 



const example = (state = initialState, action) => {
    switch (action.type) {
        
        case SELECT_EXAMPLE: {
            return {
                ...state,
                exampleDeckId: action.payload.exampleDeckId,
                exampleId: action.payload.exampleId,
                bbs: {},
                idCnt: 0,
            }
        }
        case ADD_BB: {
            const bb = action.payload.bb;
            return {
                ...state,
                bbs: {
                    ...state.bbs,
                    [state.idCnt]: bb,
                },
                idCnt: state.idCnt + 1,
            };
        }
        case DEL_BB: {
            const id = action.payload.id;
            const bbs = {...state.bbs};
            if (bbs.hasOwnProperty(id)) {
                delete bbs[id]
            }
            return {
                ...state,
                bbs: {
                    ...bbs,
                }
            }
        }
        case UPDATE_BB: {
            const id = action.payload.id;
            const change = action.payload.change;
            return {
                ...state,
                bbs: {
                    ...state.bbs,
                    [id]: {
                        ...state.bbs[id],
                        ...change,
                    }
                }
            }
        }
        default:
                return state;
    }
}

export default example;