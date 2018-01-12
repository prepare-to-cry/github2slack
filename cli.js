#!/usr/bin/env node
'use strict';

const meow = require('meow');
const router = require('./src/router');
const updateNotifier = require('update-notifier');
const pkg = require('./package.json');

updateNotifier({ pkg }).notify();

const cli = meow(`
Usage

   $ github2slack <command> <params>

   $ github2slack sample <param>             # Uses the <PARAM>
   $ github2slack other <param>              # Other the <PARAM>
   $ github2slack another <param>            # Another the <PARAM>
   
 Examples

   $ github2slack sample TEST                # Uses the TEST
   $ github2slack sample YOLO                # Uses the YOLO
   $ github2slack other YOLO                 # Uses the YOLO
   $ github2slack another YOLO               # Uses the YOLO
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