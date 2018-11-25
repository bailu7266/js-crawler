/*
 */

'use strict';

const request = require('request-promise');
const qs = require('qs');
const cheerio = require('cheerio');
// const URL = require('url-parse');
const fs = require('fs');
const cookiejar = request.jar();

const MAX_RESULT_PAGES = 10;
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36';

var resultLinks = [];
// var adLinks = [];
var {
    crawl,
    protocol,
    host,
    searchPath,
    proxy
} = require('./bing.js');

var numResultPages = 0;

const readline = require('readline');
if (process.stdin.isTTY) {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
}

const rli = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// main
(async () => {
    let keyWords = process.argv.slice(2);

    while (keyWords.length === 0) {
        let inkey = await inputKeyWords();
        keyWords = inkey.split(' ');
    }

    rli.close();

    // let url = new URL(keyWords);
    // let baseUrl = url.protocol + '//' + url.hostname;

    let nextUrl = protocol + '//' + host + searchPath;

    try {
        let $ = null;
        if (process.env.SERP_FILE) {
            $ = cheerio.load(fs.readFileSync(process.env.SERP_FILE));
        } else {
            $ = await request({
                uri: nextUrl,
                qs: {
                    q: keyWords.join('+')
                },
                headers: {
                    'User-Agent': userAgent
                },
                proxy: proxy,
                jar: cookiejar, // store cookies
                resolveWithFullResponse: true,
                transform: function (body, response) {
                    if (response.statusCode === 200) {
                        console.log(
                            'Visiting: ' +
                            decodeURI(
                                this.uri + '?' + qs.stringify(this.qs)
                            )
                        );
                        // console.log(cookiejar.getCookieString(this.uri));
                        fs.writeFileSync('./tmp/page0.html', body);
                        return cheerio.load(body);
                    } else {
                        throw new Error(
                            'Transform failed with ret code： ' +
                            response.statusCode
                        );
                    }
                }
            });
        }

        // collect links from the first SERP
        nextUrl = crawl($, resultLinks);
    } catch (err) {
        console.log(err.message);
        process.exit();
    }

    let myRequest = request.defaults({
        baseUrl: protocol + '//' + host,
        headers: {
            'User-Agent': userAgent
        },
        proxy: proxy,
        jar: true, // store cookies
        transform: body => {
            return cheerio.load(body);
        }
    });

    while (nextUrl && numResultPages < MAX_RESULT_PAGES) {
        numResultPages++;

        try {
            let $ = await myRequest(nextUrl);
            // 保持$中的内容，供调试用
            fs.writeFileSync(`./tmp/${numResultPages}.html`, $.html());

            nextUrl = crawl($, resultLinks);
        } catch (err) {
            console.log(err.message);
            break;
        }
    }

    // console log collected links
    resultLinks.forEach((lnk, i) => {
        console.log(`No ${i}: ` + lnk.name);
        console.log(lnk.uri);
        console.log(lnk.descr);
        console.log('\n');
    });
})();

function inputKeyWords() {
    return new Promise((resolve, reject) => {
        rli.question('请输入关键词: ', answer => {
            resolve(answer);
        });
    });
}