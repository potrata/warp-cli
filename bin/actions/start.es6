'use strict';

export default function start() {
  assert(this.app, 'app should be an instance of warp.Application');

  return this.app.start();
}

