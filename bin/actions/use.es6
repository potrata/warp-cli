'use strict';

import assert from 'assert';
import {resolve} from 'path';
import {isString} from 'util';

export default function use(type, path) {
  assert(isString(path), 'name should be a string');
  let _fullPath = resolve(process.cwd(), path);
  if (type === '1') {
    this.app.use(_fullPath);
  } else {
    let _configModule = require(_fullPath);
    this.app.name     = _configModule.name;
    this.app.config   = Object.assign({},_configModule);
    this.app.data = Object.assign({ name: this.name }, _configModule.data);

    this.app.useConfig(_configModule.components);
  }
  return this.app.start();
}
