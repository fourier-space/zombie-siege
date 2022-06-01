/*jslint browser*/
const Json_rpc = Object.create(null);

const fetch = window.fetch;

const json = (response) => response.json();

let json_rpc_id = 0;

Json_rpc.method = function (method_name) {
    return function (...params) {

        const body = JSON.stringify({
            "id": json_rpc_id,
            "jsonrpc": "2.0",
            "method": method_name,
            "params": params
        });

        return fetch("/", {
            "body": body,
            "headers": {
                "Content-Type": "application/json"
            },
            "method": "POST"
        }).then(json).then((response_object) => response_object.result);
    };
};

export default Object.freeze(Json_rpc);
