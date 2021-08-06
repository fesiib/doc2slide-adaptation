import { Alert } from 'reactstrap';
import React from 'react';
import {
    BrowserRouter as Router,
    Route,
    Switch,
} from 'react-router-dom';

import App from "./App";

import { useDispatch } from 'react-redux';
import { resetApp } from './reducers';

function Reset() {
    const dispatch = useDispatch();
    dispatch(resetApp());
    return (
        <Alert> Successfully Reset </Alert>
    );
}

class Routes extends React.Component {
    render() {
        return (
            <Router>
                <Switch>
                    <Route exact path="/" component={App}/>
                    <Route exact path="/reset" component={Reset}/>
                </Switch>
            </Router>
        )
    }
}

export default Routes;