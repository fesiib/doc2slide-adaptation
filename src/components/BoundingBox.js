import React from 'react';
import DraggableTag from './DraggableTag';

function BoundingBox(props) {
    const moveable = props.moveable;
    const customRef = props.customRef;
    const isFigure = props.isFigure;
    const id = props.id;
    const width = props.width;
    const height = props.height;
    const left = props.left;
    const top = props.top;
    const onRectClick = props.onRectClick;
    const groupAreas = props.groupAreas;

    if (moveable) {
        return (
            <g
                ref={customRef}
                id={id}
                style={{
                    transform: `translate(${left}px, ${top}px) scale(${width}, ${height})`
                }}
            >
                <rect
                    x={0} y={0} 
                    width={1} height={1}

                    fill={isFigure ? 'greenyellow' : 'skyblue'}
                    fillOpacity={0.5}
                    onClick={onRectClick}

                    vectorEffect={'non-scaling-stroke'}
                    stroke={isFigure ? 'green' : 'blue'}
                    strokeWidth={5}
                />
            </g>
        );
    }
    const initialTags = [
        {id: `${id}1`, content: (<DraggableTag tagClass={'fontFamily'} content={'Arial'}/>)},
        {id: `${id}2`, content: (<DraggableTag tagClass={'fontFamily'} content={'Roboto'} />)},
        {id: `${id}0`, content: (<DraggableTag tagClass={isFigure ? 'figure': 'text'} content={isFigure ? 'Figure': 'Text'} />)},
    ]

    const DraggableArea = groupAreas.addArea();

    return (
        <g>
            <g
                ref={customRef}
                id={id}
            >
                <rect
                    x={left} y={top} 
                    width={width} height={height}

                    vectorEffect={'non-scaling-stroke'}
                    stroke={isFigure ? 'green' : 'blue'}
                    strokeWidth={5}
                    fillOpacity={0}
                />
                <foreignObject
                    x={left} y={top} 
                    width={width} height={height}
                >
                    <div>
                        <DraggableArea
                            style={{
                                border: '1px solid #E9E9E9',
                                borderRadius: '4px',
                                width: `${width}px`,
                                height: `${height}px`,
                                padding: '5px',
                                display: 'flex',
                                justifyContent: 'right',
                            }}
                            tags={initialTags}
                            render={({tag, index}) => (
                                <div id={index} key={index}>
                                    {tag.content}
                                </div>
                            )}
                            onChange={tags => console.log(tags)}
                        /> 
                    </div>
                </foreignObject>
            </g>    
        </g>
    );
}

export default BoundingBox;