import React, { useRef, useState } from 'react';
import Moveable from 'react-moveable';
import  {DraggableAreasGroup } from 'react-draggable-tags';

import { useDispatch, useSelector } from 'react-redux';

import { addBB, delBB, selectExample, updateBB } from '../reducers/example';
import { activateLoading, deactivateLoading } from '../reducers/loadingState';
import { generateSlideFromBBS, getExampleURL } from '../services/slideAdapter';

import BoundingBox from './BoundingBox';
import { EXPERIMENTAL_PRESENTATION_ID } from './Example';

const DELETE_ICON = '../icons/delete.svg';
const OBJECT_ID_PREFIX = 'object_';


function ExampleCanvas(props) {
    const dispatch = useDispatch();

    const { loading } = useSelector(state => state.loadingState);
	const {exampleDeckId, exampleId, bbs, idCnt} = useSelector(state => state.example);

    const [selectedTarget, setSelectedTarget] = useState(null);

    const bbsRefs = useRef([]);

    const exampleUrl = getExampleURL(exampleDeckId, exampleId);

    const exampleWidth = 650;
    const exampleHeight = exampleWidth * (9/16);
    
    const exampleGroupAreas = new DraggableAreasGroup();

    const handleOnProcess = (event) => {
        if (loading) {
            return;
        }
        dispatch(activateLoading());
        generateSlideFromBBS(exampleUrl, Object.values(bbs), EXPERIMENTAL_PRESENTATION_ID, 1).then((response) => {
            console.log(response);
            dispatch(deactivateLoading());
            dispatch(selectExample({exampleDeckId, exampleId}));
            if (response.exampleInfo.hasOwnProperty('elements')) {
                const elements = response.exampleInfo.elements;
                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i];
                    element["object_id"] = i;
                    dispatch(addBB({bb: element}));
                }
            }
            window.location.reload();
        }).catch((reason) => {
            dispatch(deactivateLoading());
            console.log(reason);
        });
    }

    const handleRectClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const id = event.target.parentElement.id;
        const bbRef = bbsRefs.current.find((ref, idx) => {
            return ref && ref.id === id;
        });
        if (bbRef)
            setSelectedTarget(bbRef);
    }
    const handleDelClick = (event) => {
        const target = selectedTarget;
        if (target) {
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
                <BoundingBox 
                    moveable={false}
                    customRef={(ref) => bbsRefs.current.push(ref)}
                    isFigure={isFigure}
                    id={id}
                    width={width}
                    height={height}
                    left={left}
                    top={top}
                    key={id}
                    onRectClick={handleRectClick}
                    groupAreas={exampleGroupAreas}
                />
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
        if (isDrag && lastEvent) {
            const {left, top} = lastEvent;
            const id = target.id;
            const object_id = parseInt(id.slice(OBJECT_ID_PREFIX.length));
            dispatch(updateBB({
                id: object_id,
                change: {
                    left: bbs[object_id]["left"] + left / exampleWidth * bbs[object_id]["image_width"],
                    top: bbs[object_id]["top"] + top / exampleHeight * bbs[object_id]["image_height"]
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
                width: scale[0] / exampleWidth * bbs[object_id]["image_width"],
                height: scale[1] / exampleHeight * bbs[object_id]["image_height"],
                left: bbs[object_id]["left"] + left / exampleWidth * bbs[object_id]["image_width"],
                top: bbs[object_id]["top"] + top / exampleHeight * bbs[object_id]["image_height"]
            }
        }))
    };

    return (<svg 
        version="1.1" baseProfile="full" width={exampleWidth} height={exampleHeight} xlmns="http://www/w3/org/2000/svg"
    >
        <image xlinkHref={exampleUrl} width={exampleWidth} height={exampleHeight} preserveAspectRatio="xMaxYMid slice"/>
    </svg>)

    return (
        <div>
            <div style={{
                    pointerEvents: loading ? 'none' : 'all',
                    visibility: loading ? 'hidden' : 'visible',
                    overflow: "hidden",
                    display: "flex",
                    justifyContent: 'left',
                    gap: '2em',
                    margin: '1em',
                }}
                key={'above_buttons'}
            >
                <button onClick={addFigureBB}> Add Figure Box </button>
                <button onClick={addTextBB}> Add Text Box </button>
                {
                    selectedTarget ? <button onClick={handleDelClick}> Delete </button> : null
                }
            </div>
            <div style={{
                    pointerEvents: loading ? 'none' : 'all',
                    visibility: loading ? 'hidden' : 'visible',
                    overflow: "hidden",
                    width: exampleWidth,
                    height: exampleHeight,
                    display: "flex",
                    justifyContent: 'center',
                    margin: '1em 1em',
                }}
                key={'canvas'}
            >

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
                    edge={true}

                    draggable={true}
                    resizable={false}
                    scalable={true}
                    rotatable={false}
                    warpable={false}
                    pinchable={false}
                    
                    keepRatio={false}
                    throttleDrag={1}
                    throttleResize={0}
                    throttleScale={1}
                    throttleRotate={0}

                    onDrag={handleOnDrag}
                    onDragEnd={handleOnDragEnd}

                    onScale={handleOnScale}
                    onScaleEnd={handleOnScaleEnd}
                />
            </div>
            <div style={{
                    pointerEvents: loading ? 'none' : 'all',
                    visibility: loading ? 'hidden' : 'visible',
                    overflow: "hidden",
                    display: "flex",
                    justifyContent: 'left',
                    gap: '2em',
                    margin: '1em',
                }}
                key={'below_buttons'}
            >
                <button onClick={handleOnProcess}> Process </button>
            </div>
        </div>
    );
}

export default ExampleCanvas;