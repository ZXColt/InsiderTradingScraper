const request = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');
const insiderTradingJson = 'insiderTrading.json';
const newsRssFeed = 'newsFeed.json';

//rss parser
let Parser = require('rss-parser');
let parser = new Parser();

// scrapes finviz insider trading for the top insider trading of the previous 7 days
async function finvizScrape() {
	const result = await request.get(
		'https://finviz.com/insidertrading.ashx?or=-10&tv=100000&tc=7&o=-transactionValue'
	);

	const $ = cheerio.load(result);
	var parseFlag = false;
	var builtJson = [];
	var builder = Array(10).fill('');
	var parseCounter = 0;

	$('td').each((index, element) => {
		let field = $(element).text();

		if (field === 'SEC Form 4' && !parseFlag) {
			parseFlag = true;
		}

		if (parseFlag && parseCounter < 10 && field !== 'SEC Form 4') {
			builder[parseCounter] = field;
			parseCounter++;
		}

		if (parseCounter === 10 && field !== 'SEC Form 4') {
			let json = {
				ticker: builder[0],
				owner: builder[1],
				relationship: builder[2],
				date: builder[3],
				transaction: builder[4],
				cost: builder[5],
				shares: builder[6],
				value: builder[7],
				sharesTotal: builder[8],
				secForm4Date: builder[9],
			};
			builtJson.push(json);
			builder = Array(10).fill('');
			parseCounter = 0;
		}
	});
	//write to file
	var js = JSON.stringify(builtJson);
	fs.writeFile(insiderTradingJson, js, (err) => {
		if (err) {
			throw err;
		}
	});
}

async function newsRSS() {
	let builtJson = [];
	let feed = await parser.parseURL(
		'https://www.investing.com/rss/news_285.rss'
	);

	feed.items.forEach((item) => {
		builtJson.push(item);
	});
	var js = JSON.stringify(builtJson);
	fs.writeFile(newsRssFeed, js, (err) => {
		if (err) {
			throw err;
		}
	});
}
newsRSS();
finvizScrape();
