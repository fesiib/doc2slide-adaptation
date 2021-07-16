const COMPILE = "COMPILE";
const CHANGE_HEADER = "CHANGE_HEADER";
const CHANGE_BODY = "CHANGE_BODY";

const CONTENT = {
	header: 'Introduction',
	body: [
		'Communication takes place over time, and the presenter’s timed rehearsals, attention to timekeeping, and rhythm of spoken delivery all affect audience perceptions.',
		'Presentations are a crucial form of modern communication, yet there is a dissonance between everyday practices with presentation tools and best practices from the presentation literature.',
		'The activity of preparing and delivering presentations, whether to teach, inform, or persuade, is of critical importance across education, academia, and business.',
		'Our goal was therefore to uncover the gap between actual presentation practices and the “best practices” advocated in the presentation literature, before designing tools that help presenters to bridge that gap.',
	],
}

export const compileContent = (payload) => ({
    type: COMPILE,
    payload,
});

export const changeHeaderContent = (payload) => ({
    type: CHANGE_HEADER,
    payload,
});

export const changeBodyContent = (payload) => ({
    type: CHANGE_BODY,
    payload,
});

const initialState = {
    header: CONTENT.header,
    body: CONTENT.body,
    headerResult: [],
    bodyResult: [],
};

const content = (state = initialState, action) => {
    switch (action.type) {
        case COMPILE: {
            return {
                ...state,
                headerResult: action.payload.headerResult.splice(0),
                bodyResult: action.payload.bodyResult.splice(0),
            };
        }
        case CHANGE_HEADER: {
            return {
                ...state,
                header: action.payload.text
            }
        }
        case CHANGE_BODY: {
            let body = state.body.splice(0);
            body[action.payload.pos] = action.payload.text;
            return {
                ...state,
                body,
            }
        }
        default:
            return state;
    }
}

export default content;