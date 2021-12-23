import ReactGoogleSlides from 'react-google-slides';
import {Alert} from 'reactstrap';
import { ERROR_SIGNAL } from '../reducers/presentationFiles';

const LINK_PREFIX = 'https://docs.google.com/presentation/d/';

function ViewPresentation(props) {
    if (props.presentationId === null) {
        return (
            <Alert color="primary">
                Please select a Presentation!!
            </Alert>
        );
    }
    if (props.presentationId === '') {
        return (
            <Alert color="primary">
                Please Wait! Extracting the Template!!
            </Alert>
        ); 
    }
    if (props.presentationId === ERROR_SIGNAL) {
        return (
            <Alert color="primary">
                Error Occured!!
            </Alert>
        );
    }
    return (
        <ReactGoogleSlides
            width={640}
            height={480}
            slidesLink={LINK_PREFIX + props.presentationId}
            slideDuration={0}
            position={1}
            showControls={true}
            loop={false}
        />
    );
} 

export default ViewPresentation;