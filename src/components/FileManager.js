import { useDispatch, useSelector } from "react-redux";
import { selectFile } from "../reducers/presentationFiles";
import { Button, Alert } from 'reactstrap';

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
                <Alert color="primary">
                    No presentation files found!
                </Alert>
            );
        }
        return files.map((el, index) => {
             let active = (selected === el.id);
            return (
                <Button 
                    className = "w-25 max-h-50 m-2"
                    onClick = {(() => _selectFile(el.name, el.id))}
                    color="primary" active={active}
                > 
                    {el.name} 
                </Button>
            );
        });
    }

    return (
        <div>
            {listPresentationFiles()}
        </div>
    );
}

export default FileManager;