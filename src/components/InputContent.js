import { useDispatch, useSelector } from 'react-redux';
import {
    Form, FormGroup, Label, Input, Button,

    Spinner,
} from 'reactstrap';
import { changeBodyContent, changeHeaderContent, compileContent } from '../reducers/content';
import { extractedFile } from '../reducers/presentationFiles';
import { generateSlideSingle } from '../services/SlidesTemplateServerAPI';
import { processContent } from '../services/TextAPI';

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

    const { selected, selectedExt } = useSelector(state => state.presentationFiles);

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

    const forceUpdateSelected = () => {
        let prev = selectedExt;
        _extractedFile(selected, '');
        _extractedFile(selected, prev);
    }

    const submitHandler = (event) => {
        console.log(shouldUpdate);
        event.preventDefault();
        event.stopPropagation();
        loadingActivate(COMPILING);
        processContent({header, body}, {header: headerResult, body: bodyResult}, shouldUpdate)
            .then((response) => {
                let resources = {
                    ...response,
                };
                generateSlideSingle(selected, selectedExt, 0, 'g2cdf48e324_0_133', resources)
                    .then((response) => {
                        console.log("Generated Slide Deck: ", response);
                        loadingDeactivate(COMPILING);
                        forceUpdateSelected();
                    }).catch((error) => {
                        console.log('Couldn`t generate Slide Deck: ', error);
                        loadingDeactivate(COMPILING);
                    });
                    _compileContent(resources.header, resources.body);
            }).catch((error) => {
                console.log('Couldn`t generate Slide Deck: ', error);
                loadingDeactivate(COMPILING);
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
        <div className={props.className} >
            <div style={ { display: 'block' } } id='contentForm'>
                <Form onSubmit={submitHandler}>
                    <FormGroup>
                        <Label for="header"> Header </Label>
                        <Input type="textarea" name="header" id="header" value={header} 
                            onChange={(event) => {
                                _changeHeaderContent(event.target.value);
                            }}
                        />
                    </FormGroup>
                    {renderBodyForm()}
                    <Button type='submit' > Compile Single Page </Button>
                </Form>
            </div>
            <div style={ { display: 'none' } } id='loading'>
                <Spinner style={{ width: '10rem', height: '10rem' } } children='' />
            </div>
        </div>
    );
}

export default InputContent;