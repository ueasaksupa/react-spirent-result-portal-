import React, { useState, useEffect } from "react";
import backend from "../api/backend";
import { useHistory } from "react-router-dom";

const ResultUploder = () => {
    const [testcase, setTestcase] = useState([]);
    const [inputParams, setInputParams] = useState({ test_number: 0, testcase: 0 });
    const [uploadSelector, setUploadSelector] = useState("result");
    const history = useHistory();

    useEffect(() => {
        document.title = "portal :: Upload";
        backend.get("/testcases").then((response) => {
            if (response.status === 200) {
                console.log("testcase:: ", response.data);
                setTestcase(response.data);
            } else {
                setTestcase([]);
            }
        });
        backend.get("/result/latest").then((response) => {
            if (response.status === 200) {
                setInputParams({ testcase: response.data.testcase, test_number: response.data.test_number });
            }
        });
    }, []);

    const renderSelectTestcase = () => {
        if (testcase.length === 0) {
            return <option value="0">Please add testcase before using</option>;
        } else {
            let optionJsx = [<option key={0}>select testcase</option>];
            optionJsx.push(
                testcase.map((e, i) => {
                    return <option key={e._id} value={e._id}>{`${e.no} :: ${e.name}`}</option>;
                }),
            );
            return optionJsx;
        }
    };

    const onInputChangeHandler = (event) => {
        const type = event.target.type;
        const name = event.target.name;
        const value = event.target.value;
        // automatic change selectbox base on input test-number
        if (name === "test_number") {
            backend.get(`/results?test_number=${value}`).then((response) => {
                if (response.status === 200) {
                    setInputParams({ testcase: response.data.testcase, test_number: value });
                }
            });
        }
        setInputParams({
            ...inputParams,
            [name]: type === "checkbox" ? event.target.checked : value,
        });
    };

    const onFormResultSubmitHandler = (e) => {
        e.preventDefault();
        if (testcase.length === 0) {
            alert("please add testcase first");
            return;
        }
        let formData = new FormData();
        let file = document.querySelector("#file");

        formData.append("file", file.files[0]);
        formData.append("test_number", inputParams.test_number);
        formData.append("testcase", inputParams.testcase);
        backend
            .post("/upload/result", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
            .then((response) => {
                if (response.status === 201) {
                    history.push(`/result/${inputParams.test_number}`);
                }
            });
    };

    const onFormTemplateSubmitHandler = (e) => {
        e.preventDefault();

        let formData = new FormData();
        let file = document.querySelector("#file");

        formData.append("file", file.files[0]);
        backend
            .post("/upload/template", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
            .then((response) => {
                alert("Upload completed");
            });
    };

    let formBody;
    if (uploadSelector === "result") {
        formBody = (
            <div className="cover-container d-flex h-100 p-3 mx-auto flex-column">
                <form encType="multipart/form-data" onSubmit={onFormResultSubmitHandler}>
                    <div className="form-group row">
                        <label className="col-sm-2 col-form-label">Test number</label>
                        <div className="col-sm-10">
                            <input
                                type="number"
                                className="form-control"
                                name="test_number"
                                onChange={onInputChangeHandler}
                                value={inputParams.test_number}
                            />
                        </div>
                    </div>
                    <div className="form-group row">
                        <label className="col-sm-2 col-form-label">Testcase</label>
                        <div className="col-sm-10">
                            <select
                                type="select"
                                className="form-control"
                                name="testcase"
                                onChange={onInputChangeHandler}
                                value={inputParams.testcase}
                            >
                                {renderSelectTestcase()}
                            </select>
                        </div>
                    </div>
                    <div className="form-group row">
                        <label className="col-sm-2 col-form-label">Please select file (.xlsx)</label>
                        <div className="col-sm-10">
                            <input id="file" type="file" name="file" />
                            <button className={`btn btn-success ${testcase.length === 0 ? "disabled" : ""}`} type="submit">
                                Upload
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        );
    } else if (uploadSelector === "template") {
        formBody = (
            <div className="cover-container d-flex h-100 p-3 mx-auto flex-column">
                <form encType="multipart/form-data" onSubmit={onFormTemplateSubmitHandler}>
                    <div className="form-group row">
                        <label className="col-sm-2 col-form-label">Please select file (.xlsx)</label>
                        <div className="col-sm-10">
                            <input id="file" type="file" name="file" />
                            <button className="btn btn-success" type="submit">
                                Upload
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        );
    }
    return (
        <div className="uploder-container">
            <div className="mb-4 btn-group btn-group-lg">
                <button
                    type="button"
                    className={`btn btn-secondary ${uploadSelector === "result" ? "active" : null}`}
                    onClick={() => setUploadSelector("result")}
                >
                    upload result
                </button>
                <button
                    type="button"
                    className={`btn btn-secondary ${uploadSelector === "template" ? "active" : null}`}
                    onClick={() => setUploadSelector("template")}
                >
                    upload template
                </button>
            </div>
            {formBody}
        </div>
    );
};

export default ResultUploder;
