import { useState } from 'react';
import ReactGoogleSlides from 'react-google-slides';
import { useSelector } from 'react-redux';
import {Alert} from 'reactstrap';

const LINK_PREFIX = 'https://docs.google.com/presentation/d/';

const LOADING_GIF = 'https://i.stack.imgur.com/MEBIB.gif';

function ViewPresentation(props) {
    const { loading } = useSelector(state => state.loadingState);
    if (props.presentationId === null) {
        return (
            <Alert color="primary">
                Please select a Presentation!!
            </Alert>
        );
    }
    const presentation_link = LINK_PREFIX + props.presentationId;
    return (
        <div style={{
            margin: "2em",
        }}>
            {
                !loading ?
                (
                    <ReactGoogleSlides
                        width={640}
                        height={480}
                        slidesLink={presentation_link}
                        slideDuration={0}
                        position={1}
                        showControls={true}
                        loop={false}
                    />
                ) : (
                    <img src={LOADING_GIF} width={640} height={480} style={{
                        objectFit: 'none',
                        objectPosition: '50% 50%'
                    }}/>
                )
            }
        </div>
    );
} 

export default ViewPresentation;