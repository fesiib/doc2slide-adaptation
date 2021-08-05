import { Alert } from 'reactstrap';
import React from 'react';
import {
    BrowserRouter as Router,
    Route,
    Switch,
} from 'react-router-dom';

import App from "./App";

function Reset() {
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