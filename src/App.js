// import logo from './logo.svg';
// import './App.css';
import './index.css';
import { useDispatch, useSelector } from 'react-redux';
import Authorize from './components/Authorize';
import FileManager from './components/FileManager';
import ViewPresentation from './components/ViewPresentation';
import { CREATION_SIGNAL, ERROR_SIGNAL, extractedFile, extractedTemplates } from './reducers/presentationFiles';
import { extract } from './services/SlidesAPI';
import { Container, Col, Row } from 'reactstrap';
import { appendPre } from './services/GoogleAPI';
import InputContent, { EXTRACTING, loadingActivate, loadingDeactivate } from './components/InputContent';
import { useEffect } from 'react';

function App() {
	const dispatch = useDispatch();

	const {selected, selectedExt} = useSelector(state => state.presentationFiles);

	const _extractedFile = (forId, id) => {
		dispatch(extractedFile({
			forId,
			id,
		}));
	}

	const _extractedTemplates = (forId, templates) => {
		dispatch(extractedTemplates({
			forId,
			templates,
		}));
	}

	let _selectedExt = selectedExt;
	if (selectedExt === CREATION_SIGNAL) {
		_selectedExt = '';
		let forId = selected;

		_extractedFile(forId, '');
		extract(forId).then((result) => {
			let presentationId = result.id;
			let templates = result.templates;
			_extractedTemplates(forId, templates);
			_extractedFile(forId, presentationId);
			loadingDeactivate(EXTRACTING);
		}).catch((error) => {
			_extractedFile(forId, ERROR_SIGNAL);
			appendPre('Error: ' + error);
		});
	}
	
	useEffect(() => {
		if (selectedExt === CREATION_SIGNAL
			|| selectedExt === ERROR_SIGNAL 
			|| selectedExt === null 
			|| selectedExt === undefined 
			|| selectedExt === ''
		) {
			loadingActivate(EXTRACTING);
		}
		else {
			loadingDeactivate(EXTRACTING);
		}
	});
	return (
		<div>
			<Authorize/>
			<FileManager/>
			<InputContent className='m-5'/>
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