import { useDispatch, useSelector } from 'react-redux';
import {
    Form, FormGroup, Label, Input, Button,

    Spinner,
} from 'reactstrap';
import { changeBodyContent, changeHeaderContent, compileContent } from '../reducers/content';
import { extractedFile } from '../reducers/presentationFiles';
import { processContent } from '../services/TextAPI';
import { tryFitContent, getPresentation } from '../services/SlidesAPI';
import { appendPre } from '../services/GoogleAPI';
import { fitToAllSlides_simple, fitToAllSlides_TextShortening } from '../services/fitContent';

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
    let divForm = document.getElementById('contentForm');
    let divLoading = document.getElementById('loading');
    divForm.setAttribute('style', 'display: none');
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
        let divForm = document.getElementById('contentForm');
        let divLoading = document.getElementById('loading');
        divForm.setAttribute('style', 'display: block');
        divLoading.setAttribute('style', 'display: none');
    }
}

function InputContent(props) {
    const dispatch = useDispatch();

    const { header, body, headerResult, bodyResult, shouldUpdate } = useSelector(state => state.content);

    const { selected, selectedExt, templates } = useSelector(state => state.presentationFiles);

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
        event.preventDefault();
        event.stopPropagation();
        loadingActivate(COMPILING);
        processContent({header, body}, {header: headerResult, body: bodyResult}, shouldUpdate).then((response) => {
            // tryFitContent({header, body}, selectedExt, templates[selected], fitToAllSlides_simple).then((result) => {
			// 	console.log("Result: ", result);
            //     loadingDeactivate(COMPILING);
            //     forceUpdateSelected();
			// }).catch((error) => {
			// 	appendPre('Couldn`t fit content: ' + error);
            //     loadingDeactivate(COMPILING);
			// });

            tryFitContent(
                {
                    header: response.header,
                    body: response.body,
                }, selectedExt, templates[selected], fitToAllSlides_TextShortening
            ).then((result) => {
				console.log("Result: ", result);
                loadingDeactivate(COMPILING);
                forceUpdateSelected();
			}).catch((error) => {
				appendPre('Couldn`t fit content: ' + error);
                loadingDeactivate(COMPILING);
			});
            _compileContent(response.header, response.body);
        });
    };

    const renderBodyForm = () => {
        if (Array.isArray(body)) {
            let result =  body.map((value, idx_0) => {
                let idx = idx_0 + 1;
                let id = 'body' + idx.toString();
                return (
                    <FormGroup key={id}>
                        <Label for={id}> {'Body Text ' + idx.toString()} </Label>
                        <Input type="textarea" name={id} id={id} value={body[idx_0]} 
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
                    <Button type='submit' > Compile </Button>
                </Form>
            </div>
            <div style={ { display: 'none' } } id='loading'>
                <Spinner style={{ width: '10rem', height: '10rem' } } children='' />
            </div>
        </div>
    );
}

export default InputContent;