(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "v1", {
  enumerable: true,
  get: function () {
    return _v.default;
  }
});
Object.defineProperty(exports, "v3", {
  enumerable: true,
  get: function () {
    return _v2.default;
  }
});
Object.defineProperty(exports, "v4", {
  enumerable: true,
  get: function () {
    return _v3.default;
  }
});
Object.defineProperty(exports, "v5", {
  enumerable: true,
  get: function () {
    return _v4.default;
  }
});
Object.defineProperty(exports, "NIL", {
  enumerable: true,
  get: function () {
    return _nil.default;
  }
});
Object.defineProperty(exports, "version", {
  enumerable: true,
  get: function () {
    return _version.default;
  }
});
Object.defineProperty(exports, "validate", {
  enumerable: true,
  get: function () {
    return _validate.default;
  }
});
Object.defineProperty(exports, "stringify", {
  enumerable: true,
  get: function () {
    return _stringify.default;
  }
});
Object.defineProperty(exports, "parse", {
  enumerable: true,
  get: function () {
    return _parse.default;
  }
});

var _v = _interopRequireDefault(require("./v1.js"));

var _v2 = _interopRequireDefault(require("./v3.js"));

var _v3 = _interopRequireDefault(require("./v4.js"));

var _v4 = _interopRequireDefault(require("./v5.js"));

var _nil = _interopRequireDefault(require("./nil.js"));

var _version = _interopRequireDefault(require("./version.js"));

var _validate = _interopRequireDefault(require("./validate.js"));

var _stringify = _interopRequireDefault(require("./stringify.js"));

var _parse = _interopRequireDefault(require("./parse.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
},{"./nil.js":3,"./parse.js":4,"./stringify.js":8,"./v1.js":9,"./v3.js":10,"./v4.js":12,"./v5.js":13,"./validate.js":14,"./version.js":15}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/*
 * Browser-compatible JavaScript MD5
 *
 * Modification of JavaScript MD5
 * https://github.com/blueimp/JavaScript-MD5
 *
 * Copyright 2011, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 *
 * Based on
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */
function md5(bytes) {
  if (typeof bytes === 'string') {
    const msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

    bytes = new Uint8Array(msg.length);

    for (let i = 0; i < msg.length; ++i) {
      bytes[i] = msg.charCodeAt(i);
    }
  }

  return md5ToHexEncodedArray(wordsToMd5(bytesToWords(bytes), bytes.length * 8));
}
/*
 * Convert an array of little-endian words to an array of bytes
 */


function md5ToHexEncodedArray(input) {
  const output = [];
  const length32 = input.length * 32;
  const hexTab = '0123456789abcdef';

  for (let i = 0; i < length32; i += 8) {
    const x = input[i >> 5] >>> i % 32 & 0xff;
    const hex = parseInt(hexTab.charAt(x >>> 4 & 0x0f) + hexTab.charAt(x & 0x0f), 16);
    output.push(hex);
  }

  return output;
}
/**
 * Calculate output length with padding and bit length
 */


function getOutputLength(inputLength8) {
  return (inputLength8 + 64 >>> 9 << 4) + 14 + 1;
}
/*
 * Calculate the MD5 of an array of little-endian words, and a bit length.
 */


function wordsToMd5(x, len) {
  /* append padding */
  x[len >> 5] |= 0x80 << len % 32;
  x[getOutputLength(len) - 1] = len;
  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < x.length; i += 16) {
    const olda = a;
    const oldb = b;
    const oldc = c;
    const oldd = d;
    a = md5ff(a, b, c, d, x[i], 7, -680876936);
    d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
    b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
    a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = md5gg(b, c, d, a, x[i], 20, -373897302);
    a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
    a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
    d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = md5hh(d, a, b, c, x[i], 11, -358537222);
    c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
    a = md5ii(a, b, c, d, x[i], 6, -198630844);
    d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }

  return [a, b, c, d];
}
/*
 * Convert an array bytes to an array of little-endian words
 * Characters >255 have their high-byte silently ignored.
 */


function bytesToWords(input) {
  if (input.length === 0) {
    return [];
  }

  const length8 = input.length * 8;
  const output = new Uint32Array(getOutputLength(length8));

  for (let i = 0; i < length8; i += 8) {
    output[i >> 5] |= (input[i / 8] & 0xff) << i % 32;
  }

  return output;
}
/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */


function safeAdd(x, y) {
  const lsw = (x & 0xffff) + (y & 0xffff);
  const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return msw << 16 | lsw & 0xffff;
}
/*
 * Bitwise rotate a 32-bit number to the left.
 */


function bitRotateLeft(num, cnt) {
  return num << cnt | num >>> 32 - cnt;
}
/*
 * These functions implement the four basic operations the algorithm uses.
 */


function md5cmn(q, a, b, x, s, t) {
  return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
}

function md5ff(a, b, c, d, x, s, t) {
  return md5cmn(b & c | ~b & d, a, b, x, s, t);
}

function md5gg(a, b, c, d, x, s, t) {
  return md5cmn(b & d | c & ~d, a, b, x, s, t);
}

function md5hh(a, b, c, d, x, s, t) {
  return md5cmn(b ^ c ^ d, a, b, x, s, t);
}

function md5ii(a, b, c, d, x, s, t) {
  return md5cmn(c ^ (b | ~d), a, b, x, s, t);
}

var _default = md5;
exports.default = _default;
},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = '00000000-0000-0000-0000-000000000000';
exports.default = _default;
},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _validate = _interopRequireDefault(require("./validate.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parse(uuid) {
  if (!(0, _validate.default)(uuid)) {
    throw TypeError('Invalid UUID');
  }

  let v;
  const arr = new Uint8Array(16); // Parse ########-....-....-....-............

  arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
  arr[1] = v >>> 16 & 0xff;
  arr[2] = v >>> 8 & 0xff;
  arr[3] = v & 0xff; // Parse ........-####-....-....-............

  arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
  arr[5] = v & 0xff; // Parse ........-....-####-....-............

  arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
  arr[7] = v & 0xff; // Parse ........-....-....-####-............

  arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
  arr[9] = v & 0xff; // Parse ........-....-....-....-############
  // (Use "/" to avoid 32-bit truncation when bit-shifting high-order bytes)

  arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 0x10000000000 & 0xff;
  arr[11] = v / 0x100000000 & 0xff;
  arr[12] = v >>> 24 & 0xff;
  arr[13] = v >>> 16 & 0xff;
  arr[14] = v >>> 8 & 0xff;
  arr[15] = v & 0xff;
  return arr;
}

var _default = parse;
exports.default = _default;
},{"./validate.js":14}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
exports.default = _default;
},{}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = rng;
// Unique ID creation requires a high quality random # generator. In the browser we therefore
// require the crypto API and do not support built-in fallback to lower quality random number
// generators (like Math.random()).
let getRandomValues;
const rnds8 = new Uint8Array(16);

function rng() {
  // lazy load so that environments that need to polyfill have a chance to do so
  if (!getRandomValues) {
    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
    // find the complete implementation of crypto (msCrypto) on IE11.
    getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== 'undefined' && typeof msCrypto.getRandomValues === 'function' && msCrypto.getRandomValues.bind(msCrypto);

    if (!getRandomValues) {
      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
    }
  }

  return getRandomValues(rnds8);
}
},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

// Adapted from Chris Veness' SHA1 code at
// http://www.movable-type.co.uk/scripts/sha1.html
function f(s, x, y, z) {
  switch (s) {
    case 0:
      return x & y ^ ~x & z;

    case 1:
      return x ^ y ^ z;

    case 2:
      return x & y ^ x & z ^ y & z;

    case 3:
      return x ^ y ^ z;
  }
}

function ROTL(x, n) {
  return x << n | x >>> 32 - n;
}

function sha1(bytes) {
  const K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
  const H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];

  if (typeof bytes === 'string') {
    const msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

    bytes = [];

    for (let i = 0; i < msg.length; ++i) {
      bytes.push(msg.charCodeAt(i));
    }
  } else if (!Array.isArray(bytes)) {
    // Convert Array-like to Array
    bytes = Array.prototype.slice.call(bytes);
  }

  bytes.push(0x80);
  const l = bytes.length / 4 + 2;
  const N = Math.ceil(l / 16);
  const M = new Array(N);

  for (let i = 0; i < N; ++i) {
    const arr = new Uint32Array(16);

    for (let j = 0; j < 16; ++j) {
      arr[j] = bytes[i * 64 + j * 4] << 24 | bytes[i * 64 + j * 4 + 1] << 16 | bytes[i * 64 + j * 4 + 2] << 8 | bytes[i * 64 + j * 4 + 3];
    }

    M[i] = arr;
  }

  M[N - 1][14] = (bytes.length - 1) * 8 / Math.pow(2, 32);
  M[N - 1][14] = Math.floor(M[N - 1][14]);
  M[N - 1][15] = (bytes.length - 1) * 8 & 0xffffffff;

  for (let i = 0; i < N; ++i) {
    const W = new Uint32Array(80);

    for (let t = 0; t < 16; ++t) {
      W[t] = M[i][t];
    }

    for (let t = 16; t < 80; ++t) {
      W[t] = ROTL(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
    }

    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];

    for (let t = 0; t < 80; ++t) {
      const s = Math.floor(t / 20);
      const T = ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[t] >>> 0;
      e = d;
      d = c;
      c = ROTL(b, 30) >>> 0;
      b = a;
      a = T;
    }

    H[0] = H[0] + a >>> 0;
    H[1] = H[1] + b >>> 0;
    H[2] = H[2] + c >>> 0;
    H[3] = H[3] + d >>> 0;
    H[4] = H[4] + e >>> 0;
  }

  return [H[0] >> 24 & 0xff, H[0] >> 16 & 0xff, H[0] >> 8 & 0xff, H[0] & 0xff, H[1] >> 24 & 0xff, H[1] >> 16 & 0xff, H[1] >> 8 & 0xff, H[1] & 0xff, H[2] >> 24 & 0xff, H[2] >> 16 & 0xff, H[2] >> 8 & 0xff, H[2] & 0xff, H[3] >> 24 & 0xff, H[3] >> 16 & 0xff, H[3] >> 8 & 0xff, H[3] & 0xff, H[4] >> 24 & 0xff, H[4] >> 16 & 0xff, H[4] >> 8 & 0xff, H[4] & 0xff];
}

