import { useDispatch, useSelector } from "react-redux";
import { selectFile } from "../reducers/presentationFiles";
import { Container, Row, Col, Button, Alert } from 'reactstrap';

function FileManager(props) {
    const dispatch = useDispatch();

    const {cnt, files, selected} = useSelector(state => state.presentationFiles);

    const _selectFile = (name, id) => {
        dispatch(selectFile({
            name,
            id,
        }));
    }

    const listPresentationFiles = () => {
        if (cnt === 0) {
            return (
            <Row>
                <Alert color="primary">
                    No presentation files found!
                </Alert>
            </Row>);
        }
        return files.map((el, index) => {
             let active = (selected === el.id);
            return (
                <Row key={index}>
                    <Button 
                        className = "w-25 max-h-50 m-2"
                        onClick = {(() => _selectFile(el.name, el.id))}
                        color="primary" active={active}
                    > 
                        {el.name} 
                    </Button>
                </Row>
            );
        });
    }

    return (
        <Container>
            <Col>
                {listPresentationFiles()}
            </Col>
        </Container>
    );
}

export default FileManager;