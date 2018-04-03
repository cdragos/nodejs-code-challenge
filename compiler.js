#!/usr/bin/env node
'use strict';

const fs = require('fs');
const pattern_regex = /([^\(]*)\((.+)\)/;
const func_pattern_regex = /\{(.+)\}/;
const file_path = process.argv.slice(2)[0];

const jobs = [];


if (file_path) {
  fs.readFile(file_path, 'utf8', (err, contents) => {
    if (err) {
      console.error(err);
      return;
    }
    process_file(contents);
  });

} else {
  console.error('File path is not defined.');
}


function process_file(contents) {
  contents.split(';').forEach((line) => {
    const matched_line = pattern_regex.exec(line.trim());
    if (!matched_line) return;

    const [func_name, func_arguments] = matched_line.slice(1, 3);
    switch (func_name) {
      case 'console.log':
        _console_log(func_arguments);
        break;
      case 'setTimeout':
        const [func_body, timeout] = func_arguments.split(',');
        const matched_func_body = func_pattern_regex.exec(func_body);
        if (!matched_func_body) return;

        const body = matched_func_body.slice(1)[0].trim();
        const matched_body = pattern_regex.exec(body);
        const [func_body_name, func_body_arguments] = matched_body.slice(1, 3);
        if (func_body_name !== 'console.log') return;

        _setTimeout(() => { _console_log(func_body_arguments); }, timeout);
        break;
    }
  });
  tick();
}


function _console_log(data) {
  process.stdout.write(data + '\n');
}


function _setTimeout(func_body, timeout) {
  jobs.push({
    callback: func_body,
    timeout: parseInt(timeout),
    timestamp: parseInt(Date.now()),
  });
}


function tick() {
  while (jobs.length > 0) {
    jobs.forEach((job, index) => {
      const now = parseInt(Date.now());
      if (job.timestamp + job.timeout <= now) {
        job.callback();
        jobs.splice(index, 1);
      }
    });
  }
}
