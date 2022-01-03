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

    const parseDatabase = () => {
        let lst = []
        for (let exampleDeckId = 0; exampleDeckId < 5; exampleDeckId++) {
            for (let exampleId = 1; exampleId < 7; exampleId++) {
                lst.push(
                    <Example
                        exampleDeckId={exampleDeckId}
                        exampleId={exampleId}
                        size='s'
                    />
                );
            }
        }   
        return lst;
    }

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
            parseDatabase()
            // EXAMPLES_LIST.map((value, i) => {
            //     return (
            //         <Example
            //             exampleDeckId={value.exampleDeckId}
            //             exampleId={value.exampleId}
            //         />
            //     );
            // })
        }
    </div>);
}

export default ExamplesGallery;