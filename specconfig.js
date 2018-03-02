/*eslint-env browser, commonjs*/
/*eslint no-var: 0*/

require('babel-polyfill');

const testsContext = require.context("./spec", false, /\.js$/);
testsContext.keys().forEach(testsContext);
