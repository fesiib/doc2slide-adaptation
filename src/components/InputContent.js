import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Form, FormGroup, Label, Input, Button,
    Spinner,
    DropdownItem, DropdownMenu, Dropdown, DropdownToggle,
    Container, Row, Col,
} from 'reactstrap';
import { changeBodyContent, changeHeaderContent, compileContent } from '../reducers/content';
import { addThumbnails, clearThumbnails, extractedFile, updatePageCnt } from '../reducers/presentationFiles';
import { generateAllSlides, generateSlide, generateBestSlide } from '../services/slideAdapter';
import { compareAllSlides } from '../services/slideComparator';
import { processContent } from '../services/textSummarization';

export const EXTRACTING = 'extracting';
export const COMPILING = 'compiling';
export const UPLOADING = 'uploading';

let loadingState = {
    extracting: false, 
    compiling: false,
    uploading: false,
};

const NOT_SELECTED = "Not Selected";

export function loadingActivate(process, loadingDisplay = 'block') {
    if (process === EXTRACTING) {
        loadingState.extracting = true;
    }
    if (process === COMPILING) {
        loadingState.compiling = true;
    }
    if (process === UPLOADING) {
        loadingState.uploading = true;
    }
    let divDocForm = document.getElementById('contentDocForm');
    let divForm = document.getElementById('contentForm');
    let divLoading = document.getElementById('loading');
    divForm.setAttribute('style', 'display: none');
    divDocForm.setAttribute('style', 'display: none');
    divLoading.setAttribute('style', 'display: ' + loadingDisplay);
}

export function loadingDeactivate(process) {
    if (process === EXTRACTING) {
        loadingState.extracting = false;
    }
    if (process === COMPILING) {
        loadingState.compiling = false;
    }
    if (process === UPLOADING) {
        loadingState.uploading = false;
    }
    if (!loadingState.extracting && !loadingState.compiling && !loadingState.uploading) {
        let divDocForm = document.getElementById('contentDocForm');
        let divForm = document.getElementById('contentForm');
        let divLoading = document.getElementById('loading');
        divForm.setAttribute('style', 'display: block');
        divDocForm.setAttribute('style', 'display: block');
        divLoading.setAttribute('style', 'display: none');
    }
}

