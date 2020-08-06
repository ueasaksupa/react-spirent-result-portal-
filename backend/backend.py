from flask import Flask, jsonify, request
from flask_cors import CORS
# EXCEL Lib
from openpyxl import Workbook
from openpyxl import load_workbook
# mongodb
from pymongo import MongoClient
from bson.objectid import ObjectId
#
from pprint import pprint
from datetime import datetime
import uuid
import os

# init flask app
app = Flask(__name__)
# set media_dir from environment variable if available, if not use default ./media
if "MEDIA_DIR" in os.environ:
    MEDIA_DIR = os.environ['MEDIA_DIR']
else:
    MEDIA_DIR = "./media"
if "DB_HOST" in os.environ:
    DB_HOST = os.environ['DB_HOST']
else:
    DB_HOST = "127.0.0.1"
print ("uploaded file will be saved at", MEDIA_DIR)

cors = CORS(app)
client = MongoClient('mongodb://{DB_HOST}:27017'.format(DB_HOST=DB_HOST),
                     username="root", password="dbpass")
spirentPortalDB = client.spirentPortalDB


def open_collector(start_collect_row, key_index, filename, sheetname):
    values_dict = {}

    wb = load_workbook(filename=filename)
    worksheet = wb[sheetname]
    column_header_index = {}
    column_header = []
    # remember column header position
    header_count = 0
    for headerRow in worksheet['A'+str(start_collect_row):'Z'+str(start_collect_row)]:
        for cell in headerRow:
            if cell.value != None:
                column_header.append(cell.value)
                column_header_index[cell.value] = header_count
                header_count += 1
            else:
                break
    ###
    index_cell = chr(ord('A') + column_header_index[key_index])
    start_cell_id = ord('A')
    for row in range(start_collect_row+1, 9999):
        if worksheet[chr(start_cell_id)+str(row)].value == None:
            break
        for col in range(0, 25):
            iter = chr(start_cell_id+col)+str(row)
            if worksheet[iter].value != None:
                index_cell_localtion = index_cell+str(row)
                if 'A' in iter:
                    # for first round
                    values_dict[worksheet[index_cell_localtion].value.strip()] = {
                        column_header[col]: worksheet[iter].value
                    }
                else:
                    values_dict[worksheet[index_cell_localtion].value.strip()].update(
                        {column_header[col]: worksheet[iter].value}
                    )
            else:
                break
    return values_dict, column_header, column_header_index

@app.route("/upload/template", methods=["POST"])
def upload_template():
    if request.method == "POST":
        uuid_str = str(uuid.uuid4())[:8]
        f = request.files["file"]
        
        # 
        # Save file
        #
        splited_filename = f.filename.split(".")
        saved_filename = "".join(
            splited_filename[0:-1]) + "_" + uuid_str + ".xlsx"
        saved_location = MEDIA_DIR + "/" + saved_filename

        f.save(saved_location)
        values_dict, column_header, column_header_index = open_collector(1, "Stream Block", saved_location, "Sheet1")
        #
        # Add to testResult
        #
        post_data = {"filename": saved_filename, "results": values_dict}
        result = spirentPortalDB.testTemplate.insert_one(post_data)
        print('Data ID: {0} has been inserted'.format(result.inserted_id))
        current_test_result_id = result.inserted_id
        return "", 201

