var request = require('request');

// console.log('进程 ' + process.argv[1] + '的参数表: ' + process.argv[2]);

/* They are all TLDs at the beginning,  but only the rest TLDs exclude ccTLDs
   and osTLDs after classification
*/
var TLDs;
var ccTLDs = []; // Country-code Top Level Domain

/* Original generic and sponsored TLDs */
const osTLDs = ['com', 'org', 'net', 'int', 'edu', 'gov', 'mil', 'arpa', 'aero', 'asia', 'cat', 'coop', 'jobs', 'museum', 'post', 'tel', 'travel', 'xxx'];

module.exports = (hostname) => {
    return new Promise((resolove, reject) => {
        // get TLDs from www.iana.org
        const url4TLD = "https://data.iana.org/TLD/tlds-alpha-by-domain.txt";

        if (TLDs) {
            matchDomain(hostname, callback);
        } else {
            request(url4TLD, function(error, response, body) {
                if (error) {
                    console.log(error);
                    reject({ msg: error });
                }

                if (response.statusCode === 200) {
                    TLDs = body.split('\n');
                    TLDs.shift(); // 移除启行的说明
                    for (var i = 0; i < TLDs.length; i++)
                        TLDs[i] = TLDs[i].toLowerCase();
                    classifyDomain(TLDs);
                    resolove(matchDomain(hostname));
                } else {
                    console.log("返回码" + response.statusCode + ": 获取 " + url + " 没有成功。");
                    reject({ msg: '无法打开网页' });
                }
            });
        }
    })
}

function classifyDomain(TLDs) {
    // Get country-code TLDs (ccTLD) from TLDs and eliminate them. IDNs are not included
    for (var i = 0; i < TLDs.length;) {
        if (TLDs[i].length == 2) { // only ccTLD is 2 bytes long
            ccTLDs.push(TLDs[i]);
            TLDs = TLDs.slice(0, i).concat(TLDs.slice(i + 1));
        } else if (osTLDs.indexOf(TLDs[i]) >= 0) { // 剔除初始顶级域名
            TLDs = TLDs.slice(0, i).concat(TLDs.slice(i + 1));
        } else i++;
    }
}

function matchDomain(hostname) {
    // var hostParts = process.argv[2].split('.'); // 第三个参数就是hostname
    var hostParts = hostname.split('.');
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
    // process.send({ domain: hostParts.slice(index).join('.') });
    return hostParts.slice(index).join('.');
}