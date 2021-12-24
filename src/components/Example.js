import { useDispatch, useSelector } from "react-redux";
import { activateLoading, deactivateLoading } from "../reducers/loadingState";
import { generateSlide } from "../services/slideAdapter";

const LOADING = "https://media1.tenor.com/images/d6cd5151c04765d1992edfde14483068/tenor.gif";

const EXAMPLES_LINK = "http://server.hyungyu.com:3001/frame_parsed";
export const EXPERIMENTAL_PRESENTATION_ID = "16AP3S-EPxG7Sqls2LtZkJBm7pkjqy2ZoHNWjU6Wp_eo";

const WIDTH = 200, HEIGHT = 200 * 9 / 16;

function Example(props) {
    const dispatch = useDispatch();

    const { loading } = useSelector(state => state.loadingState);
    
    const exampleDeckId = props.exampleDeckId;
    const exampleId = props.exampleId;

    const width = WIDTH;
    const height = HEIGHT;
    
    if (exampleDeckId == null || exampleId == null) {
        return (<div>
            Not specified
        </div>);
    }

    const key = exampleDeckId.toString() + "-" + exampleId.toString();
    const url = "/" + exampleDeckId.toString() + "/" + exampleId.toString() + ".jpg";

    const exampleSelected = (event) => {
        if (loading) {
            return;
        }
        dispatch(activateLoading());
        generateSlide(EXAMPLES_LINK + url, exampleId, exampleDeckId, EXPERIMENTAL_PRESENTATION_ID, 1).then((response) => {
            dispatch(deactivateLoading());
            window.location.reload();
        }).catch((reason) => {
            dispatch(deactivateLoading());
            console.log(reason)
        });
    }

    return (<div onClick={exampleSelected} key={key} style={
            {
                pointerEvents: loading ? 'none' : 'all',
                visibility: loading ? 'hidden' : 'visible',
                overflow: "hidden",
                width: width,
                height: height,
                display: "flex",
                justifyContent: 'center'
            }
        }>
        <img src={EXAMPLES_LINK + url} style={
            {
                width: width,
                objectFit: "cover"
            }
        }/>
    </div>);
}

export default Example;