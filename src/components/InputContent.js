import { useDispatch, useSelector } from 'react-redux';
import {
    Form, FormGroup, Label, Input, Button,
    Spinner,
    DropdownItem, DropdownMenu, Dropdown, DropdownToggle,
    Container, Row, Col,
} from 'reactstrap';

import { changeBodyContent, changeHeaderContent, compileContent } from '../reducers/content';
import { addBB, selectExample } from '../reducers/example';
import { activateLoading, deactivateLoading } from '../reducers/loadingState';

import { processContent } from '../services/contentProcessing';
import { generateSlide, getExampleURL } from '../services/slideAdapter';
import { EXPERIMENTAL_PRESENTATION_ID } from './Example';


function InputContent(props) {
    const dispatch = useDispatch();

    const { header, body, headerResult, bodyResult, shouldUpdate } = useSelector(state => state.content);
    const { loading } = useSelector(state => state.loadingState);
    const { exampleDeckId, exampleId } = useSelector(state => state.example)

    const exampleUrl = getExampleURL(exampleDeckId, exampleId)
    
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



    const submitSingleSlideHandler = (event) => {
        event.preventDefault();
        event.stopPropagation();

        dispatch(activateLoading());
        
        processContent({header, body}, {header: headerResult, body: bodyResult}, shouldUpdate)
            .then((response) => {
                let resources = {
                    ...response,
                };
                generateSlide(exampleUrl, exampleId, exampleDeckId, EXPERIMENTAL_PRESENTATION_ID, 1).then((response) => {
                    console.log(response);
                    dispatch(deactivateLoading());
                    dispatch(selectExample({exampleDeckId, exampleId}));
                    if (response.exampleInfo.hasOwnProperty('elements')) {
                        const elements = response.exampleInfo.elements;
                        for (let i = 0; i < elements.length; i++) {
                            const element = elements[i];
                            element["object_id"] = i;
                            dispatch(addBB({bb: element}));
                        }
                    }
                }).catch((reason) => {
                    dispatch(deactivateLoading());
                    console.log(reason);
                });
                _compileContent(resources.header, resources.body);
            }).catch((error) => {
                console.log('Couldn`t generate Single Slide: ', error);

                dispatch(deactivateLoading());
            });
    };

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

    return (
        <div style={ {
                display: 'block',
                visibility: loading ? 'hidden' : 'visible',
            } }>
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
                                > Compile Single Slide </Button>
                            </Col>                            
                        </Row>
                    </Container>
                </Form>
            </div>
        </div>
    );
}

export default InputContent;