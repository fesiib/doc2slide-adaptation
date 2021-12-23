import Example from "./Example";

const EXAMPLES_LIST = [
    {
        slideDeckId: 0,
        slideId: 1,
    },
    {
        slideDeckId: 0,
        slideId: 2,
    },
    {
        slideDeckId: 0,
        slideId: 3,
    },
    {
        slideDeckId: 0,
        slideId: 4,
    },
    {
        slideDeckId: 0,
        slideId: 5,
    }
];

function ExamplesGallery(props) {

    return (<div style={
        {
            margin: "2em",
            display: "flex",
            flexDirection: "row",
            gap: "1em",
            flexWrap: "wrap",
        }
    }>
        {
            EXAMPLES_LIST.map((value, i) => {
                
                return (
                    <Example
                        slideDeckId={value.slideDeckId}
                        slideId={value.slideId}
                    />
                );
            })
        }
    </div>);
}

export default ExamplesGallery;