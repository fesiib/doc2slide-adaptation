import React, { useRef, useState } from 'react';
import Moveable from 'react-moveable';
import { useDispatch, useSelector } from 'react-redux';
import { addBB, delBB, updateBB } from '../reducers/example';
import { getExampleURL } from '../services/slideAdapter';

const DELETE_ICON = '../icons/delete.svg';
const OBJECT_ID_PREFIX = 'object_';


function ExampleCanvas(props) {
    const dispatch = useDispatch();

    const { loading } = useSelector(state => state.loadingState);
	const {exampleDeckId, exampleId, bbs, idCnt} = useSelector(state => state.example);

    const [selectedTarget, setSelectedTarget] = useState(null);

    const parentRef = useRef();
    const bbsRefs = useRef([]);

    const exampleUrl = getExampleURL(exampleDeckId, exampleId);

    const exampleWidth = 650;
    const exampleHeight = exampleWidth * (9/16);

    const handleOnProcess = (event) => {

    }

    const handleRectClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const id = event.target.parentElement.id;
        const bbRef = bbsRefs.current.find((ref, idx) => {
            return ref && ref.id === id;
        });
        setSelectedTarget(bbRef)
    }
    const handleDelClick = (event) => {
        const target = selectedTarget;
        if (target) {
            console.log(event);
            event.preventDefault();
            event.stopPropagation();
            const id = target.id;
            const object_id = parseInt(id.slice(OBJECT_ID_PREFIX.length));
            dispatch(delBB({id: object_id}));
            setSelectedTarget(null);
        }
    }

    const handleCanvasClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (selectedTarget) {
            setSelectedTarget(null);
        }
    }

    const generateBBS = () => {
        return Object.values(bbs).map((entry, idx) => {
            const isFigure = entry['type'] === 'figure';
            const id = `${OBJECT_ID_PREFIX}${entry['object_id']}`;
            const width = entry["width"] / entry["image_width"] * exampleWidth;
            const height = entry["height"] / entry["image_height"] * exampleHeight;
            const left = entry["left"] / entry["image_width"] * exampleWidth;
            const top = entry["top"] / entry["image_height"] * exampleHeight;
            return (
                <g
                    ref={(ref) => bbsRefs.current.push(ref)}
                    id={`${OBJECT_ID_PREFIX}${entry['object_id']}`}
                    key={`${OBJECT_ID_PREFIX}${entry['object_id']}`}
                    style={{
                        transform: `translate(${left}px, ${top}px) scale(${width}, ${height})`
                    }}
                >
                    <rect
                        x={0} y={0} 
                        width={1} height={1}
                        style={{
                            strokeWidth: 0,
                            stroke: (isFigure ? 'green' : 'blue'),
                            fill: (isFigure ? 'greenyellow' : 'skyblue'),
                            opacity: 0.5,
                        }}
                        onClick={handleRectClick}
                    />
                </g>
            );
        });
    }

    const addFigureBB = () => {
        const id = idCnt;
        dispatch(addBB(
            {
                bb: {
                    slide_deck_id: exampleDeckId,
                    slide_id: exampleId,
                    image_height: exampleHeight,
                    image_width: exampleWidth,
                    type: 'figure',
                    conf: 100,
                    left: 100 + id * 10,
                    top: 100 + id * 10,
                    width: 50,
                    height: 50,
                    object_id: id,
                }
            }
        ));
    }

    const addTextBB = () => {
        const id = idCnt;
        dispatch(addBB(
            {
                bb: {
                    slide_deck_id: exampleDeckId,
                    slide_id: exampleId,
                    image_height: exampleHeight,
                    image_width: exampleWidth,
                    type: 'text',
                    conf: 100,
                    left: 100 + id * 10,
                    top: 100 + id * 10,
                    width: 50,
                    height: 50,
                    object_id: id,
                }
            }
        ));
    }

    const handleOnDrag = ({
        target,
        transform,
    }) => {
        target.style.transform = transform;
    };
    const handleOnDragEnd = ({
        target, isDrag, lastEvent
    }) => {
        if (isDrag) {
            const {left, top} = lastEvent;
            const id = target.id;
            const object_id = parseInt(id.slice(OBJECT_ID_PREFIX.length));
            console.log(left, top);
            dispatch(updateBB({
                id: object_id,
                change: {
                    left: bbs[object_id]["left"] + left,
                    top: bbs[object_id]["top"] + top
                }
            }))
        }
    };

    const handleOnScale = ({
        target,
        scale, drag 
    }) => {
        target.style.transform
            = `translate(${drag.beforeTranslate[0]}px, ${drag.beforeTranslate[1]}px)`
            + `scale(${scale[0]}, ${scale[1]})`;
    };
    const handleOnScaleEnd = ({
        target, lastEvent
    }) => {
        const {scale, drag} = lastEvent;
        const {left, top} = drag;
        const id = target.id;
        const object_id = parseInt(id.slice(OBJECT_ID_PREFIX.length));
        dispatch(updateBB({
            id: object_id,
            change: {
                width: scale[0],
                height: scale[1],
                left: bbs[object_id]["left"] + left,
                top: bbs[object_id]["top"] + top
            }
        }))
    };

    return (
        <div>
            <div style={
                {
                    pointerEvents: loading ? 'none' : 'all',
                    visibility: loading ? 'hidden' : 'visible',
                    overflow: "hidden",
                    display: "flex",
                    justifyContent: 'left',
                    gap: '2em',
                    margin: '1em',
                }
            }>
                <button onClick={addFigureBB}> Add Figure Box </button>
                <button onClick={addTextBB}> Add Text Box </button>
                {
                    selectedTarget ? <button onClick={handleDelClick}> Delete </button> : null
                }
            </div>
            <div ref={parentRef} style={
                {
                    pointerEvents: loading ? 'none' : 'all',
                    visibility: loading ? 'hidden' : 'visible',
                    overflow: "hidden",
                    width: exampleWidth,
                    height: exampleHeight,
                    display: "flex",
                    justifyContent: 'center',
                    margin: '1em 1em',
                }
            }>

                <svg 
                    version="1.1" baseProfile="full" width={exampleWidth} height={exampleHeight} xlmns="http://www/w3/org/2000/svg"
                    // style={{
                    //     transformBox: "fill-box",
                    // }}
                    onClick={handleCanvasClick}
                >
                    <image xlinkHref={exampleUrl} width={exampleWidth} height={exampleHeight} preserveAspectRatio="xMaxYMid slice"/>
                    { generateBBS() }
                </svg>
                <Moveable
                    target={selectedTarget}
                    container={document.body}
                    origin={false}
                    edge={false}

                    draggable={true}
                    resizable={false}
                    scalable={true}
                    rotatable={false}
                    warpable={false}
                    pinchable={false}
                    
                    keepRatio={false}
                    throttleDrag={0}
                    throttleResize={0}
                    throttleScale={0}
                    throttleRotate={0}

                    onDrag={handleOnDrag}
                    onDragEnd={handleOnDragEnd}

                    onScale={handleOnScale}
                    onScaleEnd={handleOnScaleEnd}
                />
            </div>
            <div style={
                {
                    pointerEvents: loading ? 'none' : 'all',
                    visibility: loading ? 'hidden' : 'visible',
                    overflow: "hidden",
                    display: "flex",
                    justifyContent: 'left',
                    gap: '2em',
                    margin: '1em',
                }
            }>
                <button onClick={handleOnProcess}> Process </button>
            </div>
        </div>
    );
}

export default ExampleCanvas;