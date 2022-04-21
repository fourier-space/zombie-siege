import express from "express";
import Stats4 from "./Stats4.js";

const port = 8080;
const app = express();

// Static serving – GET requests.
app.use("/", express.static("web-app/browser"));
app.use("/common/", express.static("web-app/common"));
app.use("/docs/", express.static("docs"));


// JSON-RPC – POST requests.

// This is the module that will be exposed with a JSON_RPC interface:
const rpc_module = Stats4;

app.use("/", express.json());
app.post("/", function (req, res) {
    const request_object = req.body;
    let id;
    try {
        const {method, params} = request_object;
        id = request_object.id;
        const result = rpc_module[method](...params);
        if (id !== null) {
            const response_object = {
                "jsonrpc": "2.0",
                "result": result,
                "id": id
            };
            res.json(response_object);
        } else { // For 'notifications', return no response.
            res.status(204).end();
        }
    } catch (error) {
        // If an error occurs, respond with Http 400 containing, jsonrpc error.
        const error_response_object = {
            "jsonrpc": "2.0",
            "error": {
                "code": 0,
                "message": error.message,
                "data": error.stack
                // Normally you wouldn't expose the error, as thrown, to the
                // outside world since it breaks encapsulation, but here I've
                // done so to aid debugging.
            },
            "id": id || null
        };
        res.status(400).json(error_response_object);
    }
});

app.listen(port, function () {
    console.log(`Listening on port ${port} – http://localhost:${port}`);
});