var _default = sha1;
exports.default = _default;
},{}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _validate = _interopRequireDefault(require("./validate.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
const byteToHex = [];

for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).substr(1));
}

function stringify(arr, offset = 0) {
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  const uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
  // of the following:
  // - One or more input array values don't map to a hex octet (leading to
  // "undefined" in the uuid)
  // - Invalid input values for the RFC `version` or `variant` fields

  if (!(0, _validate.default)(uuid)) {
    throw TypeError('Stringified UUID is invalid');
  }

  return uuid;
}

var _default = stringify;
exports.default = _default;
},{"./validate.js":14}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _rng = _interopRequireDefault(require("./rng.js"));

var _stringify = _interopRequireDefault(require("./stringify.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html
let _nodeId;

let _clockseq; // Previous uuid creation time


let _lastMSecs = 0;
let _lastNSecs = 0; // See https://github.com/uuidjs/uuid for API details

function v1(options, buf, offset) {
  let i = buf && offset || 0;
  const b = buf || new Array(16);
  options = options || {};
  let node = options.node || _nodeId;
  let clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq; // node and clockseq need to be initialized to random values if they're not
  // specified.  We do this lazily to minimize issues related to insufficient
  // system entropy.  See #189

  if (node == null || clockseq == null) {
    const seedBytes = options.random || (options.rng || _rng.default)();

    if (node == null) {
      // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
      node = _nodeId = [seedBytes[0] | 0x01, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
    }

    if (clockseq == null) {
      // Per 4.2.2, randomize (14 bit) clockseq
      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
    }
  } // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.


  let msecs = options.msecs !== undefined ? options.msecs : Date.now(); // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock

  let nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1; // Time since last uuid creation (in msecs)

  const dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 10000; // Per 4.2.1.2, Bump clockseq on clock regression

  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  } // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval


  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  } // Per 4.2.1.2 Throw error if too many uuids are requested


  if (nsecs >= 10000) {
    throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq; // Per 4.1.4 - Convert from unix epoch to Gregorian epoch

  msecs += 12219292800000; // `time_low`

  const tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff; // `time_mid`

  const tmh = msecs / 0x100000000 * 10000 & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff; // `time_high_and_version`

  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version

  b[i++] = tmh >>> 16 & 0xff; // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)

  b[i++] = clockseq >>> 8 | 0x80; // `clock_seq_low`

  b[i++] = clockseq & 0xff; // `node`

  for (let n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf || (0, _stringify.default)(b);
}

var _default = v1;
exports.default = _default;
},{"./rng.js":6,"./stringify.js":8}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _v = _interopRequireDefault(require("./v35.js"));

var _md = _interopRequireDefault(require("./md5.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const v3 = (0, _v.default)('v3', 0x30, _md.default);
var _default = v3;
exports.default = _default;
},{"./md5.js":2,"./v35.js":11}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;
exports.URL = exports.DNS = void 0;

var _stringify = _interopRequireDefault(require("./stringify.js"));

var _parse = _interopRequireDefault(require("./parse.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function stringToBytes(str) {
  str = unescape(encodeURIComponent(str)); // UTF8 escape

  const bytes = [];

  for (let i = 0; i < str.length; ++i) {
    bytes.push(str.charCodeAt(i));
  }

  return bytes;
}

const DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
exports.DNS = DNS;
const URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
exports.URL = URL;

function _default(name, version, hashfunc) {
  function generateUUID(value, namespace, buf, offset) {
    if (typeof value === 'string') {
      value = stringToBytes(value);
    }

    if (typeof namespace === 'string') {
      namespace = (0, _parse.default)(namespace);
    }

    if (namespace.length !== 16) {
      throw TypeError('Namespace must be array-like (16 iterable integer values, 0-255)');
    } // Compute hash of namespace and value, Per 4.3
    // Future: Use spread syntax when supported on all platforms, e.g. `bytes =
    // hashfunc([...namespace, ... value])`


    let bytes = new Uint8Array(16 + value.length);
    bytes.set(namespace);
    bytes.set(value, namespace.length);
    bytes = hashfunc(bytes);
    bytes[6] = bytes[6] & 0x0f | version;
    bytes[8] = bytes[8] & 0x3f | 0x80;

    if (buf) {
      offset = offset || 0;

      for (let i = 0; i < 16; ++i) {
        buf[offset + i] = bytes[i];
      }

      return buf;
    }

    return (0, _stringify.default)(bytes);
  } // Function#name is not settable on some platforms (#270)


  try {
    generateUUID.name = name; // eslint-disable-next-line no-empty
  } catch (err) {} // For CommonJS default export support


  generateUUID.DNS = DNS;
  generateUUID.URL = URL;
  return generateUUID;
}
},{"./parse.js":4,"./stringify.js":8}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _rng = _interopRequireDefault(require("./rng.js"));

var _stringify = _interopRequireDefault(require("./stringify.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function v4(options, buf, offset) {
  options = options || {};

  const rnds = options.random || (options.rng || _rng.default)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`


  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

  if (buf) {
    offset = offset || 0;

    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }

    return buf;
  }

  return (0, _stringify.default)(rnds);
}

var _default = v4;
exports.default = _default;
},{"./rng.js":6,"./stringify.js":8}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _v = _interopRequireDefault(require("./v35.js"));

var _sha = _interopRequireDefault(require("./sha1.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const v5 = (0, _v.default)('v5', 0x50, _sha.default);
var _default = v5;
exports.default = _default;
},{"./sha1.js":7,"./v35.js":11}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _regex = _interopRequireDefault(require("./regex.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function validate(uuid) {
  return typeof uuid === 'string' && _regex.default.test(uuid);
}

var _default = validate;
exports.default = _default;
},{"./regex.js":5}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _validate = _interopRequireDefault(require("./validate.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function version(uuid) {
  if (!(0, _validate.default)(uuid)) {
    throw TypeError('Invalid UUID');
  }

  return parseInt(uuid.substr(14, 1), 16);
}

var _default = version;
exports.default = _default;
},{"./validate.js":14}],16:[function(require,module,exports){
/* Web Font Loader v1.6.28 - (c) Adobe Systems, Google. License: Apache 2.0 */(function(){function aa(a,b,c){return a.call.apply(a.bind,arguments)}function ba(a,b,c){if(!a)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var c=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(c,d);return a.apply(b,c)}}return function(){return a.apply(b,arguments)}}function p(a,b,c){p=Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?aa:ba;return p.apply(null,arguments)}var q=Date.now||function(){return+new Date};function ca(a,b){this.a=a;this.o=b||a;this.c=this.o.document}var da=!!window.FontFace;function t(a,b,c,d){b=a.c.createElement(b);if(c)for(var e in c)c.hasOwnProperty(e)&&("style"==e?b.style.cssText=c[e]:b.setAttribute(e,c[e]));d&&b.appendChild(a.c.createTextNode(d));return b}function u(a,b,c){a=a.c.getElementsByTagName(b)[0];a||(a=document.documentElement);a.insertBefore(c,a.lastChild)}function v(a){a.parentNode&&a.parentNode.removeChild(a)}
function w(a,b,c){b=b||[];c=c||[];for(var d=a.className.split(/\s+/),e=0;e<b.length;e+=1){for(var f=!1,g=0;g<d.length;g+=1)if(b[e]===d[g]){f=!0;break}f||d.push(b[e])}b=[];for(e=0;e<d.length;e+=1){f=!1;for(g=0;g<c.length;g+=1)if(d[e]===c[g]){f=!0;break}f||b.push(d[e])}a.className=b.join(" ").replace(/\s+/g," ").replace(/^\s+|\s+$/,"")}function y(a,b){for(var c=a.className.split(/\s+/),d=0,e=c.length;d<e;d++)if(c[d]==b)return!0;return!1}
function ea(a){return a.o.location.hostname||a.a.location.hostname}function z(a,b,c){function d(){m&&e&&f&&(m(g),m=null)}b=t(a,"link",{rel:"stylesheet",href:b,media:"all"});var e=!1,f=!0,g=null,m=c||null;da?(b.onload=function(){e=!0;d()},b.onerror=function(){e=!0;g=Error("Stylesheet failed to load");d()}):setTimeout(function(){e=!0;d()},0);u(a,"head",b)}
function A(a,b,c,d){var e=a.c.getElementsByTagName("head")[0];if(e){var f=t(a,"script",{src:b}),g=!1;f.onload=f.onreadystatechange=function(){g||this.readyState&&"loaded"!=this.readyState&&"complete"!=this.readyState||(g=!0,c&&c(null),f.onload=f.onreadystatechange=null,"HEAD"==f.parentNode.tagName&&e.removeChild(f))};e.appendChild(f);setTimeout(function(){g||(g=!0,c&&c(Error("Script load timeout")))},d||5E3);return f}return null};function B(){this.a=0;this.c=null}function C(a){a.a++;return function(){a.a--;D(a)}}function E(a,b){a.c=b;D(a)}function D(a){0==a.a&&a.c&&(a.c(),a.c=null)};function F(a){this.a=a||"-"}F.prototype.c=function(a){for(var b=[],c=0;c<arguments.length;c++)b.push(arguments[c].replace(/[\W_]+/g,"").toLowerCase());return b.join(this.a)};function G(a,b){this.c=a;this.f=4;this.a="n";var c=(b||"n4").match(/^([nio])([1-9])$/i);c&&(this.a=c[1],this.f=parseInt(c[2],10))}function fa(a){return H(a)+" "+(a.f+"00")+" 300px "+I(a.c)}function I(a){var b=[];a=a.split(/,\s*/);for(var c=0;c<a.length;c++){var d=a[c].replace(/['"]/g,"");-1!=d.indexOf(" ")||/^\d/.test(d)?b.push("'"+d+"'"):b.push(d)}return b.join(",")}function J(a){return a.a+a.f}function H(a){var b="normal";"o"===a.a?b="oblique":"i"===a.a&&(b="italic");return b}
function ga(a){var b=4,c="n",d=null;a&&((d=a.match(/(normal|oblique|italic)/i))&&d[1]&&(c=d[1].substr(0,1).toLowerCase()),(d=a.match(/([1-9]00|normal|bold)/i))&&d[1]&&(/bold/i.test(d[1])?b=7:/[1-9]00/.test(d[1])&&(b=parseInt(d[1].substr(0,1),10))));return c+b};function ha(a,b){this.c=a;this.f=a.o.document.documentElement;this.h=b;this.a=new F("-");this.j=!1!==b.events;this.g=!1!==b.classes}function ia(a){a.g&&w(a.f,[a.a.c("wf","loading")]);K(a,"loading")}function L(a){if(a.g){var b=y(a.f,a.a.c("wf","active")),c=[],d=[a.a.c("wf","loading")];b||c.push(a.a.c("wf","inactive"));w(a.f,c,d)}K(a,"inactive")}function K(a,b,c){if(a.j&&a.h[b])if(c)a.h[b](c.c,J(c));else a.h[b]()};function ja(){this.c={}}function ka(a,b,c){var d=[],e;for(e in b)if(b.hasOwnProperty(e)){var f=a.c[e];f&&d.push(f(b[e],c))}return d};function M(a,b){this.c=a;this.f=b;this.a=t(this.c,"span",{"aria-hidden":"true"},this.f)}function N(a){u(a.c,"body",a.a)}function O(a){return"display:block;position:absolute;top:-9999px;left:-9999px;font-size:300px;width:auto;height:auto;line-height:normal;margin:0;padding:0;font-variant:normal;white-space:nowrap;font-family:"+I(a.c)+";"+("font-style:"+H(a)+";font-weight:"+(a.f+"00")+";")};function P(a,b,c,d,e,f){this.g=a;this.j=b;this.a=d;this.c=c;this.f=e||3E3;this.h=f||void 0}P.prototype.start=function(){var a=this.c.o.document,b=this,c=q(),d=new Promise(function(d,e){function f(){q()-c>=b.f?e():a.fonts.load(fa(b.a),b.h).then(function(a){1<=a.length?d():setTimeout(f,25)},function(){e()})}f()}),e=null,f=new Promise(function(a,d){e=setTimeout(d,b.f)});Promise.race([f,d]).then(function(){e&&(clearTimeout(e),e=null);b.g(b.a)},function(){b.j(b.a)})};function Q(a,b,c,d,e,f,g){this.v=a;this.B=b;this.c=c;this.a=d;this.s=g||"BESbswy";this.f={};this.w=e||3E3;this.u=f||null;this.m=this.j=this.h=this.g=null;this.g=new M(this.c,this.s);this.h=new M(this.c,this.s);this.j=new M(this.c,this.s);this.m=new M(this.c,this.s);a=new G(this.a.c+",serif",J(this.a));a=O(a);this.g.a.style.cssText=a;a=new G(this.a.c+",sans-serif",J(this.a));a=O(a);this.h.a.style.cssText=a;a=new G("serif",J(this.a));a=O(a);this.j.a.style.cssText=a;a=new G("sans-serif",J(this.a));a=
O(a);this.m.a.style.cssText=a;N(this.g);N(this.h);N(this.j);N(this.m)}var R={D:"serif",C:"sans-serif"},S=null;function T(){if(null===S){var a=/AppleWebKit\/([0-9]+)(?:\.([0-9]+))/.exec(window.navigator.userAgent);S=!!a&&(536>parseInt(a[1],10)||536===parseInt(a[1],10)&&11>=parseInt(a[2],10))}return S}Q.prototype.start=function(){this.f.serif=this.j.a.offsetWidth;this.f["sans-serif"]=this.m.a.offsetWidth;this.A=q();U(this)};
function la(a,b,c){for(var d in R)if(R.hasOwnProperty(d)&&b===a.f[R[d]]&&c===a.f[R[d]])return!0;return!1}function U(a){var b=a.g.a.offsetWidth,c=a.h.a.offsetWidth,d;(d=b===a.f.serif&&c===a.f["sans-serif"])||(d=T()&&la(a,b,c));d?q()-a.A>=a.w?T()&&la(a,b,c)&&(null===a.u||a.u.hasOwnProperty(a.a.c))?V(a,a.v):V(a,a.B):ma(a):V(a,a.v)}function ma(a){setTimeout(p(function(){U(this)},a),50)}function V(a,b){setTimeout(p(function(){v(this.g.a);v(this.h.a);v(this.j.a);v(this.m.a);b(this.a)},a),0)};function W(a,b,c){this.c=a;this.a=b;this.f=0;this.m=this.j=!1;this.s=c}var X=null;W.prototype.g=function(a){var b=this.a;b.g&&w(b.f,[b.a.c("wf",a.c,J(a).toString(),"active")],[b.a.c("wf",a.c,J(a).toString(),"loading"),b.a.c("wf",a.c,J(a).toString(),"inactive")]);K(b,"fontactive",a);this.m=!0;na(this)};
W.prototype.h=function(a){var b=this.a;if(b.g){var c=y(b.f,b.a.c("wf",a.c,J(a).toString(),"active")),d=[],e=[b.a.c("wf",a.c,J(a).toString(),"loading")];c||d.push(b.a.c("wf",a.c,J(a).toString(),"inactive"));w(b.f,d,e)}K(b,"fontinactive",a);na(this)};function na(a){0==--a.f&&a.j&&(a.m?(a=a.a,a.g&&w(a.f,[a.a.c("wf","active")],[a.a.c("wf","loading"),a.a.c("wf","inactive")]),K(a,"active")):L(a.a))};function oa(a){this.j=a;this.a=new ja;this.h=0;this.f=this.g=!0}oa.prototype.load=function(a){this.c=new ca(this.j,a.context||this.j);this.g=!1!==a.events;this.f=!1!==a.classes;pa(this,new ha(this.c,a),a)};
function qa(a,b,c,d,e){var f=0==--a.h;(a.f||a.g)&&setTimeout(function(){var a=e||null,m=d||null||{};if(0===c.length&&f)L(b.a);else{b.f+=c.length;f&&(b.j=f);var h,l=[];for(h=0;h<c.length;h++){var k=c[h],n=m[k.c],r=b.a,x=k;r.g&&w(r.f,[r.a.c("wf",x.c,J(x).toString(),"loading")]);K(r,"fontloading",x);r=null;if(null===X)if(window.FontFace){var x=/Gecko.*Firefox\/(\d+)/.exec(window.navigator.userAgent),xa=/OS X.*Version\/10\..*Safari/.exec(window.navigator.userAgent)&&/Apple/.exec(window.navigator.vendor);
X=x?42<parseInt(x[1],10):xa?!1:!0}else X=!1;X?r=new P(p(b.g,b),p(b.h,b),b.c,k,b.s,n):r=new Q(p(b.g,b),p(b.h,b),b.c,k,b.s,a,n);l.push(r)}for(h=0;h<l.length;h++)l[h].start()}},0)}function pa(a,b,c){var d=[],e=c.timeout;ia(b);var d=ka(a.a,c,a.c),f=new W(a.c,b,e);a.h=d.length;b=0;for(c=d.length;b<c;b++)d[b].load(function(b,d,c){qa(a,f,b,d,c)})};function ra(a,b){this.c=a;this.a=b}
ra.prototype.load=function(a){function b(){if(f["__mti_fntLst"+d]){var c=f["__mti_fntLst"+d](),e=[],h;if(c)for(var l=0;l<c.length;l++){var k=c[l].fontfamily;void 0!=c[l].fontStyle&&void 0!=c[l].fontWeight?(h=c[l].fontStyle+c[l].fontWeight,e.push(new G(k,h))):e.push(new G(k))}a(e)}else setTimeout(function(){b()},50)}var c=this,d=c.a.projectId,e=c.a.version;if(d){var f=c.c.o;A(this.c,(c.a.api||"https://fast.fonts.net/jsapi")+"/"+d+".js"+(e?"?v="+e:""),function(e){e?a([]):(f["__MonotypeConfiguration__"+
d]=function(){return c.a},b())}).id="__MonotypeAPIScript__"+d}else a([])};function sa(a,b){this.c=a;this.a=b}sa.prototype.load=function(a){var b,c,d=this.a.urls||[],e=this.a.families||[],f=this.a.testStrings||{},g=new B;b=0;for(c=d.length;b<c;b++)z(this.c,d[b],C(g));var m=[];b=0;for(c=e.length;b<c;b++)if(d=e[b].split(":"),d[1])for(var h=d[1].split(","),l=0;l<h.length;l+=1)m.push(new G(d[0],h[l]));else m.push(new G(d[0]));E(g,function(){a(m,f)})};function ta(a,b){a?this.c=a:this.c=ua;this.a=[];this.f=[];this.g=b||""}var ua="https://fonts.googleapis.com/css";function va(a,b){for(var c=b.length,d=0;d<c;d++){var e=b[d].split(":");3==e.length&&a.f.push(e.pop());var f="";2==e.length&&""!=e[1]&&(f=":");a.a.push(e.join(f))}}
function wa(a){if(0==a.a.length)throw Error("No fonts to load!");if(-1!=a.c.indexOf("kit="))return a.c;for(var b=a.a.length,c=[],d=0;d<b;d++)c.push(a.a[d].replace(/ /g,"+"));b=a.c+"?family="+c.join("%7C");0<a.f.length&&(b+="&subset="+a.f.join(","));0<a.g.length&&(b+="&text="+encodeURIComponent(a.g));return b};function ya(a){this.f=a;this.a=[];this.c={}}
var za={latin:"BESbswy","latin-ext":"\u00e7\u00f6\u00fc\u011f\u015f",cyrillic:"\u0439\u044f\u0416",greek:"\u03b1\u03b2\u03a3",khmer:"\u1780\u1781\u1782",Hanuman:"\u1780\u1781\u1782"},Aa={thin:"1",extralight:"2","extra-light":"2",ultralight:"2","ultra-light":"2",light:"3",regular:"4",book:"4",medium:"5","semi-bold":"6",semibold:"6","demi-bold":"6",demibold:"6",bold:"7","extra-bold":"8",extrabold:"8","ultra-bold":"8",ultrabold:"8",black:"9",heavy:"9",l:"3",r:"4",b:"7"},Ba={i:"i",italic:"i",n:"n",normal:"n"},
Ca=/^(thin|(?:(?:extra|ultra)-?)?light|regular|book|medium|(?:(?:semi|demi|extra|ultra)-?)?bold|black|heavy|l|r|b|[1-9]00)?(n|i|normal|italic)?$/;
function Da(a){for(var b=a.f.length,c=0;c<b;c++){var d=a.f[c].split(":"),e=d[0].replace(/\+/g," "),f=["n4"];if(2<=d.length){var g;var m=d[1];g=[];if(m)for(var m=m.split(","),h=m.length,l=0;l<h;l++){var k;k=m[l];if(k.match(/^[\w-]+$/)){var n=Ca.exec(k.toLowerCase());if(null==n)k="";else{k=n[2];k=null==k||""==k?"n":Ba[k];n=n[1];if(null==n||""==n)n="4";else var r=Aa[n],n=r?r:isNaN(n)?"4":n.substr(0,1);k=[k,n].join("")}}else k="";k&&g.push(k)}0<g.length&&(f=g);3==d.length&&(d=d[2],g=[],d=d?d.split(","):
g,0<d.length&&(d=za[d[0]])&&(a.c[e]=d))}a.c[e]||(d=za[e])&&(a.c[e]=d);for(d=0;d<f.length;d+=1)a.a.push(new G(e,f[d]))}};function Ea(a,b){this.c=a;this.a=b}var Fa={Arimo:!0,Cousine:!0,Tinos:!0};Ea.prototype.load=function(a){var b=new B,c=this.c,d=new ta(this.a.api,this.a.text),e=this.a.families;va(d,e);var f=new ya(e);Da(f);z(c,wa(d),C(b));E(b,function(){a(f.a,f.c,Fa)})};function Ga(a,b){this.c=a;this.a=b}Ga.prototype.load=function(a){var b=this.a.id,c=this.c.o;b?A(this.c,(this.a.api||"https://use.typekit.net")+"/"+b+".js",function(b){if(b)a([]);else if(c.Typekit&&c.Typekit.config&&c.Typekit.config.fn){b=c.Typekit.config.fn;for(var e=[],f=0;f<b.length;f+=2)for(var g=b[f],m=b[f+1],h=0;h<m.length;h++)e.push(new G(g,m[h]));try{c.Typekit.load({events:!1,classes:!1,async:!0})}catch(l){}a(e)}},2E3):a([])};function Ha(a,b){this.c=a;this.f=b;this.a=[]}Ha.prototype.load=function(a){var b=this.f.id,c=this.c.o,d=this;b?(c.__webfontfontdeckmodule__||(c.__webfontfontdeckmodule__={}),c.__webfontfontdeckmodule__[b]=function(b,c){for(var g=0,m=c.fonts.length;g<m;++g){var h=c.fonts[g];d.a.push(new G(h.name,ga("font-weight:"+h.weight+";font-style:"+h.style)))}a(d.a)},A(this.c,(this.f.api||"https://f.fontdeck.com/s/css/js/")+ea(this.c)+"/"+b+".js",function(b){b&&a([])})):a([])};var Y=new oa(window);Y.a.c.custom=function(a,b){return new sa(b,a)};Y.a.c.fontdeck=function(a,b){return new Ha(b,a)};Y.a.c.monotype=function(a,b){return new ra(b,a)};Y.a.c.typekit=function(a,b){return new Ga(b,a)};Y.a.c.google=function(a,b){return new Ea(b,a)};var Z={load:p(Y.load,Y)};"function"===typeof define&&define.amd?define(function(){return Z}):"undefined"!==typeof module&&module.exports?module.exports=Z:(window.WebFont=Z,window.WebFontConfig&&Y.load(window.WebFontConfig));}());

},{}],17:[function(require,module,exports){
const { getRectangle } = require("../../services/Templates");
const WebFont = require('webfontloader');

const EMU = 1 / 12700;
const PX = 0.75;

function scoreShapeElements(shapeElements, pageSize) {
    let statisticsList = [];

    for (let pageElement of shapeElements) {
        if (pageElement.mapped) {
            const statistics = calculateStatistics(pageElement);
            //console.log(statistics);
            statisticsList.push(statistics);    
        }
    }

    return {
        readability: calculateTextReadabilitySimple(statisticsList),
        engagement: calculateTextEngagement(statisticsList),
        grammatical: calculateTextGrammatical(statisticsList),
        semantic: calculateTextSemantic(statisticsList),
        importantWords: calculateTextImportantWords(statisticsList),
        similarity: calculateTextSimilarity(statisticsList),
    };
}

function calculateTextReadabilitySimple(statisticsList) {
    let totalScore = 0;
    let totalLength = 0;
    for (let statistics of statisticsList) {
        let score = single_calculateTextReadabilitySimple(statistics);
        totalScore += score * statistics.totalLength;
        totalLength += statistics.totalLength;
    }
    if (totalLength > 0)
        totalScore /= totalLength;
    return Math.round(totalScore * 10000) / 100;
}

function calculateTextEngagement(statisticsList) {
    let totalScore = 0;
    for (let statistics of statisticsList) {
        let score = single_calculateTextEngagement(statistics);
        totalScore += score;
    }
    if (statisticsList.length > 0)
        totalScore /= statisticsList.length;
    return Math.round(totalScore * 10000) / 100;
}

function calculateTextGrammatical(statisticsList) {
    let totalScore = 1;
    for (let statistics of statisticsList) {
        let score = 1;
        for (let single of statistics.scores) {
            score *= single.grammatical;
        }
        totalScore *= score;
    }
    return Math.round(totalScore * 10000) / 100;
}

function calculateTextSemantic(statisticsList) {
    let totalScore = 1;
    for (let statistics of statisticsList) {
        let score = 1;
        for (let single of statistics.scores) {
            score *= single.semantic;
        }
        totalScore *= score;
    }
    return Math.round(totalScore * 10000) / 100;
}

function calculateTextImportantWords(statisticsList) {
    let totalScore = 1;
    for (let statistics of statisticsList) {
        let score = 1;
        for (let single of statistics.scores) {
            score *= single.importantWords;
        }
        totalScore *= score;
    }
    return Math.round(totalScore * 10000) / 100;
}

function calculateTextSimilarity(statisticsList) {
    let totalDiff = 0;
    let totalArea = 0;
    for (let statistics of statisticsList) {
        let result = getAreaDiff(statistics);
        totalDiff += result.areaDiff;
        totalArea += result.originalArea;
        //console.log('Top: ', statistics, result.originalArea, result.areaDiff);
    }
    let totalScore = 0;
    if (totalArea > 0) {
        totalScore = (1 - totalDiff / totalArea);
    }

    return Math.round(totalScore * 10000) / 100;
}

function consumeRGBColor(rgbColor) {
    let ret = {
        red: 0,
        green: 0,
        blue: 0,
    };
    if (rgbColor.hasOwnProperty('red'))
        ret.red = rgbColor.red;
    if (rgbColor.hasOwnProperty('green'))
        ret.green = rgbColor.green;
    if (rgbColor.hasOwnProperty('blue'))
        ret.blue = rgbColor.blue;
    return ret;
}

function consumeWeightedFontFamily(weightedFontFamily) {
    if (typeof weightedFontFamily === 'object') {
        return weightedFontFamily;
    }
    return null;
}

function consumeOptionalColor(optionalColor) {
    if (typeof optionalColor === 'object') {
        if (optionalColor.hasOwnProperty('opaqueColor')) {
            if (optionalColor.opaqueColor.hasOwnProperty('rgbColor')) {
                let rgbColor = consumeRGBColor(optionalColor.opaqueColor.rgbColor);
                return 'rgb(' + rgbColor.red + ', ' + rgbColor.green + ', ' + rgbColor.blue + ')';
            }
            else if (optionalColor.opaqueColor.hasOwnProperty('themeColor')) {
                if (optionalColor.opaqueColor.themeColor.startsWith('DARK'))
                    return 'black';
                else
                    return 'gray';
            }
        }
    }
    return null;
}

function consumeFontSize(fontSize) {
    if (typeof fontSize === 'object') {
        if (fontSize.hasOwnProperty('unit')) {
            if (fontSize.hasOwnProperty('magnitude')) {
                if (fontSize.unit === 'PT') {
                    return fontSize.magnitude;
                }
                else if (fontSize.unit === 'EMU') {
                    return fontSize.magnitude * EMU;
                }
                else {
                    return null;
                }
            }
        }
    }
    return null;
}

function createTextNode(text) {
    return document.createTextNode(text);
}

function boxStyleToCSS(boxStyle) {
    return (
        " display: flex;"
        + " flex-direction: " + "column;"
        + " justify-content: " + boxStyle.alignItems + ";"
        + " height: " + boxStyle.height.toString() + "pt;"
        + " width: " + boxStyle.width.toString() + "pt;"
        + " padding-left: " + "7.2pt;"
        + " padding-right: " + "7.2pt;"
        + " padding-top: " + "7.2pt;"
        + " padding-bottom: " + "7.2pt;"
        + " overflow: visible;"
        + " border: solid black 1pt; "
    );
}

function paragraphStyleToCSS(paragraphStyle, maxWidth) {
    let mainStyle = ("display: inline;"
        + " white-space: break-spaces;"
        + " line-height: " + paragraphStyle.lineHeight.toString() + "%;"
        + " text-align: " + paragraphStyle.textAlign + ";"
        + " text-indent: " + paragraphStyle.textIndent.toString() + "pt;"
        + " padding-left: " + paragraphStyle.paddingLeft.toString() + "pt;"
        + " padding-right: " + paragraphStyle.paddingRight.toString() + "pt;"
        + " padding-top: " + paragraphStyle.paddingTop.toString() + "pt;"
        + " padding-bottom: " + paragraphStyle.paddingBottom.toString() + "pt;"
    );

    if (maxWidth === null) {
        return mainStyle;
    }
    return (
        mainStyle
        + " max-width: " + maxWidth.toString() + "pt;"
        + " overflow-wrap: break-word;"
    );
}

function fontStyleToCSS(fontStyle) {
    return (" background-color: " + fontStyle.backgroundColor + ";"
        + " color: " + fontStyle.color + ";"
        + " font-size: " + fontStyle.fontSize.toString() + "pt;"
        + " font-family: " + fontStyle.fontFamily + ";"
        + " font-weight: " + fontStyle.fontWeight.toString() + ";"
        + " font-style: " + fontStyle.fontStyle + ";"
        + " text-decoration: " + fontStyle.textDecoration + ";"
        //+ " baseline-shift: " + fontStyle.baselineShift + ";"
        + " font-variant: " + fontStyle.fontVariant + ";"
        + " letter-spacing: " + fontStyle.letterSpacing + ";"
        + " font-kerning: " + fontStyle.fontKerning + ";"
    );
}

function getParagraphStyle(paragraphStyle, bulletStyle) {
    if (typeof paragraphStyle !== 'object') {
        paragraphStyle = {};
    }
    if (typeof bulletStyle !== 'object') {
        bulletStyle = {};
    }
    if (paragraphStyle.hasOwnProperty('direction') 
        && paragraphStyle.direction !== 'LEFT_TO_RIGHT'
    ) {
            throw Error("text is not left to right");
    }

    let paddingLeft = 0;
    if (consumeFontSize(paragraphStyle.indentStart)) {
        let magnitude = consumeFontSize(paragraphStyle.indentStart);
        paddingLeft += magnitude;
    }

    let paddingRight = 0;
    if (consumeFontSize(paragraphStyle.indentEnd)) {
        let magnitude = consumeFontSize(paragraphStyle.indentEnd);
        paddingRight += magnitude;
    }

    let paddingBottom = 0;
    if (consumeFontSize(paragraphStyle.spaceBelow)) {
        let magnitude = consumeFontSize(paragraphStyle.spaceBelow);
        paddingBottom += magnitude;
    }

    let paddingTop = 0;
    if (consumeFontSize(paragraphStyle.spaceAbove)) {
        let magnitude = consumeFontSize(paragraphStyle.spaceAbove);
        paddingTop += magnitude;
    }

    let collapseLists = false;

    if (paragraphStyle.hasOwnProperty('spacingMode')
        && paragraphStyle.spacingMode === 'COLLAPSE_LISTS'
    ) {
        collapseLists = true;
    }

    let textAlign = 'left';
    if (paragraphStyle.hasOwnProperty('alignment')) {
        if (paragraphStyle.alignment === 'END') {
            textAlign = 'right';    
        }
        if (paragraphStyle.alignment === 'CENTER') {
            textAlign = 'center';    
        }
        if (paragraphStyle.alignment === 'JUSTIFIED') {
            textAlign = 'justified';    
        }
    }

    let textIndent = 0;
    if (consumeFontSize(paragraphStyle.indentFirstLine)) {
        let magnitude = consumeFontSize(paragraphStyle.indentFirstLine);
        textIndent = (magnitude - paddingLeft);
    }

    let lineHeight = 'normal';
    if (paragraphStyle.hasOwnProperty('lineSpacing')) {
        lineHeight = paragraphStyle.lineSpacing;
    }

    let glyph = '';
    let isListElement = false;
    if (bulletStyle.hasOwnProperty('listId')) {
        isListElement = true;
        if (bulletStyle.hasOwnProperty('glyph')) {
            glyph = bulletStyle.glyph;
        }    
        textIndent = 0;
    }

    return {
        paddingLeft,
        paddingRight,
        paddingBottom,
        paddingTop,
        textAlign,
        textIndent,
        lineHeight,
        collapseLists,
        glyph,
        isListElement,
    };
}

function getFontStyle(textStyle) {
    let weightedFontFamily = consumeWeightedFontFamily(textStyle.weightedFontFamily);

    let backgroundColor = 'transparent';
    let color = 'transparent';
    let fontSize = 16;
    let fontFamily = 'Arial';
    let fontWeight = 400;

    if (consumeOptionalColor(textStyle.backgroundColor) !== null) {
        backgroundColor = consumeOptionalColor(textStyle.backgroundColor);
    }
    if (consumeOptionalColor(textStyle.foregroundColor) !== null) {
        color = consumeOptionalColor(textStyle.foregroundColor);
    }
    else {
        throw Error('no color');
    }
    if (consumeFontSize(textStyle.fontSize) !== null) {
        let magnitude = consumeFontSize(textStyle.fontSize);
        fontSize = magnitude;
    }
    else {
        throw Error('no font size');
    }
    if (weightedFontFamily !== null && weightedFontFamily.hasOwnProperty('fontFamily')) {
        fontFamily = weightedFontFamily.fontFamily;
    }
    else {
        throw Error('no fontFamily');
    }
    if (weightedFontFamily !== null && weightedFontFamily.hasOwnProperty('weight')) {
        fontWeight = weightedFontFamily.weight;
    }

    let fontStyle = 'normal';
    if (textStyle.italic) {
        fontStyle = 'italic';
    }
    
    let textDecoration = 'none';
    if (textStyle.strikethrough) {
        textDecoration = 'line-through';
    }
    if (textStyle.underline) {
        textDecoration = 'underline';
        if (textStyle.strikethrough) {
            textDecoration += ' line-through';
        }
    }

    let baselineShift = 'baseline';
    if (textStyle.baselineOffset === 'SUPERSCRIPT') {
        baselineShift = 'super';
    }
    if (textStyle.bselineOffset === 'SUBSCRIPT') {
        baselineShift = 'sub';
    }

    let fontVariant = 'normal';
    if (textStyle.smallCaps) {
        fontVariant = 'small-caps';
    }

    let letterSpacing = 'normal';
    let fontKerning = 'auto';

    return {
        backgroundColor,
        color,
        fontSize,
        fontFamily,
        fontWeight,
        fontStyle,
        textDecoration,
        baselineShift,
        fontVariant,
        letterSpacing,
        fontKerning,
    };
}

function getBoxStyle(pageElement) {
    let rectangle = getRectangle(pageElement.size, pageElement.transform);

    let width = (rectangle.finishX - rectangle.startX) * EMU;
    let height = (rectangle.finishY - rectangle.startY) * EMU;
    
    let alignItems = 'flex-start';
    if (pageElement.shape.hasOwnProperty('shapeProperties')
        && pageElement.shape.shapeProperties.hasOwnProperty('contentAlignment')
    ) {
        let contentAlignment = pageElement.shape.shapeProperties.contentAlignment;
        if (contentAlignment === 'MIDDLE') {
            alignItems = 'center'
        }
        if (contentAlignment === 'BOTTOM') {
            alignItems = 'flex-end';
        }
    }

    return {
        alignItems,
        width,
        height,
        position: {
            x: rectangle.startX,
            y: rectangle.startY,
        },
    };
}

function getParagraphTexts(pageElement) {
    if (!pageElement.hasOwnProperty('shape')
        || !pageElement.shape.hasOwnProperty('text')
        || !Array.isArray(pageElement.shape.text.textElements)
    ) {
        return [];
    }
    let textElements = pageElement.shape.text.textElements;
    
    let paragraphContents = [];
    let text = '';
    for (let i = 0; i < textElements.length; i++) {
        const textElement = textElements[i];
        if (textElement.hasOwnProperty('paragraphMarker') && text.length > 0) {
            paragraphContents.push(text);
            text = '';
        }
        if (textElement.hasOwnProperty('textRun') && textElement.textRun.hasOwnProperty('content')) {
            text += textElement.textRun.content;
        }
        if (textElement.hasOwnProperty('autoText') && textElement.autoText.hasOwnProperty('content')) {
            text += textElement.autoText.content;
        }
    }
    if (text.length > 0) {
        paragraphContents.push(text);
    }
    return paragraphContents;
}

function getDominantTextStyle(textStyle, textElements, start, L, R) {
    let cntStyle = {};
    let dominantStyle = '{}';
    for (let i = start + 1; i < textElements.length; i++) {
        const textElement = textElements[i];
        let l = 0;
        let r = 0;
        if (textElement.hasOwnProperty('startIndex')) {
            l = textElement.startIndex;
        }
        if (textElement.hasOwnProperty('endIndex')) {
            r = textElement.endIndex;
        }

        if (l < L) {
            throw Error('Text Element crosses paragraph');
        }
        if (r > R) {
            break;
        }
        if (textElement.hasOwnProperty('textRun') && textElement.textRun.hasOwnProperty('style')) {
            let styleStr = JSON.stringify({ ...textStyle, ...textElement.textRun.style });
            if (!cntStyle.hasOwnProperty(styleStr)) {
                cntStyle[styleStr] = 0;
            }
            if (textElement.textRun.hasOwnProperty('content'))
                cntStyle[styleStr] += textElement.textRun.content.length;    
            dominantStyle = styleStr;
        }
        else if (textElement.hasOwnProperty('autoText') && textElement.autoText.hasOwnProperty('style')) {
            let styleStr = JSON.stringify({ ...textStyle, ...textElement.autoText.style });
            if (!cntStyle.hasOwnProperty(styleStr)) {
                cntStyle[styleStr] = 0;
            }
            cntStyle[styleStr] += 1;
            dominantStyle = styleStr;
        }
    }
    for (let style in cntStyle) {
        if (cntStyle[dominantStyle] < cntStyle[style]) {
            dominantStyle = style;
        }
    }
    return JSON.parse(dominantStyle);
}

function getParagraphStyles(pageElement) {
    if (!pageElement.hasOwnProperty('shape')
        || !pageElement.shape.hasOwnProperty('text')
        || !Array.isArray(pageElement.shape.text.textElements)
    ) {
        return [];
    }
    const textElements = pageElement.shape.text.textElements;
    
    let paragraphStyles = [];
    for (let i = 0; i < textElements.length; i++) {
        const textElement = textElements[i];
        if (textElement.hasOwnProperty('paragraphMarker')) {
            let paragraph = {};

            let bullet = {};
            let style = {};

            let listId = null;
            let nestingLevel = 0;
            if (textElement.paragraphMarker.hasOwnProperty('bullet')) {
                bullet = { ...textElement.paragraphMarker.bullet };
                if (textElement.paragraphMarker.bullet.hasOwnProperty('listId')) {
                    listId = textElement.paragraphMarker.bullet.listId;
                }
                if (textElement.paragraphMarker.bullet.hasOwnProperty('nestingLevel')) {
                    nestingLevel = textElement.paragraphMarker.bullet.nestingLevel;
                }
            }
            if (textElement.paragraphMarker.hasOwnProperty('style')) {
                style = { ...textElement.paragraphMarker.style };
            }
            paragraph.style = getParagraphStyle(style, bullet);
            
            let l = 0;
            let r = 0;
            if (textElement.hasOwnProperty('startIndex'))
                l = textElement.startIndex;
            if (textElement.hasOwnProperty('endIndex')) {
                r = textElement.endIndex;
            }
            let textStyle = {};
            if (listId !== null) {
                textStyle = pageElement.shape.text.lists[listId].nestingLevel[nestingLevel].bulletStyle;
                if (typeof textStyle !== 'object') {
                    textStyle = {};
                }
            }
            
            textStyle = getDominantTextStyle(textStyle, textElements, i, l, r);
            paragraph.fontStyle = getFontStyle(textStyle);
            paragraphStyles.push(paragraph);
        }
    }

    for (let i = 1; i < paragraphStyles.length; i++) {
        if (paragraphStyles[i].style.isListElement && paragraphStyles[i - 1].style.isListElement) {
            if (paragraphStyles[i].style.collapseLists)
                paragraphStyles[i].style.paddingTop = 0;
            if (paragraphStyles[i - 1].style.collapseLists)
                paragraphStyles[i - 1].style.paddingBottom = 0;
        }
    }

    return paragraphStyles;
}

function shapeToDOM(paragraphStyles, boxStyle) {
    for (let paragraph of paragraphStyles) {
        WebFont.load({
            google: {
                families: [paragraph.fontStyle.fontFamily],
            }
        });
    }
    
    let outerDiv = document.createElement('div');
    outerDiv.setAttribute('style', boxStyleToCSS(boxStyle));
    let innerDivs = [];

    for (let paragraph of paragraphStyles) {
        let maxWidth = boxStyle.width + paragraph.style.paddingLeft + paragraph.style.paddingRight - 14.4;
        let innerDiv = document.createElement('div');
        innerDiv.setAttribute('style', 
            paragraphStyleToCSS(paragraph.style, maxWidth) 
            + fontStyleToCSS(paragraph.fontStyle)
        );
        innerDivs.push(innerDiv);
    }
    return {
        outerDiv,
        innerDivs,
    };
}

function isInWord(ch) {
    let result = ch.match(/\w/g);
    if (!Array.isArray(result)) {
        return false;
    }
    if (result.length === 0) {
        return false;
    }
    return true;
}

function isWhiteSpace(ch) {
    let result = ch.match(/\s/g);
    if (!Array.isArray(result)) {
        return false;
    }
    if (result.length === 0) {
        return false;
    }
    return true;
}

function getAbsLineHeight(paragraphStyle, fontStyle) {
    return (fontStyle.fontSize * (paragraphStyle.lineHeight / 100));
}

function getAbsCharWidth(paragraphStyle, fontStyle) {
    let div = document.createElement('div');
    div.setAttribute('style', 
        paragraphStyleToCSS(paragraphStyle, null) 
        + fontStyleToCSS(fontStyle)
    );
    document.body.appendChild(div);
    let alphabet = "abcdefghijklmnopqrstuvwxyz";
    let text = alphabet + alphabet.toUpperCase() + " ";
    div.appendChild(createTextNode(text));
    let ret = getContentWidth(div) / text.length;
    document.body.removeChild(div);
    return ret;
}

function getContentHeight(element) {
    return element.getBoundingClientRect().height * PX;
}

function getContentWidth(element) {
    return element.getBoundingClientRect().width * PX;
}

function renderTexts(texts, paragraphStyles, boxStyle) {
    let element = shapeToDOM(paragraphStyles, boxStyle);
    document.body.appendChild(element.outerDiv);

    let spaceOccupation = 0;
    let totalLength = 0;
    let paragraphs = [];
    let n = Math.min(texts.length, paragraphStyles.length);
    for (let i = 0; i < n; i++) {
        const fontStyle = paragraphStyles[i].fontStyle;
        const paragraphStyle = paragraphStyles[i].style;
        const text = texts[i];
        const innerDiv = element.innerDivs[i];

        element.outerDiv.appendChild(innerDiv);

        let lineHeight = getAbsLineHeight(paragraphStyle, fontStyle);
        let numWordsPerLine = [];
        let numCharsPerLine = [];
        let numWords = 0;
        let numChars = 0;
        
        let inWord = false;
        let startedWithWhiteSpace = false;
        innerDiv.innerHTML = '';
        innerDiv.appendChild(createTextNode(text.charAt(0)));
        inWord = isInWord(text.charAt(0));
        numChars++;
        startedWithWhiteSpace = isWhiteSpace(text.charAt(0));

        for (let i = 1; i < text.length; i++) {
            let ch = text.charAt(i);
            let prevHeight = getContentHeight(innerDiv);
            innerDiv.appendChild(createTextNode(ch));
            let curHeight = getContentHeight(innerDiv);
            if ((curHeight - prevHeight) >= lineHeight / 2) {
                //start of the newline
                
                let toNextLine = 0;

                if (!startedWithWhiteSpace && inWord && numWords === 0) {
                    numWords += inWord;
                    inWord = false;
                }
                else if (inWord) {
                    let j = i - 1;
                    while (j >= 0 && isInWord(text.charAt(j))) {
                        j--;
                    }
                    toNextLine = (i - j - 1);
                }
                
                numWordsPerLine.push(numWords);
                numCharsPerLine.push(numChars - toNextLine);

                numWords = 0;
                numChars = toNextLine;
                if (toNextLine === 0) {
                    startedWithWhiteSpace = isWhiteSpace(ch);
                }
                else {
                    startedWithWhiteSpace = false;
                }
            }
            else {
                if (curHeight !== prevHeight) {
                    console.log('ERROR', curHeight, prevHeight, lineHeight);
                }
            }
            if (isInWord(ch)) {
                inWord = true;
            }
            else {
                numWords += inWord;
                inWord = false;
            }
            numChars++;
        }

        numWordsPerLine.push(numWords + inWord);
        numCharsPerLine.push(numChars);
        
        spaceOccupation += (getContentHeight(innerDiv) * getContentWidth(innerDiv));
        totalLength += text.length;

        paragraphs.push({
            fontStyle: fontStyle,
            paragraphStyle: paragraphStyle,
            contentText: text,
            numWordsPerLine: numWordsPerLine,
            numCharsPerLine: numCharsPerLine,
            numLines: numWordsPerLine.length,
            textLength: text.length,    
        });
    }

    spaceOccupation /= (getContentHeight(element.outerDiv) * getContentWidth(element.outerDiv));

    //document.body.removeChild(element.outerDiv);
    return {
        paragraphs: paragraphs,
        spaceOccupation: spaceOccupation,
        totalLength: totalLength,
    }
}

function calculateStatistics(pageElement) {
    if (!pageElement.mapped) {
        return {
            boxStyle: null,
            paragraphs: [],
            spaceOccupation: 0,
            totalLength: 0,
            originalStatistics: {
                paragraphs: [],
                spaceOccupation: 0,
                totalLength: 0,
            }
        }
    }

    let paragraphStyles = getParagraphStyles(pageElement);
    let boxStyle = getBoxStyle(pageElement);

    let originalTexts = getParagraphTexts(pageElement);
    let texts = pageElement.mappedContents.map((val, idx) => val.text);
    let scores = pageElement.mappedContents.map((val, idx) => val.score);
    
    let statistics = renderTexts(texts, paragraphStyles, boxStyle);
    let originalStatistics = renderTexts(originalTexts, paragraphStyles, boxStyle);

    return {
        ...statistics,
        boxStyle: boxStyle,
        scores: scores,
        originalStatistics: originalStatistics,
    };
}

function increasingFunc(mx, x) {
    if (x > mx) {
        return 1.0;
    }
    return (x - (x * x) / (2 * mx)) / (mx / 2);
}

function __normal(mean, std, x) {
    return 1 / (std * Math.sqrt(2 * Math.PI)) * Math.exp((-1 / 2) * ((x - mean) / std) * ((x - mean) / std));
}

function normDistributionAround(mean, std, x) {
    const maxValue = __normal(mean, std, mean);
    return __normal(mean, std, x) / maxValue;
}



function single_calculateTextReadabilitySimple(statistics) {
    const FONT_SIZE = 20;
    const FONT_SIZE_std = 15;

    const TEXT_LENGTH_std = 10;
    
    const NUM_LINES = 6;
    const NUM_LINES_std = 2;

    const LINE_HEIGHT = 1.8;
    const SPACE_OCCUPATION = 0.65;

    let result = 0;

    for (let paragraph of statistics.paragraphs) {
        const TEXT_LENGTH = paragraph.textLength;

        let weightFontSize = 1/5;
        let weightLineHeight = 1/5;
        let weightNumLines = 1/5;
        let weightShape = 1/5;
        let weightTextLength = 1/5;

        let valFontSize = normDistributionAround(
            FONT_SIZE,
            Math.min(FONT_SIZE / 2, FONT_SIZE_std),
            paragraph.fontStyle.fontSize
        ) * weightFontSize;
        let valTextLength = normDistributionAround(
            TEXT_LENGTH,
            Math.min(TEXT_LENGTH / 2, TEXT_LENGTH_std),
            paragraph.textLength,
        ) * weightTextLength;
        
        let valNumLines = normDistributionAround(
            NUM_LINES,
            Math.min(NUM_LINES_std, NUM_LINES / 2),
            paragraph.numLines,
        ) * weightNumLines;

        let valLineHeight = increasingFunc(
            LINE_HEIGHT,
            paragraph.paragraphStyle.lineHeight,
        ) * weightLineHeight;

        let valShape = 0.0;

        let avgCharDiff = 0.0;
        let maxNumChar = 0.0;
        let prev = 0.0;
        for (let numChar of paragraph.numCharsPerLine) {
            maxNumChar = Math.max(maxNumChar, numChar);
            if (prev !== 0.0) {
                avgCharDiff += Math.abs(numChar - prev);
            }
            prev = numChar;
        }
        if (paragraph.numCharsPerLine.length > 1) {
            avgCharDiff /= (paragraph.numCharsPerLine.length - 1);
            valShape = (maxNumChar - avgCharDiff) / maxNumChar;
        }
        else {
            valShape = 1.0;
        }
        valShape = valShape * weightShape;

        let valSum = (valFontSize + valTextLength + valNumLines + valLineHeight + valShape);

        result += valSum * (paragraph.textLength / statistics.totalLength);
    }
    

    let weigthSpaceOccupation = 1/6;

    let valSpaceOccupation = increasingFunc(
        SPACE_OCCUPATION,
        statistics.spaceOccupation,
    ) * weigthSpaceOccupation;

    return (result * (1 - weigthSpaceOccupation)) + valSpaceOccupation;
}

function single_calculateTextEngagement(statistics) {
    let cntSentences = 0;
    let cntQuestions = 0;
    for (let paragraph of statistics.paragraphs) {
        let sentences = paragraph.contentText.match(/[^?!.][?!.]/g);
        let questions = paragraph.contentText.match(/[^?!.][?]/g);

        if (Array.isArray(sentences))
            cntSentences += sentences.length;
        if (Array.isArray(questions))
            cntQuestions += questions.length;
    }

    if (cntSentences === 0) {
        cntSentences = 1;
    }

    return cntQuestions / cntSentences;
}

function getAreaDiff(statistics) {
    let k = Math.max(statistics.paragraphs.length, statistics.originalStatistics.paragraphs.length);

    let areaDiff = 0;
    let originalArea = 0;

    for (let j = 0; j < k; j++) {
        let addToOriginalArea = -1;

        let curParagraph = null;
        let oriParagraph = null;
        if (j < statistics.paragraphs.length) {
            curParagraph = { ...statistics.paragraphs[j] };
        }
        if (j < statistics.originalStatistics.paragraphs.length) {
            oriParagraph = { ...statistics.originalStatistics.paragraphs[j] };
            addToOriginalArea = 1;
        }

        if (oriParagraph === null) {
            oriParagraph = {numCharsPerLine: []};
        }

        if (curParagraph === null) {
            addToOriginalArea = 0;
            curParagraph = { ...oriParagraph };
            oriParagraph = {numCharsPerLine: []};
        }
        let lineHeight = getAbsLineHeight(curParagraph.paragraphStyle, curParagraph.fontStyle);
        let charWidth = getAbsCharWidth(curParagraph.paragraphStyle, curParagraph.fontStyle);
        let n = Math.max(curParagraph.numCharsPerLine.length, oriParagraph.numCharsPerLine.length);
        let curAreaDiff = 0;
        for (let i = 0; i < n; i++) {
            let cur = 0;
            let original = 0;
            if (i < curParagraph.numCharsPerLine.length) {
                cur = curParagraph.numCharsPerLine[i] * lineHeight * charWidth;
            }
            if (i < oriParagraph.numCharsPerLine.length) {
                original = oriParagraph.numCharsPerLine[i] * lineHeight * charWidth;
            }

            if (addToOriginalArea === 1) {
                originalArea += original;
            }
            if (addToOriginalArea === 0) {
                originalArea += cur;
            }

            curAreaDiff += Math.abs(original - cur);
        }
        //console.log('Bottom', curParagraph, oriParagraph, curAreaDiff);
        areaDiff += curAreaDiff;
    }
    return {
        areaDiff,
        originalArea
    };
}
module.exports = {
    scoreShapeElements,
};
},{"./Templates":18,"webfontloader":16}],18:[function(require,module,exports){
const { v4 : random} = require('uuid');

const INCH = 914400;

const PT = 12700;

const EMU = 1;

const SMALL_ELEMENT_AREA_PERCENTAGE = 3;

const DEFAULT_SIZE = {
    width: {
        magnitude: 0,
        unit: 'EMU',
    },
    height: {
        magnitude: 0,
        unit: 'EMU',
    },
};

const DEFAULT_TRANSFORM = {
    scaleX: 1,
    scaleY: 1,
    shearX: 0,
    shearY: 0,
    translateX: 0,
    translateY: 0,
    unit: 'EMU',
}

function correctDimension(dimension) {
    if (dimension === undefined) {
        return false;
    }
    if (!dimension.hasOwnProperty('magnitude')) {
        return false;
    }
    if (!dimension.hasOwnProperty('unit')) {
        return false;
    }
    return true;
}

function consumeDimension(dimension) {
    if (dimension === undefined) {
        throw Error('no dimension');
    }
    if (!dimension.hasOwnProperty('magnitude')) {
        return 0;
    }
    let result = dimension.magnitude;
    if (dimension.unit === 'PT') {
        result *= PT;
    }
    else if (dimension.unit === 'EMU') {
        result *= EMU;
    }
    else {
        throw Error('unit is not supported: ' + dimension.unit);
    }
    return result;
}

function consumeSize(size) {
    if (size === undefined) {
        throw Error('no field size');
    }

    return {
        width: consumeDimension(size.width),
        height: consumeDimension(size.height),
    }
}

function consumeTransform(transform) {
    if (transform === undefined) {
        transform = { ...DEFAULT_TRANSFORM };
    }

    if (!transform.hasOwnProperty('scaleX')) {
        transform.scaleX = 0;
    }

    if (!transform.hasOwnProperty('scaleY')) {
        transform.scaleY = 0;
    }

    if (!transform.hasOwnProperty('shearX')) {
        transform.shearX = 0;
    }

    if (!transform.hasOwnProperty('shearY')) {
        transform.shearY = 0;
    }

    if (!transform.hasOwnProperty('translateX')) {
        transform.translateX = 0;
    }

    if (!transform.hasOwnProperty('translateY')) {
        transform.translateY = 0;
    }

    if (transform.unit === 'PT') {
        transform.translateX *= PT;
        transform.translateY *= PT;
    }
    else if (transform.unit === 'EMU') {
        transform.translateX *= EMU;
        transform.translateY *= EMU;
    }
    else {
        throw Error('cannot support unit: ' + transform.unit);
    }
    return transform;
}

function multiplyTransforms(t1, t2) {
    t1 = consumeTransform(t1);
    t2 = consumeTransform(t2);
    let t = { ...t1 };
    t.scaleX = t1.scaleX * t2.scaleX + t1.shearX * t2.shearY;
    t.shearX = t1.scaleX * t2.shearX + t1.shearX * t2.scaleY;
    t.translateX = t1.scaleX * t2.translateX + t1.shearX * t2.translateY + t1.translateX;
    
    t.shearY = t1.shearY * t2.scaleX + t1.scaleY * t2.shearY;
    t.scaleY = t1.shearY * t2.shearX + t1.scaleY * t2.scaleY;
    t.translateY = t1.shearY * t2.translateX + t1.scaleY * t2.translateY + t1.translateY;

    return t;
}

function getPageElementType(element) {
    if (element.hasOwnProperty('shape')) {
        return 'shape';
    }
    if (element.hasOwnProperty('image')) {
        return 'image';
    }
    if (element.hasOwnProperty('line')) {
        return 'line';
    }
    if (element.hasOwnProperty('elementGroup')) {
        return 'elementGroup';
    }
    console.log('cannot find such type', element);
    return 'unspecified';
}

function toLines(layout) {
    return [];
    // let lines = [];

    // let horPts = [];
    // let verPts = [];
    
    // for (let e of layout.pageElements) {
    //     horPts.push({
    //         pt: e.startX,
    //         type: 0,
    //     });
    //     horPts.push({
    //         pt: e.finishX,
    //         type: 1,
    //     });
    //     verPts.push({
    //         pt: e.startY,
    //         type: 0,
    //     });
    //     verPts.push({
    //         pt: e.finishY,
    //         type: 1,
    //     });
    // }

    // const comparator = (p1, p2) => {
    //     if (p1.pt < p2.pt) {
    //         return -1;
    //     }
    //     if (p1.pt > p2.pt) {
    //         return 1;
    //     }
    //     if (p1.type > p2.type) {
    //         return -1;
    //     }
    //     if (p1.type < p2.type) {
    //         return 1;
    //     }
    //     return 0;
    // };

    // horPts.sort(comparator);
    // verPts.sort(comparator);

    // let open = 0;
    // for (let e of horPts) {
    //     // if (e.type === 1) {
    //     //     open -= 1;
    //     // }
    //     // else {
    //     //     open += 1;
    //     // }
    //     // if (open === 0) {
    //     //     continue;
    //     // }
    //     let color = {
    //         rgbColor: {
    //             red: 1,
    //             green: 0,
    //             blue: 0,
    //         },
    //     };

    //     if (e.type === 1) {
    //         color = {
    //             rgbColor: {
    //                 red: 0,
    //                 green: 0,
    //                 blue: 1,
    //             },
    //         }
    //     }

    //     lines.push({
    //         size: {
    //             height: {
    //                 magnitude: 7 * INCH,
    //                 unit: 'EMU',
    //             },
    //             width: {
    //                 magnitude: 0,
    //                 unit: 'EMU',
    //             },
    //         },
    //         transform: {
    //             scaleX: 1,
    //             scaleY: 1,
    //             shearX: 0,
    //             shearY: 0,
    //             translateX: e.pt,
    //             translateY: 0,
    //             unit: 'EMU',
    //         },
    //         line: {
    //             lineProperties: {
    //                 lineFill: {
    //                     solidFill: {
    //                         color: color,
    //                         alpha: 1,
    //                     }
    //                 },
    //                 weight: {
    //                     magnitude: PT,
    //                     unit: 'EMU'
    //                 },
    //                 dashStyle: 'SOLID',
    //             },
    //             lineType: 'STRAIGHT_LINE',
    //             lineCategory: 'STRAIGHT'
    //         },
    //         additional: {
    //             originalType: 'line',
    //         }
    //     });
    // }

    // open = 0;
    // for (let e of verPts) {
    //     // if (e.type === 1) {
    //     //     open -= 1;
    //     // }
    //     // else {
    //     //     open += 1;
    //     // }
    //     // if (open === 0) {
    //     //     continue;
    //     // }
    //     let color = {
    //         rgbColor: {
    //             red: 1,
    //             green: 0,
    //             blue: 0,
    //         },
    //     };

    //     if (e.type === 1) {
    //         color = {
    //             rgbColor: {
    //                 red: 0,
    //                 green: 0,
    //                 blue: 1,
    //             },
    //         }
    //     }

    //     lines.push({
    //         size: {
    //             height: {
    //                 magnitude: 0,
    //                 unit: 'EMU',
    //             },
    //             width: {
    //                 magnitude: 11 * INCH,
    //                 unit: 'EMU',
    //             },
    //         },
    //         transform: {
    //             scaleX: 1,
    //             scaleY: 1,
    //             shearX: 0,
    //             shearY: 0,
    //             translateX: 0,
    //             translateY: e.pt,
    //             unit: 'EMU',
    //         },
    //         line: {
    //             lineProperties: {
    //                 lineFill: {
    //                     solidFill: {
    //                         color: color,
    //                         alpha: 1,
    //                     }
    //                 },
    //                 weight: {
    //                     magnitude: PT,
    //                     unit: 'EMU'
    //                 },
    //                 dashStyle: 'SOLID',
    //             },
    //             lineType: 'STRAIGHT_LINE',
    //             lineCategory: 'STRAIGHT'
    //         },
    //         additional: {
    //             originalType: 'line',
    //         }
    //     });
    // }
    // return lines;
}

function isSmall(rectangle, pageSize) {
    let total = pageSize.width * pageSize.height;
    let width = rectangle.finishX - rectangle.startX;
    let height = rectangle.finishY - rectangle.startY;
    let area = width * height;
    if (area / total * 100 < SMALL_ELEMENT_AREA_PERCENTAGE) {
        return true;
    }
    return false;
}

function getRectangle(size, transform) {
    size = consumeSize(size);
    transform = consumeTransform(transform);
    
    let startX = transform.translateX;
    let startY = transform.translateY;

    let finishX = size.width * transform.scaleX + size.height * transform.shearX + transform.translateX;
    let finishY = size.width * transform.shearY + size.height * transform.scaleY + transform.translateY;

    if (startX > finishX) {
        [startX, finishX] = [finishX, startX]; 
    }

    if (startY > finishY) {
        [startY, finishY] = [finishY, startY]; 
    }
    return {
        startX,
        startY,
        finishX,
        finishY,
    };
}

function sanitizePageElements(pageElements) {
    let newPageElements = [];
    for (let pageElement of pageElements) {
        let type = getPageElementType(pageElement);
        if (type === 'unspecified') {
            continue;
        }
        if (type === 'elementGroup') {
            if (pageElement.elementGroup.hasOwnProperty('children') && Array.isArray(pageElement.elementGroup.children)) {
                pageElement.elementGroup.children = sanitizePageElements(pageElement.elementGroup.children);
            }
            else {
                continue;
            }
        }
        else if (type === 'image' || type === 'shape') {
            if (!pageElement.hasOwnProperty('size'))
                continue;
            if (!pageElement.size.hasOwnProperty('width') || !pageElement.size.hasOwnProperty('height')) {
                continue;
            }
            if (!correctDimension(pageElement.size.width) || !correctDimension(pageElement.size.height)) {
                continue;
            }
            if (pageElement.size.width.magnitude === 0 || pageElement.size.height.magnitude === 0) {
                continue;
            }
        }
        else {
            if (!pageElement.hasOwnProperty('size'))
                continue;
            if (!pageElement.size.hasOwnProperty('width') && !pageElement.size.hasOwnProperty('height')) {
                continue;
            }
            if (!correctDimension(pageElement.size.width) && !correctDimension(pageElement.size.height)) {
                continue;
            }
        }
        newPageElements.push(pageElement);
    }
    return newPageElements;
}

class Templates {
    constructor(title, pageSize) {
        this.pageSize = consumeSize(pageSize);
        this.title = title;
        this.__templates = [];
        this.__layouts = [];
    }  

    copyInstance(templates) {
        Object.assign(this, templates);
    }

    __getLayout(page) {
        // in EMU
        let layout = {
            pageSize: this.pageSize,
            pageElements: [],
        };
    
        if (!page.hasOwnProperty('pageElements')) {
            page.pageElements = [];
        }
    
        for (let pageElement of page.pageElements) {
            let size = undefined;
            if (pageElement.hasOwnProperty('size')) {
                size = JSON.parse(JSON.stringify(pageElement.size));
            }
            let transform = { ...pageElement.transform };

            if (pageElement.hasOwnProperty('elementGroup')) {
                let result = this.__getCoveringRectangle(pageElement.elementGroup.children);
                size = result.size;
                transform = multiplyTransforms(transform, result.transform);
            }
            
            let rectangle = getRectangle(size, transform);

            layout.pageElements.push({
                ...rectangle,
                type: getPageElementType(pageElement),
            });
        }
        return layout;
    }

    __getCoveringRectangle(pageElements) {
        let layout = this.__getLayout({pageElements});

        // do transform
        
        let rectangle = {
            sx: Number.MAX_VALUE,
            sy: Number.MAX_VALUE,
            fx: -Number.MAX_VALUE,
            fy: -Number.MAX_VALUE,
        };
        for (let e of layout.pageElements) {
            rectangle.sx = Math.min(rectangle.sx, e.startX);
            rectangle.sy = Math.min(rectangle.sy, e.startY);
            rectangle.fx = Math.max(rectangle.fx, e.finishX);
            rectangle.fy = Math.max(rectangle.fy, e.finishY);
        }

        let transform = { ...DEFAULT_TRANSFORM };
        let size = JSON.parse(JSON.stringify(DEFAULT_SIZE));
        transform.translateX = rectangle.sx;
        transform.translateY = rectangle.sy;

        size.width.magnitude = rectangle.fx - rectangle.sx;
        size.height.magnitude = rectangle.fy - rectangle.sy;
        return {
            transform,
            size,
        };
    }

    __getComplexity(page) {
        return 0;
    }

    __add(layout, pageId, originalId, page, weight, isCustom) {

        page.pageElements = page.pageElements.concat(toLines(layout));

        let informationBoxId = random();

        this.__templates.push({
            pageId,
            page,
            weight,
            originalId,
            isCustom,
            informationBoxId,
        });
        this.__layouts.push({
            layout,
        });
    }

    addCustom(pageId, originalId, page) {
        if (Array.isArray(page.pageElements)) {
            page.pageElements = sanitizePageElements(page.pageElements);
        }
        else {
            console.log('no page elements', page);
        }
        page = this.sanitizePage(page);

        if (this.__getComplexity(page) <= 0.5) {
            let layout = this.__getLayout(page);
            this.__add(layout, pageId, originalId, page, 2, true);
        }
    }

    addDefault(pageId, originalId, page) {
        if (Array.isArray(page.pageElements)) {
            page.pageElements = sanitizePageElements(page.pageElements);
        }
        else {
            console.log('no page elements', page);
        }
        let layout = this.__getLayout(page);
        this.__add(layout, pageId, originalId, page, 1, false);
    }

    getTemplates() {
        return this.__templates.slice(0);
    }

    __transformElementGroups(pageElements, method = 'extract') {
        let newPageElements = [];
        for (let pageElement of pageElements) {
            if (!pageElement.hasOwnProperty('elementGroup')) {
                newPageElements.push(pageElement);
                continue;
            }
            if (!pageElement.elementGroup.hasOwnProperty('children')) {
                continue;
            }
            let children = this.__transformElementGroups(pageElement.elementGroup.children, method);
            if (children.length === 0) {
                continue;
            }
            if (method === 'extract') {
                for (let ch of children) {
                    if (pageElement.hasOwnProperty('transform')) {
                        let transform = { ...ch.transform };
                        transform = multiplyTransforms(pageElement.transform, transform);
                        ch.transform = { ...transform };
                    }
                    if (ch.hasOwnProperty('image')) {
                        newPageElements.push(ch);
                    }
                    else if (ch.hasOwnProperty('shape') 
                        && ch.shape.hasOwnProperty('shapeType') 
                        && ch.shape.shapeType === 'TEXT_BOX'
                    ) {
                        newPageElements.push(ch);
                    }
                }
            }
            else if (method === 'merge') {
                let result = this.__getCoveringRectangle(children);

                if (pageElement.hasOwnProperty('transform')) {
                    result.transform = multiplyTransforms(pageElement.transform, result.transform);
                }

                if (result.size.height.magnitude === 0 || result.size.width.magnitude === 0) {
                    continue;
                }
                if (result.size.height.magnitude < 0 || result.size.width.magnitude < 0) {
                    console.log(result, pageElements, this.__getLayout({pageElements: children}));
                }


                let newPageElement = {
                    additional: pageElement.additional,
                    size: result.size,
                    transform: result.transform,
                    shape: {
                        shapeType: 'RECTANGLE',
                        shapeProperties: {
                            outline: {
                                outlineFill: {
                                    solidFill: {
                                        color: {
                                            rgbColor: {
                                                red: 0,
                                                green: 1,
                                                blue: 0,
                                            },
                                        },
                                        alpha: 1,
                                    }
                                },
                                weight: {
                                    magnitude: PT,
                                    unit: 'EMU',
                                },
                                dashStyle: 'DOT',
                            }
                        },
                        placeholder: {
                            type: 'OBJECT',
                        }
                    }
                }
                
                newPageElements.push(newPageElement);
            }
        }
        return newPageElements;
    }
    
    __mergeIntersectingElements(page) {

        return page;
    }
    
    __deleteSmallElements(page) {
        let layout = this.__getLayout(page);
        let n = layout.pageElements.length;
        if (n !== page.pageElements.length) {
            throw Error("issue with layout and page");
        }
        let newPageElements = [];
        for (let i = 0; i < n; i++) {
            let rectangle = layout.pageElements[i];
            let pageElement = page.pageElements[i];
            if (isSmall(rectangle, layout.pageSize)) {
                continue;
            }
            newPageElements.push(pageElement);
        }
        page.pageElements = newPageElements;
        return page;
    }

    sanitizePage(page) {

        page.pageElements = this.__transformElementGroups(page.pageElements);
        page = this.__deleteSmallElements(page);
        page = this.__mergeIntersectingElements(page);
        return page;
    }
}

module.exports = {
    Templates,
    consumeSize,
    getRectangle,
};
},{"uuid":1}]},{},[17]);
