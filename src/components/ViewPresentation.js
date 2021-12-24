import { useState } from 'react';
import ReactGoogleSlides from 'react-google-slides';
import {Alert} from 'reactstrap';

const LINK_PREFIX = 'https://docs.google.com/presentation/d/';

function ViewPresentation(props) {
    if (props.presentationId === null) {
        return (
            <Alert color="primary">
                Please select a Presentation!!
            </Alert>
        );
    }
    return (
        <div style={{
            margin: "2em",
        }}>
            <ReactGoogleSlides
                width={640}
                height={480}
                slidesLink={LINK_PREFIX + props.presentationId}
                slideDuration={0}
                position={1}
                showControls={true}
                loop={false}
            />
        </div>
    );
} 

export default ViewPresentation;