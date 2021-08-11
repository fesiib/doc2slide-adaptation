import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";

import { Container, Button, Input, Label, Alert } from 'reactstrap';

import { UPLOADING, COMPILING, EXTRACTING, loadingActivate, loadingDeactivate } from './InputContent';

import { addFile, selectFile } from '../reducers/presentationFiles';

import { testPresentation, justUploadPresentation, comparePresentation } from '../services/slideAdapter';
import { processContentDoc, processContent } from '../services/contentProcessing';
import { uploadToFolder } from '../services/apis/DriveAPI';
import { parsePresentations } from "../services/apis/DriveAPI";
import { resetApp } from "../reducers";

const PRESENTATION_LINK_PREFIX = "https://docs.google.com/presentation/d/";

function FileManager(props) {
    const dispatch = useDispatch();

    const {cnt, files, selected} = useSelector(state => state.presentationFiles);


	const { title, sections, titleResult, sectionsResult, shouldUpdateDoc } = useSelector(state => state.contentDoc);
    const { header, body, headerResult, bodyResult, shouldUpdate } = useSelector(state => state.content);
	const [ uploadValue, setUploadValue ] = useState('');

    const _selectFile = (name, id) => {
        dispatch(selectFile({
            name,
            id,
        }));
    }

    const _addFile = (name, id) => {
        dispatch(addFile({
            name,
            id,
        }));
    }

    const listPresentationFiles = () => {
        if (cnt <= 0) {
            return (
                <Alert color="primary">
                    No presentation files found!
                </Alert>
            );
        }
        return files.map((el, index) => {
             let active = (selected === el.id);
            return (
                <Button 
                    key={index.toString()}
                    className = "w-25 max-h-50 m-2"
                    onClick = {(() => _selectFile(el.name, el.id))}
                    color="primary" active={active}
                > 
                    {el.name} 
                </Button>
            );
        });
    }

    const refreshAll = (event) => {
        dispatch(resetApp());
		const callbackForEachPresentation = _addFile;
        parsePresentations(callbackForEachPresentation);
    }


    const testAll = (event) => {
        loadingActivate(COMPILING);
		event.target.active = true;
		processContentDoc({title, sections}, {title: titleResult, sections: sectionsResult}, shouldUpdateDoc)
		.then((response) => {
			let resources = {
				...response,
			};
			let testSessions = [];
			for (let presentation of files) {
				let copies = 1;
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

    const compareAll = (event) => {
        loadingActivate(COMPILING);
		event.target.active = true;
        processContent({header, body}, {header: headerResult, body: bodyResult}, shouldUpdate)
		.then((response) => {
			let resources = {
				...response,
			};
			let testSessions = [];
			for (let presentation of files) {
				testSessions.push(comparePresentation(presentation.id, true, resources));
			}
			Promise.all(testSessions)
			.then((response) => {
				loadingDeactivate(COMPILING);
				event.target.active = false;
			});                
		}).catch((error) => {
			console.log('Couldn`t Compare: ', error);
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

	const uploadFile = (event) => {
		let link = uploadValue;
		if (!link.startsWith(PRESENTATION_LINK_PREFIX)) {
			alert('Incorrect link format!');
			return;
		}
		let suffix = link.slice(PRESENTATION_LINK_PREFIX.length);
		let rightId = suffix.indexOf('/');
		if (rightId <= 0) {
			alert('Incorrect link format!');
			return;	
		}
		let presentationId = suffix.slice(0, rightId);
		loadingActivate(UPLOADING);
		uploadToFolder(presentationId).then((response) => {
			console.log("Upload Result", response);
			const callbackForEachPresentation = _addFile;
			parsePresentations(callbackForEachPresentation);
			loadingDeactivate(UPLOADING);
		}).catch((error) => {
			alert("Couldn't upload " + error);
		});
	}

    return (
        <div>
            <div className = "border border-primary shadow" 
                id='toAllFiles'
                style={cnt === -1 ? {display: 'none'} : {display: 'block'}}>
                <Button
                        className = "w-25 max-h-50 m-2"
                        onClick = {refreshAll}
                        color="danger"
                    > Refresh ALL </Button>
                <Button
                        className = "w-25 max-h-50 m-2"
                        onClick = {uploadAll}
                        color="info"
                    > Upload ALL </Button>
                <Button
                        className = "w-25 max-h-50 m-2"
                        onClick = {testAll}
                        color="info"
                    > Test ALL </Button>
                <Button
                        className = "w-25 max-h-50 m-2"
                        onClick = {compareAll}
                        color="info"
                    > Compare ALL </Button>
                <Container className="row m-5">
                    <Label for='uploadElement'> Google Share Link: </Label>
                    <Input 
                        id='uploadElement'
                        className="m-2 w-50 shadow"
                        onChange={(event) => setUploadValue(event.target.value)}
                        value={uploadValue}
                    />	
                    <Button
                        className = "w-25 m-2"
                        onClick = {uploadFile}
                        color="info"
                    >
                        Upload Presentation
                    </Button>
                </Container>
            </div>
            <div>
                {listPresentationFiles()}
            </div>
        </div>
    );
}

export default FileManager;