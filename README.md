Gravi
=====

![Build Status](https://github.com/github/docs/actions/workflows/test.yml/badge.svg)

Visualizes graphs and algorithms.

So far it implements the following algorithms:
- depth-first search
- a parity game solver (exponential running time)
- computing treewidth

Example
-------

http://yozora.eu/gravi/

[Documentation](http://yozora.eu/gravi/doc/graph.html)

[How to run the treewidth approximation](http://yozora.eu/gravi/doc/treewidth.html)

Dependencies
------------

First, install [npm](https://nodejs.org/).  Then clone this repository
and run:

```
git submodule init && git submodule update && npm install && npm start
```

For building the documentation, you will additionally need the ruby
gems `asciidoctor` and `pygments.rb`:

```
gem install asciidoctor && gem install pygments.rb
```

To build the (rudimentary) documentation, run:

```
npm run doc
```

Minified Build
--------------

To build a minified production version:

```
npm run build
```

The output files will be in `./dist`.

Tests
-----

Run the unit tests with:

```
npm test
```
