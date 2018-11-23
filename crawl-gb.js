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
var resultLinks = [];
var adLinks = [];
var se = {
    protocol: 'https:',
    host: 'www.bing.com',
    searchPath: '/search',
    auth: {
        user: '',
        pass: ''
    },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
    crawl: crawlBingSerp
};

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
(async() => {
    let keyWords = process.argv.slice(2);

    while (keyWords.length === 0) {
        let inkey = await inputKeyWords();
        keyWords = inkey.split(' ');
    }

    rli.close();

    // let url = new URL(keyWords);
    // let baseUrl = url.protocol + '//' + url.hostname;

    let nextUrl = se.protocol + '//' + se.host + se.searchPath;

    try {
        let $ = await request({
            uri: nextUrl,
            qs: {
                q: keyWords.join('+')
            },
            headers: {
                'User-Agent': se.userAgent,
            },
            jar: cookiejar, // store cookies
            resolveWithFullResponse: true,
            transform: function(body, response) {
                if (response.statusCode === 200) {
                    console.log('Visiting: ' + decodeURI(this.uri + '?' + qs.stringify(this.qs)));
                    // console.log(cookiejar.getCookieString(this.uri));
                    return cheerio.load(body);
                } else {
                    throw new Error(
                        'Transform failed with ret code： ' + response.statusCode
                    );
                }
            }
        });
        fs.writeFileSync('./tmp/page0.html', $.html());

        // collect links from the first SERP
        nextUrl = se.crawl($);
    } catch (err) {
        console.log(err.message);
        process.exit();
    }

    let myRequest = request.defaults({
        baseUrl: se.protocol + '//' + se.host,
        headers: {
            'User-Agent': se.userAgent
        },
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

            nextUrl = se.crawl($);
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

function crawlBingSerp($) {
    // Add the first adv link
    // adLinks.push($('ol#b_results > li:nth-child(1) > ul > li > div > h2 > a').attr('href'));
    // Add the last adv link
    // adLinks.push($('ol#b_results > li.b_ad.b_adBottom > ul > li > div > h2 > a').attr('href'));

    let resultItems = $('#b_results > li.b_algo');
    let navPages = $('#b_results > li.b_pag > nav > ul > li');

    resultItems.each((i, item) => {
        let $ = cheerio.load(item);
        resultLinks.push({
            name: $('li h2 > a[h*="ID=SERP"]').text(),
            uri: $('li h2 > a[h*="ID=SERP"]').attr('href'),
            descr: $('li > div.b_caption >p').text()
        });
    });

    let pageKeys = Object.keys(navPages);
    for (let i = 0; i < pageKeys.length; i++) {
        let $ = cheerio.load(navPages[pageKeys[i]]);

        if ($('a').is('a.sb_pagS.sb_pagS_bp')) {
            let $ = cheerio.load(navPages[pageKeys[i + 1]]);
            return $('a[h*="ID=SERP"]').attr('href');
        }
    }

    return null;
}

function crawlGoogleSerp($) {
    let resultItems = $('#rso > div > div > div.g');
    let navPages = $('#nav > tbody > tr > td');

    resultItems.each((i, item) => {
        let $ = cheerio.load(item);
        resultLinks.push({
            name: $('div.r > a > h3').text(),
            uri: $('div.r > a').attr('href'),
            descr: $('div.s > div > span.st').text()
        });
    });

    let pageKeys = Object.keys(navPages);
    for (let i = 0; i < pageKeys.length; i++) {
        let $ = cheerio.load(navPages[pageKeys[i]]);
        if ($('td').hasClass('cur')) {
            let $ = cheerio.load(navPages[pageKeys[i + 1]]);
            if ($('td').is('.b.navend')) {
                return null; // Reach the end
            } else {
                return $('a.fl').attr('href');
            }
        }
    }
    return null;
}