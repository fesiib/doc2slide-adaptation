const EXAMPLES_LINK = "http://server.hyungyu.com:3001/frame_parsed";

const WIDTH = 200, HEIGHT = 200 * 9 / 16;

function Example(props) {
    
    const slideDeckId = props.slideDeckId;
    const slideId = props.slideId;

    const width = WIDTH;
    const height = HEIGHT;
    
    if (slideDeckId == null || slideId == null) {
        return (<div>
            Not specified
        </div>);
    }

    const exampleSelected = (event) => {
        console.log(event.target.currentSrc);
    }

    const key = slideDeckId.toString() + "-" + slideId.toString();
    const url = "/" + slideDeckId.toString() + "/" + slideId.toString() + ".jpg";

    return (<div onClick={exampleSelected} key={key} style={
            {
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