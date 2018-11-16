var request = require('request-promise');

// console.log('进程 ' + process.argv[1] + '的参数表: ' + process.argv[2]);

/* They are all TLDs at the beginning,  but only the rest TLDs exclude ccTLDs
   and osTLDs after classification
*/
var TLDs;
var ccTLDs = []; // Country-code Top Level Domain

/* Original generic and sponsored TLDs */
const osTLDs = ['com', 'org', 'net', 'int', 'edu', 'gov', 'mil', 'arpa', 'aero', 'asia', 'cat', 'coop', 'jobs', 'museum', 'post', 'tel', 'travel', 'xxx'];

module.exports = async(hostname) => {
    // get TLDs from www.iana.org
    const url4TLD = "https://data.iana.org/TLD/tlds-alpha-by-domain.txt";

    if (TLDs) {
        return matchDomain(hostname);
    } else {
        try {
            var resp = await request({ uri: url4TLD, resolveWithFullResponse: true })
            if (resp.statusCode === 200) {
                TLDs = resp.body.split('\n');
                TLDs.shift(); // 移除启行的说明
                for (var i = 0; i < TLDs.length; i++)
                    TLDs[i] = TLDs[i].toLowerCase();
                classifyDomain(TLDs);
                return matchDomain(hostname);
            } else
                return null;
        } catch (error) {
            console.log(error.message);
            // reject({ msg: error });
            //  throw error;
            return null;
        }
    }
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
    var idx = hostParts.length;
    var otherTLD = true; // Includes brand, city, geographic TLDs, etc.

    if (ccTLDs.indexOf(hostParts[idx - 1]) >= 0) { // Eliminate ccTLD
        idx--;
        otherTLD = false;
        // hostParts.pop();
    }

    if (osTLDs.indexOf(hostParts[idx - 1]) >= 0) {
        idx--;
        otherTLD = false;
        // hostParts.pop();
    }

    if (otherTLD) {
        if (TLDs.indexOf(hostParts[idx - 1]) >= 0) {
            idx--;
        }
    }
    if (idx >= 1)
        idx--;
    console.log('顶级域名是： ' + hostParts.slice(idx).join('.'));
    // process.send({ domain: hostParts.slice idx).join('.') });
    return hostParts.slice(idx).join('.');
}