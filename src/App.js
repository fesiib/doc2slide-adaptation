// import logo from './logo.svg';
// import './App.css';
import './index.css';

import Authorize from './components/Authorize';
import ViewPresentation from './components/ViewPresentation';
import ExamplesGallery from './components/ExamplesGallery';
import { EXPERIMENTAL_PRESENTATION_ID } from './components/Example';



function App() {

	return (
		<div>
			<Authorize/>
			<ExamplesGallery/>
			<ViewPresentation
				presentationId={EXPERIMENTAL_PRESENTATION_ID}
			/>
		</div>
	);
}

export default App;