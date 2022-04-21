const Json_rpc = Object.create(null);

const fetch = window.fetch;

const json = (response) => response.json();

let json_rpc_id = 0;

Json_rpc.method = function (method_name) {
    return function (...params) {

        const body = JSON.stringify({
            "jsonrpc": "2.0",
            "id": json_rpc_id,
            "method": method_name,
            "params": params
        });

        return fetch("/", {
            "method": "POST",
            "body": body,
            "headers": {
                "Content-Type": "application/json"
            }
        }).then(json).then((response_object) => response_object.result);
    };
};

export default Object.freeze(Json_rpc);
