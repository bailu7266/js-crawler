var request = require('request');

// get TLDs from www.iana.org
var url = "https://data.iana.org/TLD/tlds-alpha-by-domain.txt";
// console.log('进程 ' + process.argv[1] + '的参数表: ' + process.argv[2]);

request(url, function(error, response, body) {
    if (error) {
        console.log(error);
        getDomain(null);
    }

    if (response.statusCode === 200) {
        var TLDs;
        TLDs = body.split('\n');
        TLDs.shift(); // 移除启行的说明
        for (var i = 0; i < TLDs.length; i++)
            TLDs[i] = TLDs[i].toLowerCase();
        getDomain(TLDs);
    } else {
        console.log("返回码" + response.statusCode + ": 获取 " + url + " 没有成功。");
        getDomain(null);
    }
});

function getDomain(TLDs) {
    if (!TLDs) {
        // process.send(null);
        console("没有找到匹配的域名！");
    }

    // Get country-code TLDs (ccTLD) from TLDs and eliminate them. IDNs are not included
    var ccTLDs = [];
    var osTLDs = ['com', 'org', 'net', 'int', 'edu', 'gov', 'mil', 'arpa', 'aero', 'asia', 'cat', 'coop', 'jobs', 'museum', 'post', 'tel', 'travel', 'xxx'];

    for (var i = 0; i < TLDs.length;) {
        if (TLDs[i].length == 2) { // only ccTLD is 2 bytes long
            ccTLDs.push(TLDs[i]);
            TLDs = TLDs.slice(0, i).concat(TLDs.slice(i + 1));
        } else if (osTLDs.indexOf(TLDs[i]) >= 0) { // 剔除初始顶级域名
            TLDs = TLDs.slice(0, i).concat(TLDs.slice(i + 1));
        } else i++;
    }

    var hostParts = process.argv[2].split('.'); // 第三个参数就是hostname
    var index = hostParts.length;
    var otherTLD = true; // Includes brand, city, geographic TLDs, etc.

    if (ccTLDs.indexOf(hostParts[index - 1]) >= 0) { // Eliminate ccTLD
        index--;
        otherTLD = false;
        // hostParts.pop();
    }

    if (osTLDs.indexOf(hostParts[index - 1]) >= 0) {
        index--;
        otherTLD = false;
        // hostParts.pop();
    }

    if (otherTLD) {
        if (TLDs.indexOf(hostParts[index - 1]) >= 0) {
            index--;
        }
    }
    if (index >= 1)
        index--;
    console.log('顶级域名是： ' + hostParts.slice(index).join('.'));
    process.send({ domain: hostParts.slice(index).join('.') });
}