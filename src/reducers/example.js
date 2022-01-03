const SELECT_EXAMPLE = "SELECT_EXAMPLE";

export const selectExample = (payload) => ({
    type: SELECT_EXAMPLE,
    payload
});

const initialState = {
    exampleDeckId: 0,
    exampleId: 1,
};


const example = (state = initialState, action) => {
    switch (action.type) {
        
        case SELECT_EXAMPLE: {
            return {
                ...state,
                exampleDeckId: action.payload.exampleDeckId,
                exampleId: action.payload.exampleId
            }
        }
        default:
                return state;
    }
}

export default example;