var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var getDomain = require('./getdomain');

var START_URL = "http://www.zxxk.com";
var SEARCH_WORD = "stemming";
var MAX_PAGE_TO_VISIT = 10;

var pagesToVisit = [];
var pagesVisited = {};
var numPagesVisited = 0;

var url = new URL(START_URL);
var baseUrl = url.protocol + '//' + url.hostname;
var topDomain;

getDomain(url.hostname, function(name) {
    topDomain = name;
    console.log("域名：" + topDomain);
    pagesToVisit.push(START_URL);
    crawl();
});

function crawl() {
    if (numPagesVisited >= MAX_PAGE_TO_VISIT) {
        console.log("到达访问页面数上限，见好就收");
        return;
    }
    var nextPage = pagesToVisit.pop();
    if (!nextPage) {
        console.log("没有网页可访问了！")
        return;
    }
    if (nextPage in pagesVisited) {
        // 该页面已经访问过了，掠过
        crawl();
    } else {
        // 访问该页面
        visitPage(nextPage, crawl);
    }
}

function visitPage(url, cb) {
    pagesVisited[url] = true; // 试验用，实际应用中会无限扩大，所以需要限制大小
    numPagesVisited++;

    console.log("Visiting page " + url);
    request(url, function(error, response, body) {
        // Check status code (200 is HTTP OK)
        console.log("Status code: " + response.statusCode);
        if (response.statusCode !== 200) {
            cb(); //没有成功，继续前进
            return;
        }

        // Parse the document body
        var $ = cheerio.load(body);
        if (searchForWord($, SEARCH_WORD)) {
            console.log('WORD "' + SEARCH_WORD + '" found at page ' + page);
            // 成功，适可而止？
        } else {
            collectInternalLinks($);
            collectExternalLinks($);
            cb();
        }
    });
}

function searchForWord($, word) {
    var bodyText = $('html > body').text();
    if (bodyText.toLowerCase().indexOf(word.toLowerCase()) !== -1) {
        return true;
    }
    return false;
}

function collectInternalLinks($) {
    var relativeLinks = $("a[href^='/']:not(a[href^='//'])");
    console.log('Found ' + relativeLinks.length + ' relative links on page');
    relativeLinks.each(function() {
        // if (!(/^\/\//.test($(this).attr("href"))))
        pagesToVisit.push(baseUrl + $(this).attr('href'));
    });
}

function collectExternalLinks($) {
    var absoluteLinks = $("a[href^='http'], a[href^='//']");
    console.log('Found ' + absoluteLinks.length + ' absolute links on page');

    var numSubDomainLinks = 0;
    absoluteLinks.each(function(i) {
        var aUrl = $(this).attr('href');
        if ((new URL(aUrl)).hostname.indexOf(topDomain) >= 0) {
            // 查看以‘//’开头的外部链接
            if (/^\/\//.test(aUrl)) {
                console.log("第 " + i + " 个链接是： " + aUrl);
                pagesToVisit.push(url.protocol + aUrl);
            } else {
                // 只访问本域名下的网站
                pagesToVisit.push(aUrl);
            }
            numSubDomainLinks++;
        }
    });
    console.log("Include " + numSubDomainLinks + " subdomain links.");
}