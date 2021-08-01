const COMPILE = "COMPILE";
const CHANGE_TITLE = "CHANGE_TITLE";
const CHANGE_SECTIONS = "CHANGE_SECTIONS";

const CONTENT_DOC = {
    title: 'HyperSlides: Dynamic Presentation Prototyping',
    sections: [
        {
            header: 'ABSTRACT',
            body: [
                {
                    paragraph: 'Presentations are a crucial form of modern communication, yet there is a dissonance between everyday practices with presentation tools and best practices from the presentation literature.',
                },
            ],
        },
        {
            header: 'INTRODUCTION',
            body: [
                {
                    paragraph: 'The activity of preparing and delivering presentations, whether to teach, inform, or persuade, is of critical importance across education, academia, and business.',
                },
                {
                    paragraph: 'The success of slideware can be measured by the 60 million monthly visitors to the SlideShare platform for web-based presentation sharing [43] and the 12 million English PowerPoint files indexed by Google as of January 2013.',
                },
                {
                    paragraph: 'Nevertheless, while slideware can lift the floor of public speaking, it can also lower the ceiling [37] by creating a dependency on slides that in many cases resemble text documents (“slideuments”) [10].',
                },
                {
                    paragraph: 'Even so, a wide range of technologies have been created to augment or replace slide presentations.',
                },
                {
                    paragraph: 'However, very few works have attempted to address all five canons of rhetoric formulated by Cicero [9], from the invention and arrangement of arguments through their elaboration in style and memory before final delivery.',
                },
            ],
        },
        // {
        //     header: 'ABSTRACT',
        //     body: [
        //         {
        //             paragraph: '',
        //             bullet: '',
        //             level: 0,
        //         },
        //     ],
        // },
    ],
}

const CONTENT_DOC_SIMPLE = {
    title: 'HyperSlides: Dynamic Presentation Prototyping',
    sections: [
        {
            header: 'ABSTRACT',
            body: [
                {
                    paragraph: 'Presentations are a crucial form of modern communication.',
                },
            ],
        },
        {
            header: 'INTRODUCTION',
            body: [
                {
                    paragraph: 'The activity of preparing and delivering presentations.',
                },
                {
                    paragraph: 'The success of slideware can be measured by the 60 million monthly visitors to the SlideShare platform.',
                },
                {
                    paragraph: 'Nevertheless, while slideware can lift the floor of public speaking, it can also lower the ceiling.',
                },
                {
                    paragraph: 'Even so, a wide range of technologies have been created to augment or replace slide presentations.',
                },
                {
                    paragraph: 'However, very few works have attempted to address all five canons of rhetoric formulated by Cicero.',
                },
            ],
        },
        // {
        //     header: 'ABSTRACT',
        //     body: [
        //         {
        //             paragraph: '',
        //             bullet: '',
        //             level: 0,
        //         },
        //     ],
        // },
    ],
}


function parseSection(text) {
    let content = {
        header: '',
        body: [],
    };

    let parts = text.trim().split('\n');
    if (parts.length > 0) {
        content.header = parts[0];
        for (let i = 1; i < parts.length; i++) {
            content.body.push({
                paragraph: parts[i],
            });
        }
        return content;
    }
    else {
        return null;
    }
}


export const compileContent = (payload) => ({
    type: COMPILE,
    payload,
});

export const changeTitleContent = (payload) => ({
    type: CHANGE_TITLE,
    payload,
});

export const changeSectionsContent = (payload) => ({
    type: CHANGE_SECTIONS,
    payload,
});

const initialState = {
    title: CONTENT_DOC_SIMPLE.title,
    sections: CONTENT_DOC_SIMPLE.sections.slice(),
    titleResult: [],
    sectionsResult: [],
    shouldUpdate: true,
};

const contentDoc = (state = initialState, action) => {
    switch (action.type) {
        case COMPILE: {
            return {
                ...state,
                titleResult: action.payload.titleResult,
                sectionsResult: action.payload.sectionsResult,
                shouldUpdate: false,
            };
        }
        case CHANGE_TITLE: {
            return {
                ...state,
                title: action.payload.text,
                shouldUpdate: true,
            }
        }
        case CHANGE_SECTIONS: {
            let sections = state.sections.slice();
            let section = parseSection(action.payload.text);
            if (section !== null) {
                sections[action.payload.pos] = section;
            }
            return {
                ...state,
                sections,
                shouldUpdate: true,
            }
        }
        default:
            return state;
    }
}

export default contentDoc;