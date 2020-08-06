import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import backend from "../api/backend";

import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import DataTable, { createTheme } from "react-data-table-component";

const Home = () => {
    const staticResult = useRef();
    const [modalShow, setModalShow] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [selectedRemark, setSelectedRemark] = useState(null);
    const [selectedTestNumber, setSelectedTestNumber] = useState(null);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const history = useHistory();
    // Component did mount
    useEffect(() => {
        document.title = "portal :: All results";
        preProcessData();
    }, []);
    //
    const preProcessData = async () => {
        let results, testcases;
        // get results
        console.log("preprocess data");
        try {
            const resultReps = await backend.get("/results");
            if (resultReps.status === 200) {
                console.log("results:: ", resultReps.data);
                results = resultReps.data;
            } else {
                setError(true);
            }
            // get testcase
            const testcaseResp = await backend.get("/testcases");
            console.log("testcases:: ", testcaseResp.data);
            if (testcaseResp.status === 200 && testcaseResp.data.length !== 0) {
                const tmpObj = {};
                for (const record of testcaseResp.data) {
                    tmpObj[record._id] = record;
                }
                testcases = tmpObj;
            } else {
                setError(true);
            }
            // prepare data for data-table
            const tmp = results.map((row) => {
                return {
                    test_number: parseInt(row.test_number),
                    testcase: `${testcases[row.testcase].no} :: ${testcases[row.testcase].name}`,
                    file_upload: row.test_result.length,
                    remark: row.remark,
                    created_on: new Date(row.created_on).toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
                };
            });
            staticResult.current = tmp;
            setData(tmp);
        } catch (error) {
            console.log(error);
            setError(true);
        }
    };
    //
    const onSearchChangeHandler = (e) => {
        console.log(e.target.value);
        const value = e.target.value;
        const tmp = [];
        console.log(staticResult.current);
        for (const row of staticResult.current) {
            for (const col in row) {
                if (row[col].toString().includes(value)) {
                    tmp.push(row);
                    break;
                }
            }
        }
        setData(tmp);
    };
    const handleDeleteTestSubject = async (test_number) => {
        await backend.delete(`/result/${test_number}`);
        preProcessData();
        handleClose();
    };
    const handleClose = () => setModalShow(false);
    const handleShow = () => setModalShow(true);
    const handleRemarkSubmit = () => {
        backend.patch(`/remark/${selectedTestNumber}`, { new_remark: selectedRemark }).then((response) => {
            handleClose();
            document.getElementById(`remark-${selectedTestNumber}`).innerText = selectedRemark;
        });
    };
    const modalContentRemarkEdit = () => {
        return (
            <>
                <Modal.Header closeButton>
                    <Modal.Title>Manage remark</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <input type="text" value={selectedRemark} onChange={(e) => setSelectedRemark(e.target.value)} />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleRemarkSubmit}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </>
        );
    };
    const modalContentDeleteConfirm = (test_number) => {
        return (
            <>
                <Modal.Header closeButton>
                    <Modal.Title>Delete test {test_number}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="danger" onClick={() => handleDeleteTestSubject(test_number)}>
                        Delete
                    </Button>
                </Modal.Body>
            </>
        );
    };
    /*
    data-table
    */
    createTheme("solarized", {
        text: {
            primary: "#f0ece3",
            secondary: "#fff",
        },
        background: {
            default: "#596e79",
        },
        context: {
            background: "#cb4b16",
            text: "#FFFFFF",
        },
        divider: {
            default: "#073642",
        },
        action: {
            button: "rgba(0,0,0,.54)",
            hover: "rgba(0,0,0,.08)",
            disabled: "rgba(0,0,0,.12)",
        },
    });
    const columns = [
        {
            name: "no.",
            selector: "test_number",
            sortable: true,
        },
        {
            name: "testcase",
            selector: "testcase",
            sortable: true,
        },
        {
            name: "File uploaded",
            selector: "file_upload",
            sortable: false,
        },
        {
            name: "action",
            sortable: false,
            right: true,
            // ignoreRowClick: true,
            grow: 2,
            cell: (row) => (
                <div className="d-flex">
                    <div id={`remark-${row.test_number}`}>{row.remark}</div>
                    <i
                        style={{ color: "#29a19c", padding: "0 10px" }}
                        type="button"
                        className="fas fa-edit action-icon"
                        onClick={() => {
                            setModalContent(modalContentRemarkEdit());
                            setSelectedRemark(row.remark);
                            setSelectedTestNumber(row.test_number);
                            handleShow();
                        }}
                    ></i>
                    <i
                        style={{ color: "#e76f51", padding: "0 10px" }}
                        type="button"
                        className="fas fa-trash-alt action-icon"
                        onClick={() => {
                            setModalContent(modalContentDeleteConfirm(row.test_number));
                            setSelectedRemark(row.remark);
                            setSelectedTestNumber(row.test_number);
                            handleShow();
                        }}
                    ></i>
                </div>
            ),
        },
        {
            name: "Create on",
            selector: "created_on",
            sortable: true,
            right: true,
        },
    ];
    //
    // check if all data ready
    if (data) {
        return (
            <div className="container-fluid">
                <DataTable
                    title="All Results"
                    highlightOnHover
                    pointerOnHover
                    pagination
                    paginationPerPage={40}
                    paginationRowsPerPageOptions={[10, 40, 70, 100]}
                    defaultSortField="test_number"
                    defaultSortAsc={false}
                    subHeader
                    subHeaderComponent={<input type="text" placeholder="search" onChange={onSearchChangeHandler} />}
                    dense
                    columns={columns}
                    data={data}
                    theme="solarized"
                    onRowClicked={(row) => history.push(`/result/${row.test_number}`)}
                />
                <Modal show={modalShow} onHide={handleClose}>
                    {modalContent}
                </Modal>
            </div>
        );
    } else {
        if (error) {
            return (
                <div className="text-center">
                    Cannot connect to API backend please check with API service or refresh the page.
                </div>
            );
        } else {
            return <div className="text-center">Loading ...</div>;
        }
    }
};

export default Home;
