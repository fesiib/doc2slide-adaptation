// import logo from './logo.svg';
// import './App.css';
import './index.css';
import { useDispatch, useSelector } from 'react-redux';
import Authorize from './components/Authorize';
import FileManager from './components/FileManager';
import ViewPresentation from './components/ViewPresentation';
import { CREATION_SIGNAL, ERROR_SIGNAL, extractedFile } from './reducers/presentationFiles';
import { extract, tryFitContent } from './services/SlidesAPI';
import { Container, Col, Row } from 'reactstrap';
import { appendPre } from './services/GoogleAPI';

const CONTENT = {
	header: 'Introduction',
	body: [
		'Communication takes place over time, and the presenter’s timed rehearsals, attention to timekeeping, and rhythm of spoken delivery all affect audience perceptions.',
		'Presentations are a crucial form of modern communication, yet there is a dissonance between everyday practices with presentation tools and best practices from the presentation literature.',
		'The activity of preparing and delivering presentations, whether to teach, inform, or persuade, is of critical importance across education, academia, and business.',
		'Our goal was therefore to uncover the gap between actual presentation practices and the “best practices” advocated in the presentation literature, before designing tools that help presenters to bridge that gap.',
	],
}

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
			let presentationId = result;
			tryFitContent({ ...CONTENT }, presentationId).then((result) => {
				console.log("Result: ", result);
				_extractedFile(forId, presentationId);
			}).catch((error) => {
				appendPre('Couldn\`t fit content: ' + error);
			});
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