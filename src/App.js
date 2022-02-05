// import logo from './logo.svg';
// import './App.css';
import './index.css';

import Authorize from './components/Authorize';
import ViewPresentation from './components/ViewPresentation';
import ExamplesGallery from './components/ExamplesGallery';
import Example, { EXPERIMENTAL_PRESENTATION_ID } from './components/Example';
import { useDispatch, useSelector } from 'react-redux';
import { generateAllSlides } from './services/slideAdapter';
import EXAMPLES_LIST from './services/ExamplesList';
import ExampleCanvas from './components/ExampleCanvas';
import InputContent from './components/InputContent';
import { useRef } from 'react';
import { activateLoading, deactivateLoading } from './reducers/loadingState';



function App() {
	const dispatch = useDispatch();
    const { loading } = useSelector(state => state.loadingState);

	const adaptAll = () => {
		if (loading) {
            return;
        }
        dispatch(activateLoading());
		generateAllSlides(EXAMPLES_LIST, EXPERIMENTAL_PRESENTATION_ID).then((response) => {
            console.log(response);
            dispatch(deactivateLoading());
        }).catch((reason) => {
            dispatch(deactivateLoading());
            console.log(reason);
        });
	}

	return (
		<div>
			<Authorize/>
			<InputContent/>
			<ExamplesGallery/>
			<button onClick={adaptAll} style={{
				margin: "2em",
				visibility: loading ? 'hidden' : 'visible',
			}}> Adapt All </button>

			<div style={{
				margin: "2em",
				display: "flex",
				flexDirection: "row",
				gap: "1em",
				flexWrap: "wrap",
			}}>
				<ViewPresentation
					presentationId={EXPERIMENTAL_PRESENTATION_ID}
				/>
				<ExampleCanvas/>
			</div>
		</div>
	);
}

export default App;