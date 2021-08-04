// import logo from './logo.svg';
// import './App.css';
import './index.css';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Col, Row, Button } from 'reactstrap';

import Authorize from './components/Authorize';
import FileManager from './components/FileManager';
import ViewPresentation from './components/ViewPresentation';
import InputContent, { COMPILING, EXTRACTING, loadingActivate, loadingDeactivate } from './components/InputContent';
import InputContentDoc from './components/InputContentDoc';

import { CREATION_SIGNAL, ERROR_SIGNAL, extractedFile } from './reducers/presentationFiles';

import { extract, testPresentation, justUploadPresentation } from './services/SlidesTemplateServerAPI';
import { processContentDoc } from './services/TextAPI';

function App() {
	const dispatch = useDispatch();

	const {selected, selectedExt, files} = useSelector(state => state.presentationFiles);
	const { title, sections, titleResult, sectionsResult, shouldUpdate } = useSelector(state => state.contentDoc);

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
		_extractedFile(forId, '');
		extract(forId).then((result) => {
			let presentationId = result.presentationId;
			// let templates = result.templates;
			// _extractedTemplates(forId, templates);
			_extractedFile(forId, presentationId);
			loadingDeactivate(EXTRACTING);
		}).catch((error) => {
			_extractedFile(forId, ERROR_SIGNAL);
			console.log("Error: ", error)
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


	const testAll = (event) => {
        loadingActivate(COMPILING);
		event.target.active = true;
		processContentDoc({title, sections}, {title: titleResult, sections: sectionsResult}, shouldUpdate)
		.then((response) => {
			let resources = {
				...response,
			};
			let testSessions = [];
			for (let presentation of files) {
				let copies = 4;
				testSessions.push(testPresentation(presentation.id, copies, resources));
			}
			Promise.all(testSessions)
			.then((response) => {
				loadingDeactivate(COMPILING);
				event.target.active = false;
			});                
		}).catch((error) => {
			console.log('Couldn`t Test: ', error);
			loadingDeactivate(COMPILING);
			event.target.active = false;
		});
    }

	const uploadAll = (event) => {
		loadingActivate(EXTRACTING);
		event.target.active = true;
		let uploadSessions = [];
		for (let presentation of files) {
			uploadSessions.push(justUploadPresentation(presentation.id));
		}
		Promise.all(uploadSessions)
		.then((response) => {
			loadingDeactivate(EXTRACTING);
			event.target.active = false;
		});        
	}

	return (
		<div>
			<Authorize/>
			<FileManager/>
			<InputContent className='m-5'/>
			<InputContentDoc className='m-5'/>
			<Container>
				<Button
						className = "w-25 max-h-50 m-2"
						onClick = {uploadAll}
						color="primary"
					> Upload ALL </Button>
				<Button
						className = "w-25 max-h-50 m-2"
						onClick = {testAll}
						color="primary"
					> Test ALL </Button>
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