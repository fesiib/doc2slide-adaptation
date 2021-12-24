import Example from "./Example";

const EXAMPLES_LIST = [
    {
        exampleDeckId: 0,
        exampleId: 1,
    },
    {
        exampleDeckId: 0,
        exampleId: 2,
    },
    {
        exampleDeckId: 0,
        exampleId: 3,
    },
    {
        exampleDeckId: 0,
        exampleId: 4,
    },
    {
        exampleDeckId: 0,
        exampleId: 5,
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
                        exampleDeckId={value.exampleDeckId}
                        exampleId={value.exampleId}
                    />
                );
            })
        }
    </div>);
}

export default ExamplesGallery;