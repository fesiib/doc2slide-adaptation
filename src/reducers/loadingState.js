const ACTIVATE_LOADING = "ACTIVATE_LOADING";
const DEACTIVATE_LOADING = "DEACTIVATE_LOADING";

export const activateLoading = () => ({
    type: ACTIVATE_LOADING,
});


export const deactivateLoading = () => ({
    type: DEACTIVATE_LOADING,
});

const initialState = {
    loading: false,
};


const loadingState = (state = initialState, action) => {
    switch (action.type) {
        case ACTIVATE_LOADING: {
            return {
                ...state,
                loading: true,
            }
        }
        case DEACTIVATE_LOADING: {
            return {
                ...state,
                loading: false,
            }
        }
        default:
                return state;
    }
}

export default loadingState;