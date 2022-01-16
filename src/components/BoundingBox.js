import React from 'react';

function BoundingBox(props) {
    const customRef = props.customRef;
    const isFigure = props.isFigure;
    const id = props.id;
    const width = props.width
    const height = props.height
    const left = props.left;
    const top = props.top;
    const onRectClick = props.onRectClick
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

export default BoundingBox;