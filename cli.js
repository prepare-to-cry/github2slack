#!/usr/bin/env node
'use strict';

const meow = require('meow');
const router = require('./src/router');
const updateNotifier = require('update-notifier');
const pkg = require('./package.json');

updateNotifier({ pkg }).notify();

const cli = meow(`
Usage

   $ github2slack <GITHUB_LABEL> <DESTINATION_SLACK_CHANNEL>
   
 Examples

   $ github2slack "Ready for QA" "qa-channel"    # Posts to #qa-channel when label is added
   $ github2slack "DevReady" "codereviews"       # Posts to #codereviews when label is added
`,
  {
    alias: {
      v: 'version'
    },
    boolean: ['version']
  }
);

if (cli.input.length > 0) {
	router.init(cli.input, cli.flags);
} else {
	cli.showHelp(2);
}