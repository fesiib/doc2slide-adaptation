import { useSelector } from 'react-redux';

import { Container, Col, Row, Alert } from 'reactstrap';

import {useImage} from 'react-image';

import { Suspense } from 'react';

const PLACEHOLDER_IMAGE_URL = 'https://i.stack.imgur.com/y9DpT.jpg';
 
function Image(props) {
    const {src} = useImage({
        srcList: props.link,
    })
    
    return (<img src={src} width={props.width.toString()} height={props.height.toString()}/>)
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

        const width = window.innerWidth / 3;
        const height = width * (9 / 16);

        console.log(width, height);

        let rows = [];

        let maxLength = 0;
        for (let presentation of thumbnails) {
            maxLength = Math.max(maxLength, presentation.imageLinks.length);
        }

        if (maxLength > 0) {
            let cols = [];
            cols.push(
                <Col className="pt-2 pb-2 col-2">
                    <Alert color='secondary'> Title </Alert>
                </Col>
            );
            for (let presentation of thumbnails) {
                cols.push(
                    <Col className="pt-2 pb-2">
                        <Alert color='primary'> {presentation.title} </Alert>
                    </Col>
                );
            }
            rows.push(
                <Row className='row-cols-3 border border-primary  justify-content-around'>
                    {cols}
				</Row>
            );
        }

        for (let pageNum = 1; pageNum <= maxLength; pageNum++) {

            let cols = [];
            cols.push(
                <Col className="pt-2 pb-2 col-2">
                    <Alert color='secondary'> {'Page ' + pageNum.toString()} </Alert>
                </Col>
            );
            for (let presentation of thumbnails) {
                if (presentation.imageLinks.length >= pageNum
                    && typeof presentation.imageLinks[pageNum-1] === 'string'
                ) {
                    cols.push(
                        <Col className="pt-2 pb-2">
                            <Suspense fallback={<div>Loading... </div>}>
                                <Image link={presentation.imageLinks[pageNum-1]} width={width} height={height}/>
                            </Suspense>
                        </Col>
                    );
                }
                else {
                    cols.push(
                        <Col className="pt-2 pb-2">
                            <Suspense fallback={<div>Loading... </div>}>
                                <Image link={PLACEHOLDER_IMAGE_URL} width={width} height={height} />
                            </Suspense>
                        </Col>
                    );
                }
            }
            rows.push(
                <Row className='row-cols-3 border border-dark justify-content-around'>
                    {cols}
				</Row>
            );
        }
        return rows;
    }

    return (
        <div className={props.className} >
            <Container className='mw-98 p-0'>
				{listRows()}
			</Container>
        </div>
    )
}

export default ComparisonTableContainer;