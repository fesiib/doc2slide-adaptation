import { useState } from 'react';
import ReactGoogleSlides from 'react-google-slides';
import { useSelector } from 'react-redux';
import {Alert} from 'reactstrap';

const LINK_PREFIX = 'https://docs.google.com/presentation/d/';

function ViewPresentation(props) {
    const { loading } = useSelector(state => state.loadingState);

    if (props.presentationId === null) {
        return (
            <Alert color="primary">
                Please select a Presentation!!
            </Alert>
        );
    }

    const presentation_link = loading ? LINK_PREFIX + 'something' : LINK_PREFIX + props.presentationId;
    console.log(presentation_link);
    return (
        <div style={{
            margin: "2em",
        }}>
            <ReactGoogleSlides
                width={640}
                height={480}
                slidesLink={presentation_link}
                slideDuration={0}
                position={1}
                showControls={true}
                loop={false}
            />
        </div>
    );
} 

export default ViewPresentation;