@app.route("/upload/result", methods=["POST"])
def upload_result():
    if request.method == "POST":
        uuid_str = str(uuid.uuid4())[:8]
        f = request.files["file"]
        test_number = request.form["test_number"]
        testcase = request.form["testcase"]

        #
        # Save file
        #
        splited_filename = f.filename.split(".")
        saved_filename = "".join(
            splited_filename[0:-1]) + "_" + uuid_str + ".xlsx"
        saved_location = MEDIA_DIR + "/" + saved_filename

        f.save(saved_location)
        values_dict, column_header, column_header_index = open_collector(4, "Stream Block", saved_location, "Advanced Sequencing")
        #
        # Add to testResult
        #
        post_data = {"test_number": test_number, "filename": saved_filename, "results": values_dict}
        result = spirentPortalDB.testResult.insert_one(post_data)
        print('Data ID: {0} has been inserted'.format(result.inserted_id))
        current_test_result_id = str(result.inserted_id)
        #
        # Add to testSubject
        #
        result = spirentPortalDB.testSubject.find_one({'test_number': test_number})
        # Subject already created, Append current test result to the old one
        if result:
            tmp = result["test_result"]
            tmp.append(current_test_result_id)
            spirentPortalDB.testSubject.update_one(
                {"test_number":test_number}, 
                {"$set": {"test_result" : tmp}}
            )
        # Subject never been created, create new one.
        else:
            print ("Create new record")
            spirentPortalDB.testSubject.insert_one(
                {"test_number": test_number, "remark": "", "test_result": [current_test_result_id], "testcase": testcase, 'created_on': datetime.utcnow()}
            )

        return "", 201


@app.route("/result/<test_number>", methods=["GET"])
def get_result_test_number(test_number):
    results = spirentPortalDB.testResult.find({"test_number" : test_number})
    if not results:
        return "", 404
    testSubject = spirentPortalDB.testSubject.find_one({"test_number" : test_number})
    if not testSubject:
        return "", 404
    return_results = {"testcase": testSubject["testcase"], "files":[], "results": {}}
    for row in results:
        return_results["files"].append({"filename":row["filename"], "id": str(row["_id"])})
        for k,v in row["results"].items():
            if k in return_results["results"] :
            # stream already exist, update the drop time to highest
                if v["Dropped Frame Count"] > return_results["results"][k]["Dropped Frame Count"]:
                    return_results["results"][k] = v
            else:
                return_results["results"][k] = v

    if not return_results:
        # if return result is empty
        return "", 204
    else:
        return jsonify(return_results)


@app.route("/result/latest", methods=["GET"])
def get_result_latest():
    result = spirentPortalDB.testSubject.find_one(sort=[("created_on", -1)])
    if not result:
        return "",404
    return jsonify(
        {k: v for k, v in result.items() if k != '_id'}
    )


@app.route("/results", methods=["GET"])
def get_results():
    if request.args.get('test_number') != None:
        result = spirentPortalDB.testSubject.find_one({'test_number': str(request.args.get('test_number'))})
        if result:
            return jsonify(
                {k: v for k, v in result.items() if k != '_id'}
            )
        else:
            return "",404
    else :
        return jsonify([{k: v for k, v in x.items() if k != '_id'} for x in spirentPortalDB.testSubject.find({})])


@app.route("/testcases", methods=["GET"])
def get_testcases():
    results = spirentPortalDB.testcases.find({})
    return_results = []
    for row in results:
        payload = {}
        for k,v in row.items():
            if k != '_id':
                payload[k] = v
            else:
                payload[k] = str(v)
        return_results.append(payload)
    if not return_results:
        # if return result is empty
        return "", 204
    else:
        return jsonify(return_results)



@app.route("/template", methods=["GET"])
def get_template():
    results = spirentPortalDB.testTemplate.find({})
    return_results = {}
    for row in results:
        for k,v in row["results"].items():
            #if stream already exist, update latest
            return_results[k] = v
    return jsonify(return_results)


@app.route("/remark/<test_number>", methods=["PATCH"])
def patch_remark(test_number):
    new_remark = request.json["new_remark"]
    spirentPortalDB.testSubject.update_one(
        {"test_number":test_number}, 
        {"$set": {"remark" : new_remark}}
    )    
    return "", 204


@app.route("/result/<test_number>", methods=["DELETE"])
def delete_result(test_number):
    spirentPortalDB.testSubject.delete_one({ "test_number": test_number })
    spirentPortalDB.testResult.delete_many({ "test_number": test_number })
    return "", 204


@app.route("/result/<test_number>/<testResultId>", methods=["DELETE"])
def delete_result_id(test_number,testResultId):
    spirentPortalDB.testResult.delete_one({ "test_number": test_number, "_id": ObjectId(testResultId) })
    spirentPortalDB.testSubject.update(
        { "test_number": test_number },
        {"$pull": { "test_result": testResultId } }
    )
    return "", 204


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5050)
