#!/usr/bin/env node

'use strict';
const CommandLine = require('./widgets/command-line');
const { inspect, isPrimitive } = require('util');
const { EventEmitter } = require('events');
const { screen, log: logger, box, list, listbar } = require('blessed');

const _screen = screen({
  smartCSR: true,
  fullUnicode: true,
  autoPadding: true,
  ignoreLocked: ['C-c'],
  dockBorders: true,
  tput: true
});

_screen.title = 'WARP';

const ui = {
  menuBar: listbar({
    parent: _screen,
    height: 1,
    shrink: false,
    style: {
      bg: '#999999',
      item: {
        fg: 'yellow',
        bg: '#222222'
      },
      selected: {
        fg: 'yellow',
        bg: '#222222'
      },
      prefix: {
        fg: 'yellow',
        bg: '#222222'
      }
    },
    commands: {}
  }),

  componentList: list({
    parent: _screen,
    top: 2,
    height: '50%',
    width: '50%',
    left: 0,
    tags: true,
    label: '{blue-fg}{white-bg} Components {/}',
    border: {
      type: 'line',
      fg: 'white'
    },
    shrink: true
  }),


  eventLog: logger({
    parent: _screen,
    top: 2,
    height: '50%',
    width: '50%',
    left: '50%',
    tags: true,
    label: '{white-fg}{blue-bg} Events {/}',
    border: {
      type: 'line',
      fg: 'white'
    },
    shrink: true
  }),

  logger: logger({
    parent: _screen,
    height: '50%-5',
    width: '100%',
    bottom: 3,
    tags: true,
    label: '{#005500-bg}{white-fg} Log {/}',
    border: {
      type: 'line',
      fg: 'white'
    },
    shrink: true
  }),

  commandLine: CommandLine.create({
    parent: _screen,
    bottom: 0,
    left: 0,
    right: 0,
    hideOnAnswer: true,
    fixed: true,
    focused: true,
    tags: true,
    keyable: true,
    height: 3,
    padding: 1,
    valign: 'middle',
    hidden: true,
    shrink: false,
    style: {
      bg: '#111111'
    }
  })
};

const log = ui.log = ui.logger.log.bind(ui.logger);
ui.events = new EventEmitter();

ui.logEvent = (event, data, header = {}) => {
  let {from = 'global'} = header;
  let _eventText = `{yellow-fg}<${from}>:{/}{cyan-fg}[${event}]{/}`;
  if (data) {
    let _fields = Object
      .entries(data)
      .map(([k,v]) => `\n\t{bold}${k}{/}:{red-fg}${inspect(v)}{/}`)
      .join(', ');
    _eventText = `${_eventText}${_fields}`;
  }

  ui.eventLog.log(_eventText);
};

ui.menuBar.setItems({
  'load': {
    keys: ['f1'],
    callback: () => {
      ui.commandLine.questions({
        text: '{red-fg}application name: {/}', defaultAnswer: 'app'
      }).then(([name]) => {
        ui.events.emit('actions.load', { name });
      });
    }
  },

  'start': {
    keys: ['f2'],
    callback: () => {
      ui.events.emit('actions.start');
    }
  },

  'stop': {
    keys: ['f3'],
    callback: () => {
      ui.events.emit('actions.stop');
    }
  },

  'use': {
    keys: ['f4'],
    callback: () => {
      ui.commandLine.questions([{
        text: '{blue-fg}load by: (1: module, 2: config) {/} ',
        defaultAnswer: '2'
      }, {
        text: '{blue-fg}path: {/}', defaultAnswer: './'
      }]).then(([type, path]) => {
        ui.events.emit('actions.use', { type, path });
      });
    }
  },

  'emit': {
    keys: ['f5'],
    callback: () => {
      ui.commandLine.questions([
        { text: '{red-fg}channel: {/}', defaultAnswer: 'warn' },
        { text: '{red-fg}data: {/}', defaultAnswer: { msg: 'hello' } }
      ]).then(([channel, data]) => {
        ui.events.emit('actions.emit', channel, JSON.parse(data));
      });
    }
  },

  'quit': {
    keys: ['f10'],
    callback: () => {
      ui.commandLine.questions({
        text: '{red-fg}really exit? (y/n) {/}', defaultAnswer: 'y'
      }).then(([answer]) => {
        if (answer.match(/^y(es)?$/i)) {
          ui.events.emit('actions.quit');
        }
      });
    }
  },

  'repl': {
    keys: ['f12'],
    callback: () => ui.commandLine.toggle()
  }
});

ui.commandLine.on('submit', log);
ui.commandLine.on('line', log);

_screen.key(['C-c'], function() {
  process.exit(0);
});

_screen.render();

export default ui;
