/*eslint-env browser, commonjs*/
/*eslint no-var: 0*/

require('core-js/stable');

const testsContext = require.context("./spec", false, /\.js$/);
testsContext.keys().forEach(testsContext);
