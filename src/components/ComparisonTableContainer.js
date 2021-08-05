import { useSelector } from 'react-redux';

import { Container, Col, Row } from 'reactstrap';

import {useImage} from 'react-image'

const PLACEHOLDER_IMAGE_URL = 'https://i.stack.imgur.com/y9DpT.jpg';
 
function Image(props) {
  const {src} = useImage({
    srcList: props.link,
  })
 
  return <img src={src} />
}

function ComparisonTableContainer(props) {
    const { thumbnails } = useSelector(state => state.presentationFiles);
    
    /*
        thumbnails = [
            {
                title: "",
                imageLinks: [
                    'imageLink'
                ]
            }
        ]
    */


    const listRows = () => {
        let rows = [];

        let maxLength = 0;
        for (let presentation of thumbnails) {
            maxLength = Math.max(maxLength, presentation.imageLinks.length);
        }

        for (let pageNum = 1; pageNum <= maxLength; pageNum++) {

            let cols = [];

            for (let presentation of thumbnails) {
                if (presentation.imageLinks.length >= pageNum) {
                    cols.push(
                        <Col xs="5" className="m-5">
                            <Image link={presentation.imageLinks[pageNum-1]}/>
                        </Col>
                    );
                }
                else {
                    cols.push(
                        <Col xs="5" className="m-5">
                            <Image link={PLACEHOLDER_IMAGE_URL}/>
                        </Col>
                    );
                }
            }
            rows.push(
                <Row>
                    {cols}
				</Row>
            );
        }
        return rows;
    }

    return (
        <div className={props.className} >
            <Container>
				{listRows()}
			</Container>
        </div>
    )
}

export default ComparisonTableContainer;