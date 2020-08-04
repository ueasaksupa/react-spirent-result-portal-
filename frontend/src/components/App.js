import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";

import NavigationBar from "./NavigationBar";
import Home from "./home/Home";
import ResultUploader from "./home/ResultUploader";
import ResultDetail from "./resultView/ResultDetail";

import "./App.css";

const App = () => {
    return (
        <BrowserRouter>
            <NavigationBar />
            {/* main-content div will set the flag for 100% width and 100% height */}
            <div className="main-content">
                {/* play with this div if you want to adjust padding or margin of main-content
                it will effect every page  */}
                <div className="h-100 w-100 pt-5 pb-2">
                    <Switch>
                        <Route path="/" exact>
                            <Home />
                        </Route>
                        <Route path="/upload" exact>
                            <ResultUploader />
                        </Route>
                        <Route path="/result/:test_number" component={ResultDetail} exact />
                    </Switch>
                </div>
            </div>
        </BrowserRouter>
    );
};

export default App;
