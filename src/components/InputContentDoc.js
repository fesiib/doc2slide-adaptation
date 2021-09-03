import { useDispatch, useSelector } from 'react-redux';
import {
    Form, FormGroup, Label, Input, Button,
    Spinner,
} from 'reactstrap';

import { changeTitleContent, changeSectionsContent, compileDocContent } from '../reducers/contentDoc';
import { extractedFile, updatePageCnt } from '../reducers/presentationFiles';

import { generatePresentation } from '../services/slideAdapter';
import { processContentDoc } from '../services/contentProcessing';

import { COMPILING, loadingActivate, loadingDeactivate } from './InputContent';
import { adaptDuplicatePresentation, generatePresentation_v2 } from '../services/layoutStylesAdapter';

function InputContentDoc(props) {
    const dispatch = useDispatch();

    const { title, sections, titleResult, sectionsResult, shouldUpdateDoc } = useSelector(state => state.contentDoc);

    const { selected, selectedExt } = useSelector(state => state.presentationFiles);

    const _changeTitleContent = (text) => {
        dispatch(changeTitleContent({
            text,
        }));
    };

    const _changeSectionsContent = (text, pos) => {
        dispatch(changeSectionsContent({
            text,
            pos,
        }));
    };
    
    const _compileContent = (titleResult, sectionsResult) => {
        dispatch(compileDocContent({
            titleResult,
            sectionsResult,
        }));
    }

    const _extractedFile = (forId, id) => {
		dispatch(extractedFile({
			forId,
			id,
		}));
	}

    const _updatePageCnt = (pageCnt) => {
		dispatch(updatePageCnt({
			pageCnt,
		}));
	}

    const forceUpdateSelected = () => {
        let prev = selectedExt;
        _extractedFile(selected, '');
        _extractedFile(selected, prev);
    }

    const submitHandler = (event) => {
        event.preventDefault();
        event.stopPropagation();
        loadingActivate(COMPILING);
        processContentDoc({title, sections}, {title: titleResult, sections: sectionsResult}, shouldUpdateDoc)
            .then((response) => {
                let resources = {
                    ...response,
                };
                adaptDuplicatePresentation(selected, resources.title.singleWord.text, resources).then((response) => {
                        let newPresentationId = response.presentationId;
                        _updatePageCnt(response.pageCnt);
                        loadingDeactivate(COMPILING);
                        _extractedFile(selected, newPresentationId);
                    }).catch((error) => {
                        console.log('Couldn`t generate Slide Deck: ', error);
                        loadingDeactivate(COMPILING);
                    });
                    _compileContent(resources.title, resources.sections);
            }).catch((error) => {
                console.log('Couldn`t generate Slide Deck: ', error);
                loadingDeactivate(COMPILING);
            });
    };

    // const submitHandler = (event) => {
    //     event.preventDefault();
    //     event.stopPropagation();
    //     loadingActivate(COMPILING);
    //     processContentDoc({title, sections}, {title: titleResult, sections: sectionsResult}, shouldUpdateDoc)
    //         .then((response) => {
    //             let resources = {
    //                 ...response,
    //             };
    //             generatePresentation_v2(selected, selectedExt, resources)
    //                 .then((response) => {
    //                     console.log("Generated Slide Deck: ", response);
    //                     _updatePageCnt(response.pageCnt);
    //                     loadingDeactivate(COMPILING);
    //                     forceUpdateSelected();
    //                 }).catch((error) => {
    //                     console.log('Couldn`t generate Slide Deck: ', error);
    //                     loadingDeactivate(COMPILING);
    //                 });
    //                 _compileContent(resources.title, resources.sections);
    //         }).catch((error) => {
    //             console.log('Couldn`t generate Slide Deck: ', error);
    //             loadingDeactivate(COMPILING);
    //         });
    // };

    const renderSectionsForm = () => {
        if (Array.isArray(sections)) {
            let result =  sections.map((value, idx_0) => {
                let idx = idx_0 + 1;
                let id = 'body' + idx.toString();

                let text = value.header + '\n';
                for (let part of value.body) {
                    text += part.paragraph + '\n';
                }
                return (
                    <FormGroup key={id}>
                        <Label for={id}> {'Section Text ' + idx.toString()} </Label>
                        <Input type="textarea" name={id} id={id} value={text} 
                            onChange={(event) => {
                                _changeSectionsContent(event.target.value, idx_0);
                            }}
                        />
                    </FormGroup>
                );
            });
            return result;
        }
        return [];
    }

    return (
        <div className={props.className} >
            <div style={ { display: 'block' } } id='contentDocForm'>
                <Form onSubmit={submitHandler}>
                    <FormGroup>
                        <Label for="title"> Title </Label>
                        <Input type="textarea" name="title" id="title" value={title} 
                            onChange={(event) => {
                                _changeTitleContent(event.target.value);
                            }}
                        />
                    </FormGroup>
                    {renderSectionsForm()}
                    <Button className='m-2' type='submit' color='success' > Compile Slide Deck </Button>
                </Form>
            </div>
            <div style={ { display: 'none' } } id='loading'>
                <Spinner style={{ width: '10rem', height: '10rem' } } children='' />
            </div>
        </div>
    );
}

export default InputContentDoc;