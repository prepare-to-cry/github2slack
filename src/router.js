#!/usr/bin/env node
'use strict';

const Chalk = require('chalk');
const Utils = require('./utils/utils');
const log = console.log;

const ChannelTask = require('./tasks/channel_task');

function run(label, channel) {
	ChannelTask.init(label, channel);
	setTimeout(() => {
		run(label, channel)
	}, 10000);
}

// Main code //
const self = module.exports = {
	init: (input, flags) => {

		if (input.length < 2) {
			log(Chalk.red(`You need to specify the input`));
			return;
		}

		const label = input[0]
		const channel = input[1]

		run(label, channel);

	}
};
