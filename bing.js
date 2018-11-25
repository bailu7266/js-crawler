module.exports = {
    crawl: _crawl,
    protocol: 'https:',
    host: 'www.bing.com',
    searchPath: '/search',
    proxy: null
};

function _crawl($, resultLinks) {
    // Add the first adv link
    // adLinks.push($('ol#b_results > li:nth-child(1) > ul > li > div > h2 > a').attr('href'));
    // Add the last adv link
    // adLinks.push($('ol#b_results > li.b_ad.b_adBottom > ul > li > div > h2 > a').attr('href'));

    let resultItems = $('#b_results > li.b_algo');

    resultItems.each((i, item) => {
        resultLinks.push({
            name: $('li h2 > a[h*="ID=SERP"]', item).text(),
            uri: $('li h2 > a[h*="ID=SERP"]', item).attr('href'),
            descr: $('li > div.b_caption >p', item).text()
        });
    });

    let nextNavPage = $(
        '#b_results > li.b_pag > nav > ul > li:has("a.sb_pagS.sb_pagS_bp")'
    ).next(':not(".sb_inactP")');
    if (nextNavPage.length) {
        // console.log($('a[h*="ID=SERP"]', nextNavPage).text());
        return $('a[h*="ID=SERP"]', nextNavPage).attr('href');
    }

    return null;
}