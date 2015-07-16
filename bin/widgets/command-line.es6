'use strict';

const repl = require('repl');
const { isPrimitive } = require('util');
const vm   = require('vm');
const { PassThrough } = require('stream');
const { Box } = require('blessed');


class CommandLine extends Box {
  static create(...args) {
    return new CommandLine(...args);
  }

  constructor(options) {
    super(options);

    this.contextData  = options.contextData || {};
    this.hideOnAnswer = options.hideOnAnswer || false;

    this.on('show', () => {
      this.focus();
    });
    this.start(options.context);
  }

  start() {
    let _input  = new PassThrough();
    let _output = new PassThrough({ encoding: 'utf8' });

    _input.pipe(_output);

    let _replInstance = repl.start({
      prompt:          '>> ',
      input:           _input,
      output:          _output,
      terminal:        true,
      ignoreUndefined: true,
      useGlobal:       false
    });


    this.on('keypress', (ch, key) => {
      if (!this.visible) { return; }

      if (key.name === 'enter') {
        this.emit('submit', _replInstance.line);
      }

      _input.emit('keypress', ch, key);
      this.screen.render();
    });

    _output.on('data', (data) => {
      this._refreshLine();

      data = data.replace(/^(\r?\n).*/g, '');

      if (data.length && data.lastIndexOf('\n') !== -1) {
        this.emit('line', data);
      }
      this.screen.render();
    });

    this._replInstance = _replInstance;
  }

  _refreshLine() {
    let {line = '', _initialPrompt = '', cursor} = this._replInstance;

    let leftPart  = line.slice(0, cursor);
    let rightPart = line.slice(cursor);

    return this.setContent(`${_initialPrompt}${leftPart}{yellow-bg}_{/}${rightPart}`);
  }

  questions(items = []) {
    if (!Array.isArray(items)) {
      items = [].concat(items);
    }

    let _nextQuestion = (data) => (answers) =>
      this._getQuestionPromise(data)
        .then(answer => answers.concat(answer));

    this.show();
    return items
      .map(_nextQuestion)
      .reduce((collector, _question) => {
        return collector.then((answers) => {
          return _question(answers);
        });
      }, Promise.resolve([]))
      .then(answers => {
        if (this.hideOnAnswer) { this.hide(); }
        return answers;
      });
  }

  clear() {
    this._replInstance.clearLine();
    this.screen.render();
    return this;
  }

  _getQuestionPromise({text, defaultAnswer = ''}) {
    return new Promise((resolve) => {
      this.clear();
      this._replInstance.question(text, (answer) => {
        resolve(answer);
      });
      this._safeWrite(defaultAnswer);
    });
  }

  _safeWrite(value) {
    if (!value) { return; }

    if (!isPrimitive(value)) {
      value = JSON.stringify(value);
    }
    return this._replInstance.write(value);
  }
}

export default CommandLine;
