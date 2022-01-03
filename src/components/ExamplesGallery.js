import EXAMPLES_LIST from "../services/ExamplesList";
import Example from "./Example";

function ExamplesGallery(props) {

    const parseDatabase = () => {
        let lst = []
        for (let example of EXAMPLES_LIST) {
            const exampleDeckId = example.exampleDeckId;
            const exampleId = example.exampleId;
            lst.push(
                <Example
                    exampleDeckId={exampleDeckId}
                    exampleId={exampleId}
                    size='s'
                />
            );
        }

        // for (let exampleDeckId = 44; exampleDeckId < 70; exampleDeckId++) {
        //     for (let exampleId = 13; exampleId < 19; exampleId++) {
        //         lst.push(
        //             <Example
        //                 exampleDeckId={exampleDeckId}
        //                 exampleId={exampleId}
        //                 size='s'
        //             />
        //         );
        //     }
        // }   
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