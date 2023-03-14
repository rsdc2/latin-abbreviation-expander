# Latin Abbreviation Expander

The source code for the Latin Abbreviation Expander is written in [TypeScript](https://www.typescriptlang.org/) and transpiled to JavaScript (ECMAScript 2019).

## Online access

The Abbreviation Expander can be run by following this link:

[https://rsdc2.github.io/latin-abbreviation-expander/](https://rsdc2.github.io/latin-abbreviation-expander/)

## Run on local machine

Download files and open ```index.html``` in a browser.

## Build

``` bash
# Install dev dependencies
npm install

# Transpile from TS to JS
npx tsc
```

## Attributions

Latin Abbreviation Expander was written in [TypeScript](https://www.typescriptlang.org/) and uses [Danfo.js](https://danfo.jsdata.org/).

The software for the Latin Abbreviation Expander was written by Robert Crellin as part of the Crossreads project at the Faculty of Classics, University of Oxford, and is licensed under the MIT license. This project has received funding from the European Research Council (ERC) under the European Union’s Horizon 2020 research and innovation programme (grant agreement No 885040, “Crossreads”).

Abbreviation data, contained in the ```data/``` subfolder, are derived from the <a href="https://edh.ub.uni-heidelberg.de/" target="_blank">EDH corpus</a>, as of 15th December 2021, and are released under the  <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.en" target="_blank">CC BY-SA 4.0</a> licence.
