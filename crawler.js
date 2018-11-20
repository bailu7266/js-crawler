var request = require('request-promise');
var cheerio = require('cheerio');
var getDomain = require('./getdomain.js');
// var puppeteer = require('puppeteer');   
var lunr = require('lunr');
var index = lunr(function() {
    this.field('title');
    this.field('body');
    this.ref('id');
});

var URL = require('url-parse');

const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

var START_URL = process.argv[2];
// var START_URL = "http://www.qq.com";
var SEARCH_WORD = "stemming";
var MAX_PAGE_TO_VISIT = 10;
var pagesToVisit = [];
var pagesVisited = {};
var numPagesVisited = 0;

var url /* = new URL(START_URL)*/ ;
var baseUrl /* = url.protocol + '//' + url.hostname*/ ;
var topDomain;

function promptUrl() {
    const rli = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve, reject) => {
        rli.question("请输入网站: ", answer => {
            resolve(answer);
            rli.close();
        });
    });
}

(async() => {
    while (!START_URL) {
        START_URL = await promptUrl()
    }

    url = new URL(START_URL);
    baseUrl = url.protocol + '//' + url.hostname;
    topDomain = await getDomain(url.hostname)
    console.log("匹配域名：" + topDomain);
    pagesToVisit.push(START_URL);
    crawl();
})();

/*
const { fork } = require('child_process');
// var getDomain = require('./getdomain');
var getDomain = fork('./getdomain.js', [url.hostname]);

getDomain.on('message', function(msg) {
    topDomain = msg['domain'];
    console.log("域名：" + topDomain);
    pagesToVisit.push(START_URL);
    crawl();
});
*/
// getDomain.send({ hostname: url.hostname });
/*
process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c')
        process.exit();
    else {
        console.log('You pressed the "${str}" key');
        console.log();
        console.log(key);
        console.log();
    }
});
*/

/*
getDomain(url.hostname)
    .then(name => {
        topDomain = name;
        console.log("域名：" + topDomain);
        pagesToVisit.push(START_URL);
        crawl();
    })
    .catch(err => {
        console.log(err);
        topDomain = null;
    });
*/

function crawl() {
    if (numPagesVisited >= MAX_PAGE_TO_VISIT) {
        console.log("到达访问页面数上限，见好就收");
        var result = index.search('sina');
        console.log('我们发现了 ' + result.length + ' 个文档');
        if (result.length > 0)
            console.log('第一个是：' + result[0]);
        return;
    }
    var nextPage = pagesToVisit.pop();
    if (!nextPage) {
        console.log("没有网页可访问了！")
        return;
    }
    if (nextPage in pagesVisited) { // 该页面已经访问过了，掠过
        crawl();
    } else {
        // 访问该页面
        visitPage(nextPage, crawl);
    }
}

async function visitPage(url, cb) {
    pagesVisited[url] = true; // 试验用，实际应用中会无限扩大，所以需要限制大小
    numPagesVisited++;

    console.log("Visiting page " + url);

    var opt = {
        uri: url,
        resolveWithFullResponse: true,
        transform: function(body, response, resolveWithFullResponse) {
            if (response.statusCode === 200)
                return cheerio.load(body);
            else {
                throw new Error('Transform failed with ret code： ' + response.statusCode);
            }
        }
    };

    try {
        var $ = await request(opt)
            // Check status code (200 is HTTP OK)
            // console.log("Status code: " + response.statusCode);
            // var $ = cheerio.load(body);
        collectInternalLinks($);
        collectExternalLinks($);
        // Index page
        var doc = {
            'id': url,
            'body': $('html > body'),
            'title': $('title').text()
        };
        index.add(doc);

        /*if (searchForWord($, SEARCH_WORD)) {
            console.log('WORD "' + SEARCH_WORD + '" found at page ' + page);
            // 成功，适可而止？
        }*/
    } catch (err) {
        console.log(err.message);
    }
    cb();
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