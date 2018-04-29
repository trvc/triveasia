var BizApp = (function(window) {
    
    var Utils = {
        isString: function(x) { return typeof x === "string"; },
        isObject: function(x) { return x === Object(x); },
        noop: function() { }
    };

    var parent = window.parent;
    var allRequests = {};
    var prevHeight;

    // Prepare listen to parent
    window.addEventListener("message", _onParentMessage);

    // Resize check
    window.requestAnimationFrame(_resizer);

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

    function _resizer() {
        var currentHeight = _getHeight();
        var request;

        if (prevHeight !== currentHeight) {
            prevHeight = currentHeight;

            request = {
                type: "RESIZE",
                data: {
                    h: currentHeight
                },
                timestamp: Date.now(),
                callback: Utils.noop
            };
            parent.postMessage(JSON.stringify(request), "*");
        }
        window.requestAnimationFrame(_resizer);
    }

    function _getHeight() {
        var doc = window.document;
        var heights = [
            doc.documentElement.getBoundingClientRect().height,
            doc.documentElement.clientHeight,
            doc.body.scrollHeight,
            doc.documentElement.scrollHeight,
            doc.body.offsetHeight,
            doc.documentElement.offsetHeight
        ];

        // Prepare to find mode
        var map = {};
        heights.forEach(function(h) {
            if (map[h] === undefined) map[h] = 0;
            map[h]++;
        });

        // Find mode
        var maxCount = 0;
        var modes = [];
        Object.keys(map).forEach(function(k) {
            var count = map[k];
            if (count > maxCount) {
                maxCount = count;
                modes = [k];
            } else if (count == maxCount) {
                modes.push(k);
            }
        });
        
        // Find max among mode
        var maxValue = 0;
        modes.forEach(function() {
            maxValue = Math.max(parseInt(modes, 10), maxValue);
        });

        return maxValue;
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
     * @param opts.address  Address to pay to
     * @param opts.amount   Amount to pay to
     * @param opts.message  Message to include
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
                message: opts.message
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