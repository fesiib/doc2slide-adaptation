import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Form, FormGroup, Label, Input, Button,
    Spinner,
    DropdownItem, DropdownMenu, Dropdown, DropdownToggle,
    Container, Row, Col,
} from 'reactstrap';
import { changeBodyContent, changeHeaderContent, compileContent } from '../reducers/content';
import { addThumbnails, clearThumbnails, extractedFile } from '../reducers/presentationFiles';
import { generateAllSlides, generateSlide } from '../services/slideAdapter';
import { compareAllSlides } from '../services/slideComparator';
import { processContent } from '../services/textSummarization';

export const EXTRACTING = 'extracting';
export const COMPILING = 'compiling';

let loadingState = {
    extracting: false, 
    compiling: false,
};

export function loadingActivate(process) {
    if (process === EXTRACTING) {
        loadingState.extracting = true;
    }
    if (process === COMPILING) {
        loadingState.compiling = true;
    }
    let divDocForm = document.getElementById('contentDocForm');
    let divForm = document.getElementById('contentForm');
    let divLoading = document.getElementById('loading');
    divForm.setAttribute('style', 'display: none');
    divDocForm.setAttribute('style', 'display: none');
    divLoading.setAttribute('style', 'display: block');
}

export function loadingDeactivate(process) {
    if (process === EXTRACTING) {
        loadingState.extracting = false;
    }
    if (process === COMPILING) {
        loadingState.compiling = false;
    }
    if (!loadingState.extracting && !loadingState.compiling) {
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

    const { selected, selectedExt, extractedPresentations } = useSelector(state => state.presentationFiles);

    const [pageIdDropdownOpen, setPageIdDropdownOpen] = useState(false);
    const [pageIdDropdownValue, setPageIdDropdownValue] = useState(null);
    const [pageIdDropdownToggle, setPageIdDropdownToggle] = useState('Not Selected');


    const [indexDropdownOpen, setIndexDropdownOpen] = useState(false);
    const [indexDropdownValue, setIndexdDropdownValue] = useState(null);
    const [indexDropdownToggle, setIndexDropdownToggle] = useState('Not Selected');

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
                generateSlide(selected, selectedExt, 0, pageIdDropdownValue, resources)
                    .then((response) => {
                        console.log("Generated Single Slide: ", response);
                        loadingDeactivate(COMPILING);
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
                        compareAllSlides(selected, selectedExt).then((response) => {
                            let original = { ...response.original };
                            let generated = { ...response.generated };
                            _addThumbnails(original.title, original.presentationId, original.imageLinks);
                            _addThumbnails(generated.title, generated.presentationId, generated.imageLinks);
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

    // const renderIndexDropdownItems = () => {
    //     if (!extractedPresentations.hasOwnProperty(selected)
    //         || !extractedPresentations[selected].hasOwnProperty('__templates')
    //     ) {
    //         return [(
    //             <DropdownItem disabled> No Presentation Selected </DropdownItem>
    //         )];
    //     }
    //     let templates = extractedPresentations[selected].__templates;
    //     let result = [];
    //     if (Array.isArray(templates)) {
    //         for (let template of templates) {
    //             let itemName = '';
    //             if (template.isCustom) {
    //                 itemName = 'Page ' + template.pageNum.toString();
    //             }
    //             else {
    //                 itemName = 'Layout ' + template.pageNum.toString();
    //             }
    //             result.push(
    //                 <DropdownItem
    //                     key={template.originalId}
    //                     onClick={() => {
    //                         setPageIdDropdownValue(template.originalId);
    //                         setPageIdDropdownToggle(itemName);
    //                     }}
    //                 > 
    //                     {itemName} 
    //                 </DropdownItem>
    //             );
    //         }
    //     }
    //     else {
    //         result.push(
    //             <DropdownItem disabled> No Slides </DropdownItem>
    //         );
    //     }
    //     return result
    // }

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
        if (Array.isArray(templates)) {
            for (let template of templates) {
                let itemName = '';
                if (template.isCustom) {
                    itemName = 'Page ' + template.pageNum.toString();
                }
                else {
                    itemName = 'Layout ' + template.pageNum.toString();
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
                        <Row className='align-items-end justify-content-start'>
                            <Col className='col-2'>
                                <Button type='submit' color='success'> Compile Single Page </Button>
                            </Col>
                            {/* <Col className='col-2'>
                                <Label for='indexDropdown'> Index </Label>
                                <Dropdown id='indexDropdown'isOpen={indexDropdownOpen} toggle={indexToggleDropdown}>
                                    <DropdownToggle caret>
                                        {indexDropdownToggle}
                                    </DropdownToggle>
                                    <DropdownMenu>
                                        {renderIndexDropdownItems()}
                                    </DropdownMenu>
                                </Dropdown>
                            </Col> */}
                            <Col className='col-2'>
                                <Label for='pageIdDropdown'> Reference Page </Label>
                                <Dropdown id='pageIdDropdown' isOpen={pageIdDropdownOpen} toggle={pageIdToggleDropdown}>
                                    <DropdownToggle caret>
                                        {pageIdDropdownToggle}
                                    </DropdownToggle>
                                    <DropdownMenu>
                                        {renderPageIdDropdownItems()}
                                    </DropdownMenu>
                                </Dropdown>
                            </Col>
                        </Row>
                    </Container>
                </Form>
                <div className='m-5'>
                    <Button onClick={submitAllSlidesHandler} color='success'> Compare All Slides </Button>
                </div>
            </div>
            <div style={ { display: 'none' } } id='loading'>
                <Spinner style={{ width: '10rem', height: '10rem' } } children='' />
            </div>
        </div>
    );
}

export default InputContent;