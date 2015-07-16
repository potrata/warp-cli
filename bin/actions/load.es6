'use strict';

import {isString} from 'util';

export default function load() {
  assert(isString(this.name), 'name should be a string');

  return this.app.start();
}


function tryGetWarp() {
  let _module = null;
  try {
    _module = require('@hp/warp');
  } catch(err) {

  }
}

