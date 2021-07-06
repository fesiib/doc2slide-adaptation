// import logo from './logo.svg';
// import './App.css';
import './index.css';
import { useDispatch, useSelector } from 'react-redux';
import Authorize from './components/Authorize';
import FileManager from './components/FileManager';
import ViewPresentation from './components/ViewPresentation';
import { CREATION_SIGNAL, ERROR_SIGNAL, extractedFile } from './reducers/presentationFiles';
import { extract } from './services/SlidesAPI';
import { Container, Col, Row } from 'reactstrap';
import { appendPre } from './services/GoogleAPI';

function App() {
	const dispatch = useDispatch();

	const {selected, selectedExt} = useSelector(state => state.presentationFiles);

	const _extractedFile = (forId, id) => {
		dispatch(extractedFile({
			forId,
			id,
		}));
	}

	let _selectedExt = selectedExt;
	if (selectedExt === CREATION_SIGNAL) {
		_selectedExt = '';
		let forId = selected;
		extract(forId).then((result) => {
			_extractedFile(forId, result);
		}).catch((error) => {
			_extractedFile(forId, ERROR_SIGNAL);
			appendPre('Error: ' + error);
		});
	}

	return (
		<div>
			<Authorize/>
			<FileManager/>
			<Container>
				<Row>
					<Col xs="5" className="m-5">
						<ViewPresentation presentationId={selected}/>
					</Col>
					<Col xs="5" className="m-5">
						<ViewPresentation presentationId={_selectedExt}/>
					</Col>
				</Row>
			</Container>
		</div>
	);
}

export default App;