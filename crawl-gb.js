'use_strict';

const request = require('request-promise');
const cheerio = require('cheerio');
const URL = require('url-parse');
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
(async() => {
    let keyWords = process.argv.slice(2);

    while (!keyWords) {
        keyWords = await inputKeyWords()
    }

    rli.close();

    // let url = new URL(keyWords);
    // let baseUrl = url.protocol + '//' + url.hostname;

    let myRequest = request.defaults({
        baseUrl: 'https://cn.bing.com',
        jar: cookiejar, // store cookies
        resolveWithFullResponse: true,
        transform: function(body, response) {
            if (response.statusCode === 200) {
                console.log(cookiejar.getCookieString(opt.uri));
                return cheerio.load(body);
            } else {
                throw new Error('Transform failed with ret code： ' + response.statusCode);
            }
        }
    });

    let nextUrl = '/search';

    try {
        let $ = await myRequest(nextUrl, { form: { /*form: 'QBLH', qs: 'n', */ q: keyWords.join('+') } })

        // collect links from the first SERP
        nextUrl = collectResultLinks($);
    } catch (err) {
        console.log(err.message);
        process.exit();
    }

    while (nextUrl && (numResultPages < MAX_RESULT_PAGES)) {
        try {
            let $ = await myRequest(nextUrl);
            // 保持$中的内容，供调试用
            fs.writeFileSync('1.html', $.html());

            nextUrl = collectResultLinks($);
        } catch (err) {
            console.log(err.message);
            break;
        }

        numResultPages++;
    }

    // console log collected links
    resultLinks.forEach((lnk, i) => {
        console.log('No ' + i + ': ' + lnk);
    });
})();

function inputKeyWords() {
    return new Promise((resolve, reject) => {
        rli.question("请输入关键词: ", answer => {
            resolve(answer);
        });
    });
}

function collectResultLinks($) {
    // Add the first adv link
    // adLinks.push($('ol#b_results > li:nth-child(1) > ul > li > div > h2 > a').attr('href'));
    // Add the last adv link
    // adLinks.push($('ol#b_results > li.b_ad.b_adBottom > ul > li > div > h2 > a').attr('href'));

    // console.log 一个selector试试看
    // console.log($.html());
    let tmp = $("#b_results > li:nth-child(2) > h2 > a");
    console.log(tmp.html());
    tmp = $("li.b_algo", "#b_results");
    tmp = $("a[href^='/']:not(a[href^='//'])", "#b_results").html();

    let resultItems = $("#b_results > li.b_algo");
    resultItems.each(($) => {
        resultLinks.push($('li > h2 > a').attr('href'));
    });

    let pages = $('#b_results > li.b_pag > nav > ul');
    for (let i = 0; i < pages.length;) {
        $(pages[i]);
        i++;
        if ($('li:has(.sb_pagS.sb_pagS_bg)')) {
            $ = pages[i];
            return $('li > a').attr('href');
        }
    }

    return null;
}