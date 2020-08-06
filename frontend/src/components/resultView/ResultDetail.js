import React, { useState, useEffect, useRef } from "react";
import backend from "../api/backend";

import DataTable, { createTheme } from "react-data-table-component";
import UploadedFile from "./UploadedFile";

const SubHeader = (props) => {
    return (
        <>
            <div className="checkbox-subheader">
                <input
                    type="checkbox"
                    className="form-check-input"
                    id="showBG"
                    name="showBG"
                    onChange={props.onSearchChangeHandler}
                    defaultChecked
                />
                <label className="form-check-label" htmlFor="showBG">
                    Show BG
                </label>
            </div>
            <div className="checkbox-subheader">
                <input
                    type="checkbox"
                    className="form-check-input"
                    id="showBwService"
                    name="showBwService"
                    onChange={props.onSearchChangeHandler}
                    defaultChecked
                />
                <label className="form-check-label" htmlFor="showBwService">
                    BW service
                </label>
            </div>
            <div className="checkbox-subheader">
                <input
                    type="checkbox"
                    className="form-check-input"
                    id="showLtService"
                    name="showLtService"
                    onChange={props.onSearchChangeHandler}
                    defaultChecked
                />
                <label className="form-check-label" htmlFor="showLtService">
                    LT service
                </label>
            </div>
            <div className="checkbox-subheader">
                <input
                    type="checkbox"
                    className="form-check-input"
                    id="showSpService"
                    name="showSpService"
                    onChange={props.onSearchChangeHandler}
                    defaultChecked
                />
                <label className="form-check-label" htmlFor="showSpService">
                    SP service
                </label>
            </div>
            <input type="text" placeholder="search" onChange={props.onSearchChangeHandler} />
        </>
    );
};

const ResultDetail = (props) => {
    const staticResult = useRef();
    const testcaseName = useRef();
    const [files, setFiles] = useState(null);
    const [error, setError] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [data, setData] = useState(null);
    const [filter, setFilter] = useState({
        showBG: true,
        showBwService: true,
        showLtService: true,
        showSpService: true,
        search: "",
    });

    useEffect(() => {
        document.title = "portal :: Result detail";
        preProcessData();
    }, [props.match.params.test_number]);

    const preProcessData = async () => {
        let result, testcases, template;
        // get result
        try {
            let resultResp = await backend.get(`/result/${props.match.params.test_number}`);
            if (resultResp.status === 200) {
                console.log("resultDetail:: ", resultResp.data);
                result = resultResp.data;
                setFiles(resultResp.data.files);
            }

            // get testacase
            let testcaseResp = await backend.get("/testcases");
            if (testcaseResp.status === 200 && testcaseResp.data.length !== 0) {
                const tmpObj = {};
                for (const record of testcaseResp.data) {
                    tmpObj[record._id] = record;
                }
                testcases = tmpObj;
                console.log("testcases:: ", testcases);
            }
            // get template
            let templateResp = await backend.get("/template");
            if (templateResp.status === 200) {
                console.log("template:: ", templateResp.data);
                template = templateResp.data;
            }
            // set testcase name
            testcaseName.current = `${testcases[result.testcase].no}:: ${testcases[result.testcase].name}`;
            // prepare data for data-table first time
            const tmp = [];
            for (const streamname in resultResp.data.results) {
                let slice, droptime;
                // add slice name
                if (streamname.includes("BW-")) {
                    slice = "bandwidth";
                } else if (streamname.includes("LT-")) {
                    slice = "latency";
                } else if (streamname.includes("SP-")) {
                    slice = "special";
                }
                // find streamname in template
                if (template[streamname]) {
                    droptime =
                        (resultResp.data.results[streamname]["Dropped Frame Count"] / template[streamname]["Tx Rate (fps)"]) *
                        1000;
                    droptime = parseFloat(droptime.toFixed(2));
                } else {
                    droptime = "FPS not found";
                }
                tmp.push({ ...resultResp.data.results[streamname], droptime, slice });
            }
            staticResult.current = tmp;
            setData(tmp);
        } catch (err) {
            // console.log(err);
            setError({ ...err });
        }
    };

    const applyFilter = () => {
        let tmp = [];
        for (const row of staticResult.current) {
            if (!filter.showBwService && row["Stream Block"].includes("BW-")) continue;
            if (!filter.showLtService && row["Stream Block"].includes("LT-")) continue;
            if (!filter.showSpService && row["Stream Block"].includes("SP-")) continue;
            if (!filter.showBG && row["Stream Block"].includes("BG=")) continue;
            for (const col in row) {
                if (row[col]) {
                    if (row[col].toString().includes(filter.search)) {
                        tmp.push(row);
                        break;
                    }
                }
            }
        }
        return tmp;
    };

    const onSearchChangeHandler = (e) => {
        const type = e.target.type;
        const value = type === "checkbox" ? e.target.checked : e.target.value;
        const name = e.target.name;
        if (type === "checkbox") {
            setFilter({ ...filter, [name]: value });
        } else {
            setFilter({ ...filter, search: value });
        }
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
            name: "Stream Block",
            selector: "Stream Block",
            sortable: true,
            grow: 2,
        },
        {
            name: "Slice",
            selector: "slice",
            sortable: true,
        },
        {
            name: "Dropped Frame Count",
            selector: "Dropped Frame Count",
            sortable: true,
            right: true,
        },
        {
            name: "Tx",
            selector: "Tx Count (Frames)",
            sortable: true,
            right: true,
        },
        {
            name: "Rx",
            selector: "Rx Count (Frames)",
            sortable: true,
            right: true,
        },
        {
            name: "droptime(ms)",
            selector: "droptime",
            sortable: true,
            right: true,
        },
    ];

    if (data) {
        return (
            <div className="container-fluid">
                <UploadedFile files={files} preProcessData={preProcessData} testNumber={props.match.params.test_number} />
                <DataTable
                    title={testcaseName.current}
                    highlightOnHover
                    pagination
                    paginationPerPage={40}
                    paginationRowsPerPageOptions={[10, 40, 70, 100]}
                    defaultSortField="droptime"
                    defaultSortAsc={false}
                    subHeader
                    subHeaderComponent={<SubHeader onSearchChangeHandler={onSearchChangeHandler} />}
                    dense
                    columns={columns}
                    data={applyFilter()}
                    theme="solarized"
                />
            </div>
        );
    } else {
        if (error) {
            if (error.response) {
                return (
                    <div className="text-center">
                        {error.response.status}
                        {error.response.statusText}
                    </div>
                );
            } else {
                return <div className="text-center">NETWORK ERROR : check backend connection</div>;
            }
        } else {
            return <div className="text-center">Loading ...</div>;
        }
    }
};

export default ResultDetail;