function InputContent(props) {
    const dispatch = useDispatch();

    const { header, body, headerResult, bodyResult, shouldUpdate } = useSelector(state => state.content);

    const { selected, selectedExt, extractedPresentations, extPageCnt, } = useSelector(state => state.presentationFiles);

    const [pageIdDropdownOpen, setPageIdDropdownOpen] = useState(false);
    const [pageIdDropdownValue, setPageIdDropdownValue] = useState('');
    const [pageIdDropdownToggle, setPageIdDropdownToggle] = useState(NOT_SELECTED);


    const [indexDropdownOpen, setIndexDropdownOpen] = useState(false);
    const [indexDropdownValue, setIndexDropdownValue] = useState(0);
    const [indexDropdownToggle, setIndexDropdownToggle] = useState(NOT_SELECTED);

    const pageIdToggleDropdown = () => {
        setPageIdDropdownOpen(prevState => !prevState);
    }

    const indexToggleDropdown = () => {
        setIndexDropdownOpen(prevState => !prevState);
    }

    const _changeHeaderContent = (text) => {
        dispatch(changeHeaderContent({
            text,
        }));
    };

    const _changeBodyContent = (text, pos) => {
        dispatch(changeBodyContent({
            text,
            pos,
        }));
    };
    
    const _compileContent = (headerResult, bodyResult) => {
        dispatch(compileContent({
            headerResult,
            bodyResult,
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

    const _addThumbnails = (title, presentationId, imageLinks) => {
        dispatch(addThumbnails({
            title,
            presentationId,
            imageLinks,
        }));
    }

    const _clearThumbnails = () => {
        dispatch(clearThumbnails());
    }

    const forceUpdateSelected = () => {
        let prev = selectedExt;
        _extractedFile(selected, '');
        _extractedFile(selected, prev);
    }

    const submitSingleSlideHandler = (event) => {
        event.preventDefault();
        event.stopPropagation();
        loadingActivate(COMPILING);
        processContent({header, body}, {header: headerResult, body: bodyResult}, shouldUpdate)
            .then((response) => {
                let resources = {
                    ...response,
                };
                generateSlide(selected, selectedExt, indexDropdownValue, pageIdDropdownValue, resources)
                    .then((response) => {
                        console.log("Generated Single Slide: ", response);
                        loadingDeactivate(COMPILING);
                        if (indexDropdownValue > extPageCnt) {
                            _updatePageCnt(indexDropdownValue);
                        }
                        forceUpdateSelected();
                    }).catch((error) => {
                        console.log('Couldn`t generate Single Slide: ', error);
                        loadingDeactivate(COMPILING);
                    });
                    _compileContent(resources.header, resources.body);
            }).catch((error) => {
                console.log('Couldn`t generate Single Slide: ', error);
                loadingDeactivate(COMPILING);
            });
    };

    const submitAllSlidesHandler = (event) => {
        event.preventDefault();
        event.stopPropagation();
        loadingActivate(COMPILING);
        _clearThumbnails();
        processContent({header, body}, {header: headerResult, body: bodyResult}, shouldUpdate)
            .then((response) => {
                let resources = {
                    ...response,
                };
                generateAllSlides(selected, selectedExt, resources)
                    .then((response) => {
                        console.log("Generated All Slides: ", response);

                        /// requestThumbnails and append
                        compareAllSlides(
                            selected,
                            extractedPresentations[selected],
                            selectedExt
                        ).then((response) => {
                            console.log(response);
                            let original = { ...response.original };
                            let generated = { ...response.generated };
                            _addThumbnails(original.title, original.presentationId, original.imageLinks);
                            _addThumbnails(generated.title, generated.presentationId, generated.imageLinks);
                            _updatePageCnt(generated.imageLinks.length);
                            loadingDeactivate(COMPILING);
                            forceUpdateSelected();
                        });

                    }).catch((error) => {
                        console.log('Couldn`t generate All Slides: ', error);
                        loadingDeactivate(COMPILING);
                    });
                    _compileContent(resources.header, resources.body);
            }).catch((error) => {
                console.log('Couldn`t generate All Slides: ', error);
                loadingDeactivate(COMPILING);
            });
    }

    const submitBestSlideHandler = (event) => {
        event.preventDefault();
        event.stopPropagation();
        loadingActivate(COMPILING);
        processContent({header, body}, {header: headerResult, body: bodyResult}, shouldUpdate)
            .then((response) => {
                let resources = {
                    ...response,
                };
                generateBestSlide(selected, selectedExt, indexDropdownValue, resources)
                    .then((response) => {
                        console.log("Generated Best Slide: ", response);
                        loadingDeactivate(COMPILING);
                        if (indexDropdownValue > extPageCnt) {
                            _updatePageCnt(indexDropdownValue);
                        }
                        forceUpdateSelected();
                    }).catch((error) => {
                        console.log('Couldn`t generate Best Slide: ', error);
                        loadingDeactivate(COMPILING);
                    });
                    _compileContent(resources.header, resources.body);
            }).catch((error) => {
                console.log('Couldn`t generate Best Slide: ', error);
                loadingDeactivate(COMPILING);
            });
    }

    const renderBodyForm = () => {
        if (Array.isArray(body)) {
            let result =  body.map((value, idx_0) => {
                let idx = idx_0 + 1;
                let id = 'body' + idx.toString();
                let text = value.paragraph;
                return (
                    <FormGroup key={id}>
                        <Label for={id}> {'Body Text ' + idx.toString()} </Label>
                        <Input type="textarea" name={id} id={id} value={text} 
                            onChange={(event) => {
                                _changeBodyContent(event.target.value, idx_0);
                            }}
                        />
                    </FormGroup>
                );
            });
            return result;
        }
        return [];
    }

    const renderIndexDropdownItems = () => {
        if (indexDropdownValue > extPageCnt + 1) {
            setIndexDropdownValue(0);
            setIndexDropdownToggle(NOT_SELECTED);
        }
        let result = [];
        if (extPageCnt > 0) {
            for (let index = 1; index <= extPageCnt; index++) {
                let id = index.toString();
                result.push(
                    <DropdownItem
                        key={'index_' + id}
                        onClick={() => {
                            setIndexDropdownValue(index);
                            setIndexDropdownToggle(id);
                        }}
                    > 
                        {id} 
                    </DropdownItem>
                );
            }
            result.push(
                <DropdownItem
                    key={'index_last'}
                    onClick={() => {
                        setIndexDropdownValue(extPageCnt + 1);
                        setIndexDropdownToggle('Add Last');
                    }}
                > 
                    Add Last 
                </DropdownItem>
            );
        }
        else {
            result.push(
                <DropdownItem disabled> No Slides </DropdownItem>
            );
        }
        return result
    }

    const renderPageIdDropdownItems = () => {
        if (!extractedPresentations.hasOwnProperty(selected)
            || !extractedPresentations[selected].hasOwnProperty('__templates')
        ) {
            return [(
                <DropdownItem disabled> No Presentation Selected </DropdownItem>
            )];
        }
        let templates = extractedPresentations[selected].__templates;
        let result = [];
        let contained = false;
        if (Array.isArray(templates)) {
            for (let template of templates) {
                let itemName = '';
                if (template.isCustom) {
                    itemName = 'Page ' + template.pageNum.toString();
                }
                else {
                    itemName = 'Layout ' + template.pageNum.toString();
                }
                if (template.originalId === pageIdDropdownValue) {
                    contained = true;
                }
                result.push(
                    <DropdownItem
                        key={template.originalId}
                        onClick={() => {
                            setPageIdDropdownValue(template.originalId);
                            setPageIdDropdownToggle(itemName);
                        }}
                    > 
                        {itemName} 
                    </DropdownItem>
                );
            }
        }
        else {
            result.push(
                <DropdownItem disabled> No Page Ids </DropdownItem>
            );
        }
        if (!contained && pageIdDropdownValue !== '') {
            setPageIdDropdownValue('');
            setPageIdDropdownToggle(NOT_SELECTED);
        }
        return result
    }



    return (
        <div className={props.className} >
            <div style={ { display: 'block' } } id='contentForm'>
                <Form onSubmit={submitSingleSlideHandler}>
                    <FormGroup>
                        <Label for="header"> Header </Label>
                        <Input type="textarea" name="header" id="header" value={header} 
                            onChange={(event) => {
                                _changeHeaderContent(event.target.value);
                            }}
                        />
                    </FormGroup>
                    {renderBodyForm()}
                    <Container>
                        <Row className='align-items-end justify-content-start row-cols-3'>
                            <Col className='col-2' key='column-1'>
                                <Button
                                    type='submit' 
                                    color='success'
                                    disabled={indexDropdownValue === 0 || pageIdDropdownValue === ''}
                                > Compile Single Slide </Button>
                            </Col>
                            <Col className='col-2' key='column-2'>
                                <Label for='indexDropdown'> Slide Index </Label>
                                <Dropdown direction='right' id='indexDropdown' isOpen={indexDropdownOpen} toggle={indexToggleDropdown}>
                                    <DropdownToggle caret key='toggle_index'>
                                        {indexDropdownToggle}
                                    </DropdownToggle>
                                    <DropdownMenu key='menu'>
                                        {renderIndexDropdownItems()}
                                    </DropdownMenu>
                                </Dropdown>
                            </Col>
                            <Col className='col-2' key='column-3'>
                                <Label for='pageIdDropdown'> Reference Slide </Label>
                                <Dropdown direction='right' id='pageIdDropdown' isOpen={pageIdDropdownOpen} toggle={pageIdToggleDropdown}>
                                    <DropdownToggle caret key='toggle_pageId'>
                                        {pageIdDropdownToggle}
                                    </DropdownToggle>
                                    <DropdownMenu key='menu'>
                                        {renderPageIdDropdownItems()}
                                    </DropdownMenu>
                                </Dropdown>
                            </Col>

                            <Col className='col-2' key='column-4'>
                                <Button 
                                    onClick={submitBestSlideHandler}
                                    color='success'
                                    disabled={indexDropdownValue === 0}
                                > Compile Best Slide </Button>
                            </Col>
                        </Row>
                    </Container>
                </Form>
                <Container className='pt-5'>
                        <Row className='align-items-end justify-content-start'>
                            <Col className='col-2' key='column-1'>
                                <Button 
                                    onClick={submitAllSlidesHandler} 
                                    color='success'
                                > Compare All Slides </Button>
                            </Col>
                        </Row>
                </Container>
            </div>
            <div style={ { display: 'none' } } id='loading'>
                <Spinner style={{ width: '10rem', height: '10rem' } } children='' />
            </div>
        </div>
    );
}

export default InputContent;