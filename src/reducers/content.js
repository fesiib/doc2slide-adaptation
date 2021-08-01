const COMPILE = "COMPILE";
const CHANGE_HEADER = "CHANGE_HEADER";
const CHANGE_BODY = "CHANGE_BODY";

const CONTENT_COMPLEX = {
	header: 'Introduction',
	body: [
		{
            paragraph: 'Communication takes place over time, and the presenter’s timed rehearsals, attention to timekeeping, and rhythm of spoken delivery all affect audience perceptions.',
        },
        {
            paragraph: 'Presentations are a crucial form of modern communication, yet there is a dissonance between everyday practices with presentation tools and best practices from the presentation literature.',
        },
        {
            paragraph: 'The activity of preparing and delivering presentations, whether to teach, inform, or persuade, is of critical importance across education, academia, and business.',
        },
        {
            paragraph: 'Our goal was therefore to uncover the gap between actual presentation practices and the “best practices” advocated in the presentation literature, before designing tools that help presenters to bridge that gap.',
        },
    ],
};

const CONTENT_SIMPLE = {
	header: 'Introduction',
	body: [
		{
            paragraph: 'Communication takes place over time.',
        },
        {
            paragraph: 'Presentations are a crucial form of modern communication.',
        },
        {
            paragraph: 'The activity of preparing and delivering presentations.',
        },
        {
            paragraph: 'Our goal was therefore to uncover the gap between actual presentation practices.',
        },
    ],
};

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
    header: CONTENT_COMPLEX.header,
    body: CONTENT_COMPLEX.body.slice(),
    headerResult: [],
    bodyResult: [],
    shouldUpdate: true,
};

const content = (state = initialState, action) => {
    switch (action.type) {
        case COMPILE: {
            return {
                ...state,
                headerResult: action.payload.headerResult,
                bodyResult: action.payload.bodyResult,
                shouldUpdate: false,
            };
        }
        case CHANGE_HEADER: {
            return {
                ...state,
                header: action.payload.text,
                shouldUpdate: true,
            }
        }
        case CHANGE_BODY: {
            let body = state.body.slice(0);
            body[action.payload.pos] = {
                paragraph: action.payload.text,
            };
            return {
                ...state,
                body,
                shouldUpdate: true,
            }
        }
        default:
            return state;
    }
}

export default content;