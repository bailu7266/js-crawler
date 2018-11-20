var request = require('request-promise');
var cheerio = require('cheerio');
var URL = require('url-parse');

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

var SEARCH_URL = process.argv[2];

function promptUrl() {
    return new Promise((resolve, reject) => {
        rli.question("请输入网站: ", answer => {
            resolve(answer);
        });
    });
}

// main
(async() => {
    while (!SEARCH_URL) {
        SEARCH_URL = await promptUrl()
    }

    rli.close();

    url = new URL(SEARCH_URL);
    baseUrl = url.protocol + '//' + url.hostname;

    var opt = {
        uri: url,
        resolveWithFullResponse: true,
        transform: function(body, response) {
            if (response.statusCode === 200)
                return cheerio.load(body);
            else {
                throw new Error('Transform failed with ret code： ' + response.statusCode);
            }
        }
    };

    while (numResultPages < MAX_RESULT_PAGES) {
        try {
            numResultPages++;
            var $ = await request(opt);
            var nextUrl = collectResultLinks($);
            if (nextUrl)
                opt.uri = nextUrl;
            else break;
        } catch (err) {
            console.log(err.message);
            break;
        }
    }

    // console log collected links
    resultLinks.each((i, lnk) => {
        console.log('No $i: ' + lnk);
    });
})();

function collectResultLinks($) {
    // Add the first adv link
    adLinks.push($('#b_results > li:nth-child(1) > ul > li > div > h2 > a').attr('href'));
    // Add the last adv link
    adLinks.push($('#b_results > li.b_ad.b_adBottom > ul > li > div > h2 > a').attr('href'));

    var resultItem = $('#b_results > li.b_algo');
    resultItem.each(($) => {
        resultLinks.push($('li > h2 > a').attr('href'));
    });

    var pages = $('#b_results > li.b_pag > nav > ul');
    for (var i = 0; i < pages.length;) {
        var $ = pages[i];
        i++;
        if ($('li:has(.sb_pagS.sb_pagS_bg)')) {
            $ = page[i];
            return $('li > a').attr('href');
        }
    }

    return null;
}