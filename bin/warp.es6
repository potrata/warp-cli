#!/usr/bin/env node

'use strict';

import warp from 'node-warp';
import ui from './ui';
import * as actions from './actions';


let context = {};

ui.events.on('actions.load', ({name}) => {
  Promise
    .resolve({ app: context.app, name: name })
    .then(destroyApp)
    .then(createApp)
    .then(app => (context.app = app));
});

ui.events.on('actions.emit', (channel, data) => {
  if (!context.app) {
    return ui.log(Error(`failed to emit: application is stopped`));
  }

  context.app.bus.emit(channel, data, { from: 'dashboard' });
});

ui.events.on('actions.use', ({type, path}) => {
  Promise.resolve({ app: context.app, name: context.app.name, path: path })
    .then(destroyApp)
    .then(createApp)
    .then(() => actions.use.call(context, type, path))
    .catch(err => ui.log(err));
});

ui.events.on('actions.quit', () => {
  function quit() { process.exit(0); }

  setTimeout(quit, 5000).unref();
  destroyApp(context).then(quit);
});


function createApp({name}) {
  ui.log(`initializing [${name}]`);

  let app = warp({ name });
  app.bus.on('event', (...args) => {
    ui.logEvent(...args);
  });

  return app;
}

function destroyApp(data) {
  if (!data.app) {
    return Promise.resolve(data);
  }

  ui.log(`destroying [${data.app.name}]`);
  return data.app.destroy().then(() => data);
}


process.on('uncaughtException', err => console.error(err.stack) && process.exit(1));
process.on('unhandledRejection', err => console.error(err.stack) && process.exit(1));
