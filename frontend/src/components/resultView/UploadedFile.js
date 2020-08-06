import React, { useState, useEffect, useRef } from "react";
import backend from "../api/backend";

const UploadedFile = (props) => {
    const handlerDeleteSingleUploadFile = async (id) => {
        await backend.delete(`/result/${props.testNumber}/${id}`);
        props.preProcessData();
    };
    const renderFileList = () => {
        return props.files.map((ele) => {
            return (
                <div key={ele.id}>
                    {ele.filename}
                    <i
                        style={{ color: "#e76f51", padding: "0 10px" }}
                        type="button"
                        className="fas fa-trash-alt action-icon"
                        onClick={() => handlerDeleteSingleUploadFile(ele.id)}
                    ></i>
                </div>
            );
        });
    };
    return (
        <div style={{ display: "inline-flex", margin: "0.2em" }}>
            <span style={{ marginRight: "0.5em" }}>Uploaded files ({props.files.length}): </span>
            {renderFileList()}
        </div>
    );
};

export default UploadedFile;
