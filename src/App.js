// import logo from './logo.svg';
// import './App.css';
import './index.css';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Col, Row, } from 'reactstrap';

import Authorize from './components/Authorize';
import FileManager from './components/FileManager';
import ViewPresentation from './components/ViewPresentation';
import InputContent, { EXTRACTING, loadingActivate, loadingDeactivate } from './components/InputContent';
import InputContentDoc from './components/InputContentDoc';
import ComparisonTableContainer from './components/ComparisonTableContainer';

import { CREATION_SIGNAL, ERROR_SIGNAL, extractedFile, extractedTemplates, updatePageCnt } from './reducers/presentationFiles';

import { extract } from './services/slideAdapter';
import { uploadPresentation_v2 } from './services/layoutStylesAdapter';

function App() {
	const dispatch = useDispatch();

	const { selected, selectedExt, } = useSelector(state => state.presentationFiles);

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

	const _updatePageCnt = (pageCnt) => {
		dispatch(updatePageCnt({
			pageCnt,
		}));
	}

	let _selectedExt = selectedExt;
	if (selectedExt === CREATION_SIGNAL) {
		_selectedExt = '';
		let forId = selected;
		_extractedFile(forId, '');
		uploadPresentation_v2(forId).then((result) => { // can be changed to extract
			let presentationId = result.presentationId;
			let templates = result.templates;
			_extractedTemplates(forId, templates);
			_updatePageCnt(templates.__templates.length);
			_extractedFile(forId, presentationId);
			loadingDeactivate(EXTRACTING);
		}).catch((error) => {
			_extractedFile(forId, ERROR_SIGNAL);
			console.log("Error: ", error)
		});
	}
	
	useEffect(() => {
		if (selectedExt === CREATION_SIGNAL 
			|| selectedExt === ''
		) {
			loadingActivate(EXTRACTING);
		}
		else if (selectedExt === ERROR_SIGNAL 
			|| selectedExt === null 
			|| selectedExt === undefined
		) {
			loadingActivate(EXTRACTING, 'none');
		}
		else {
			loadingDeactivate(EXTRACTING);
		}
	});

	return (
		<div>
			<Authorize/>
			<FileManager/>
			<InputContentDoc className='m-5'/>
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
			<ComparisonTableContainer className=""/>
		</div>
	);
}

export default App;