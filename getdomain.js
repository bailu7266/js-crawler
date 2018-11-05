process.on('message', (hostname) => {
    // checking for TLDs, 需要完全异步!!
    getTLDs(hostname, function(domain) {
        process.send({ domain });
        // self.close();
    }, getDomain);
});

function getDomain(hostname, callback, TLDs) {
    if (!TLDs) {
        return callback(null);
    }

    var parts = hostname.split('.');
    var index = parts.length;
    for (var i = 0; i < TLDs.length; i++) {
        var ni = parts.indexOf(TLDs[i]);
        if ((ni >= 0) && (ni < index)) {
            index = ni;
            if (index <= (parts.length - 2)) // 只支持两级TLD，其他情况另行分析
                break;
        }
    }
    if (index >= 1)
        index--;
    callback(parts.slice(index).join('.'));
}

function getTLDs(hostname, cbUpperLevel, callback) {
    var request = require('request');

    // get TLDs from www.iana.org
    var url = "https://data.iana.org/TLD/tlds-alpha-by-domain.txt";

    request(url, function(error, response, body) {
        if (error) {
            console.log(error);
            return callback(hostname, cbUpperLevel, null);
        }

        if (response.statusCode === 200) {
            var TLDs;
            TLDs = body.split('\n');
            TLDs.shift(); // 移除启行的说明
            for (var i = 0; i < TLDs.length; i++)
                TLDs[i] = TLDs[i].toLowerCase();
            callback(hostname, cbUpperLevel, TLDs);
        } else {
            console.log("返回码" + response.statusCode + ": 获取 " + url + " 没有成功。");
            callback(hostname, cbUpperLevel, null);
        }
    });
}