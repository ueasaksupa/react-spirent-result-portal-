import React from "react";
import { Link } from "react-router-dom";
// Bootstrap
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";

const NavigationBar = (props) => {
    return (
        <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
            <Navbar.Brand className="px-4" as={Link} to="/">
                PoC Result portal
                <img alt="" src="/icon/network.svg" width="25" height="25" className="d-inline-block align-top" />
            </Navbar.Brand>
            <Nav.Link className="nav-link-color" as={Link} to="/">
                Results
            </Nav.Link>
            <Nav.Link className="nav-link-color" as={Link} to="/upload">
                Upload
            </Nav.Link>
        </Navbar>
    );
};

export default NavigationBar;
