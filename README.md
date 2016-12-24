Gravi
=====

[![Build Status](https://travis-ci.org/Christoph-D/gravi.svg?branch=master)](https://travis-ci.org/Christoph-D/gravi)

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

For building gravi, you need nodejs and grunt-cli.  If you have
already installed nodejs, you can install grunt-cli with

```
npm install --global grunt-cli
```

After cloning this repository, run the following commands to install
all dependencies.

```
git submodule init && git submodule update
npm install
```

For building the documentation, you will additionally need the ruby
gems asciidoctor and pygments.rb:

```
gem install asciidoctor && gem install pygments.py
```

Build
-----

Run grunt to build gravi:

```
grunt
```

Then, open build/index.html in a browser (only tested in firefox).
