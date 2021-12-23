// import logo from './logo.svg';
// import './App.css';
import './index.css';

import Authorize from './components/Authorize';
import ViewPresentation from './components/ViewPresentation';
import ExamplesGallery from './components/ExamplesGallery';

const EXPERIMENTAL_PRESENTATION_ID = "16AP3S-EPxG7Sqls2LtZkJBm7pkjqy2ZoHNWjU6Wp_eo";

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