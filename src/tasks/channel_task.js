#!/usr/bin/env node
'use strict';

const log = console.log;
const fs = require('fs');
const Utils = require('../utils/utils');
const SlackWebhook = require('slack-webhook');
const Request = require('sync-request');
const Chalk = require('chalk');
const _ = require('underscore');
require('dotenv').config()

const CACHE_FILE_PATH = '{LABEL}_{CHANNEL}.cache.json'
const CONFIG_PATH = `${require('os').homedir()}/.github2slack/`
const BOT_NAME = 'github2slack Bot'

function getEvents() {
	const response = Request('GET', `https://api.github.com/repos/${process.env.REPO_USERNAME}/${process.env.REPO_NAME}/issues/events`, {
			headers: {
					'Authorization': `token ${process.env.GITHUB_TOKEN}`,
					'User-Agent': 'Github-Label-Notifications'
			}
	});

	let events = [];

	if (response.statusCode === 200) {
			events = JSON.parse(response.getBody());
	} else {
			log(Chalk.red(`Error: ${response.getBody()}`));
	}

	return events;
}

function getLastTimestamp(cachePath) {
	let lastTimestamp;

	if (!Utils.fileExists(cachePath)) {
			saveDataToCache({
					lastTimestamp: new Date(0)
			}, cachePath);
	}

	const cache = JSON.parse(Utils.readFile(cachePath));
	return cache.lastTimestamp;
}

function saveDataToCache(data, cachePath) {
	Utils.saveToFile(JSON.stringify(data, null, 2), cachePath);
}

function handleTimestamp(newTimestamp, cachePath) {
	return Date.parse(getLastTimestamp(cachePath)) < Date.parse(newTimestamp);
}

function saveHighestDateOnCache(events, cachePath) {
	const highestDate = events.sort((a, b) => {
			return new Date(b.created_at) - new Date(a.created_at);
	})[0].created_at;

	saveDataToCache({
			lastTimestamp: highestDate
	}, cachePath);
}

function createSlackMessage(issue, label) {
	const message = {
			attachments: [{
					fallback: `The pull request ${issue.html_url} was just tagged as: *${label}*`,
					color: "#36a64f",
					author_name: issue.user.login,
					title: `_#${issue.number}_ - *${issue.title}*`,
					title_link: issue.html_url,
					text: `This pull request was just tagged as: *${label}*`,
					footer: BOT_NAME,
					ts: Date.parse(new Date) / 1000
			}]
	}

	return message;
}

function removeDuplicateEvents(events) {
	const groupedEvents = _.groupBy(events, event => event.issue.id);

	const deDuplicatedEvents = [];

	Object.keys(groupedEvents).forEach(function (key) {
			const latestEvent = groupedEvents[key].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
			deDuplicatedEvents.push(latestEvent);
	});

	return deDuplicatedEvents;
}

function getCacheFilePath(label, channel) {
	const fileName = CACHE_FILE_PATH
		.replace(`{LABEL}`, label)
		.replace(`{CHANNEL}`, channel)
		.replace(/ /g, '_')
		.toLowerCase()
	return `${CONFIG_PATH}${fileName}`
}

function makeConfigFolder() {
	if (!Utils.fileExists(CONFIG_PATH)) {
		fs.mkdirSync(CONFIG_PATH);
	}
}

// Main code //
const self = module.exports = {
	init: (label, channel) => {
		makeConfigFolder()
		const cachePath = getCacheFilePath(label, channel)
		Utils.title(Chalk.green(`Checking for new events for ${Chalk.yellow('#'+label)}...\n`));

    let events = getEvents()
        .filter(item => item.event === `labeled`)
        .filter(item => item.label.name.toLowerCase() === label.toLowerCase())
        .filter(item => handleTimestamp(item.created_at, cachePath));

    events = removeDuplicateEvents(events);

    if (events.length == 0) {
        Utils.titleError(`No events for ${Chalk.yellow(label)} this time`);
    } else {
        log(`There are currently ${Chalk.green(events.length)} events(s):`);

        events.forEach(item => {
						Utils.title(`Sending link to slack about ${Chalk.green('#'+item.issue.number)} - ${Chalk.green(item.issue.title)}`);
            const message = createSlackMessage(item.issue, label);
            self.postMessageToSlack(message, channel);
        });

        saveHighestDateOnCache(events, cachePath);
    }		
	},

	postMessageToSlack: (message, channel) => {
    const slack = new SlackWebhook(process.env.SLACK_WEBHOOK, {
        defaults: {
            username: BOT_NAME,
            channel: `#${channel}`,
            icon_emoji: ':monkey_face:',
            mrkdwn: true
        }
    });

    slack.send(message)
	}
};
