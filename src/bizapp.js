var BizApp = (function(window) {
    
    var Utils = {
        isString: function(x) { return typeof x === "string"; },
        isObject: function(x) { return x === Object(x); },
        noop: function() { }
    };

    var parent = window.parent;
    var allRequests = {};

    // Prepare listen to parent
    window.addEventListener("message", _onParentMessage);

    // Force no margin and padding on html and body
    _injectCSS();

    function _onParentMessage(ev) {
        // Not much checks are done, error are ignored
        var json = JSON.parse(ev.data);
        var request;
        var error;
        var result;

        switch (json.type) {
            case "CALLBACK":
                _handleCallback(allRequests[json.timestamp], json.data.result, json.data.error);
                break;

            default:
                break;
        }
    }

    function _handleCallback(req, res, err) {
        if (req === undefined) return;

        switch (req.type) {
            case "PAY_TO_WALLET":
            case "LOGIN":
                req.callback(err, res);
                break;

            default:
                break;
        }
    }

    function _injectCSS() {
        var css = document.createElement("style");
        css.type = "text/css";
        css.innerHTML = "html, body { margin: 0 !important; padding: 0 !important; width: 100%; height: 100%; } ";
        css.innerHTML += "bizapp-root { width: 100%; height: 100%; overflow-y: scroll; -webkit-overflow-scrolling: touch; display: block; }"
        document.head.appendChild(css);
    }

    /**
     * Request to login
     * @param opts.url The URL that handle login request
     */
    function login(opts, cb) {
        // Input check
        if (!cb) cb = Utils.noop;
        if (!Utils.isObject(opts)) {
            return cb("Invalid opts");
        }

        // Prepare request
        var timestamp = Date.now();
        var request = {
            type: "LOGIN",
            data: {
                url: opts.url
            },
            timestamp: timestamp,
            callback: cb
        };
        allRequests[timestamp] = request;

        // Pass to parent
        parent.postMessage(JSON.stringify(request), "*");
    }

    /**
     * Pay to a wallet address
     * @param opts.address    Address to pay to
     * @param opts.amount     Amount to pay to
     * @param opts.message    Message to include
     * @param opts.identifier Transaction identifier (Max 8 chars)
     */
    function payToWallet(opts, cb) {
        // Input check
        if (!cb) cb = Utils.noop;
        if (!Utils.isObject(opts)) {
            return cb("Invalid opts");
        }

        // Prepare request
        var timestamp = Date.now();
        var request = {
            type: "PAY_TO_WALLET",
            data: {
                address: opts.address,
                amount: opts.amount,
                message: opts.message,
                identifier: opts.identifier
            },
            timestamp: timestamp,
            callback: cb
        };
        allRequests[timestamp] = request;

        // Pass to parent
        parent.postMessage(JSON.stringify(request), "*");
    }
    
    return {
        login: login,
        payToWallet: payToWallet
    };
})(window);