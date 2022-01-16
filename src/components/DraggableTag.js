import React from 'react';

const TAG_STYLES = {
    'fontFamily': {
        margin: '2px',
        fontSize: '12px',
        fontWeight: 'bold',
        border: '1px dashed #cccccc',
        borderRadius: '2px',
        padding: '1px',
        lineHeight: '15px',
        color: '#FFFFFF',
        background: 'rgba(255, 0, 0, 0.9)',
    },
    'text': {
        margin: '2px',
        fontSize: '12px',
        fontWeight: 'bold',
        border: '1px dashed #cccccc',
        borderRadius: '2px',
        padding: '1px',
        lineHeight: '15px',
        color: '#FFFFFF',
        background: 'rgba(0, 0, 255, 0.9)',    
    },
    'figure': {
        margin: '2px',
        fontSize: '12px',
        fontWeight: 'bold',
        border: '1px dashed #cccccc',
        borderRadius: '2px',
        padding: '1px',
        lineHeight: '15px',
        color: '#FFFFFF',
        background: 'rgba(0, 255, 0, 0.9)',        
    }
}

function DraggableTag(props) {
    const tagClass = props.tagClass;
    const content = props.content;
    return (
        <div
            style={TAG_STYLES[tagClass]}
        >
            {content}
        </div>
    );
}

export default DraggableTag;