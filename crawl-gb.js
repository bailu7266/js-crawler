'use_strict';

const request = require('request-promise');
const qs = require('qs');
const cheerio = require('cheerio');
// const URL = require('url-parse');
const fs = require('fs');
const cookiejar = request.jar();

const MAX_RESULT_PAGES = 10;
var resultLinks = [];
var adLinks = [];
var numResultPages = 0;

const readline = require('readline');
// readline.emitKeypressEvents(process.stdin);
// process.stdin.setRawMode(true);

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

    let nextUrl = 'https://cn.bing.com/search';

    try {
        let $ = await request({
            uri: nextUrl,
            qs: {
                q: keyWords.join('+')
                /*,
                               qs: 'n',
                               form: 'QBLH'*/
            },
            jar: cookiejar, // store cookies
            resolveWithFullResponse: true,
            transform: function (body, response) {
                if (response.statusCode === 200) {
                    console.log('Visiting: ' + this.uri + '?' + qs.stringify(this.qs));
                    // console.log(cookiejar.getCookieString(this.uri));
                    return cheerio.load(body);
                } else {
                    throw new Error(
                        'Transform failed with ret code： ' + response.statusCode
                    );
                }
            }
        });
        // fs.writeFileSync('./tmp/page0.html', $.html());

        // collect links from the first SERP
        nextUrl = collectResultLinks($);
    } catch (err) {
        console.log(err.message);
        process.exit();
    }

    let myRequest = request.defaults({
        baseUrl: 'https://cn.bing.com',
        jar: true, // store cookies
        transform: (body) => {
            return cheerio.load(body);
        }
    });

    while (nextUrl && numResultPages < MAX_RESULT_PAGES) {
        numResultPages++;

        try {
            let $ = await myRequest(nextUrl);
            // 保持$中的内容，供调试用
            fs.writeFileSync(`./tmp/${numResultPages}.html`, $.html());

            nextUrl = collectResultLinks($);
        } catch (err) {
            console.log(err.message);
            break;
        }
    }

    // console log collected links
    resultLinks.forEach((lnk, i) => {
        console.log(`No ${i}: ` + lnk);
    });
})();

function inputKeyWords() {
    return new Promise((resolve, reject) => {
        rli.question('请输入关键词: ', answer => {
            resolve(answer);
        });
    });
}

function collectResultLinks($) {
    // Add the first adv link
    // adLinks.push($('ol#b_results > li:nth-child(1) > ul > li > div > h2 > a').attr('href'));
    // Add the last adv link
    // adLinks.push($('ol#b_results > li.b_ad.b_adBottom > ul > li > div > h2 > a').attr('href'));

    var resultItems = $('#b_results > li.b_algo');
    var pages = $('#b_results > li.b_pag > nav > ul > li');

    resultItems.each((i, item) => {
        let $ = cheerio.load(item);
        resultLinks.push($('li h2 > a[h*="ID=SERP"]').attr('href'));
    });

    var pageKeys = Object.keys(pages);
    for (let i = 0; i < pageKeys.length; i++) {
        let $ = cheerio.load(pages[pageKeys[i]]);

        if ($('a').is('a.sb_pagS.sb_pagS_bp')) {
            let $ = cheerio.load(pages[pageKeys[i + 1]]);
            return $('a[h*="ID=SERP"]').attr('href');
        }
    }

    return null;
}