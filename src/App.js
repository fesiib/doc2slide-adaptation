// import logo from './logo.svg';
// import './App.css';
import './index.css';

import Authorize from './components/Authorize';
import ViewPresentation from './components/ViewPresentation';
import ExamplesGallery from './components/ExamplesGallery';
import Example, { EXPERIMENTAL_PRESENTATION_ID } from './components/Example';
import { useSelector } from 'react-redux';
import { generateAllSlides } from './services/slideAdapter';
import EXAMPLES_LIST from './services/ExamplesList';
import ExampleCanvas from './components/ExampleCanvas';
import { useRef } from 'react';



function App() {
	const adaptAll = () => {
		generateAllSlides(EXAMPLES_LIST, EXPERIMENTAL_PRESENTATION_ID)
	}

	return (
		<div>
			<Authorize/>
			<ExamplesGallery/>
			<button onClick={adaptAll} style={{
				margin: "2em"
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