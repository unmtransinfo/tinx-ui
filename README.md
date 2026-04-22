# TIN-X UI

This is the frontend application for TIN-X.

TIN-X (Target Importance and Novelty eXplorer) is an interactive visualization tool for
illuminating associations between diseases and potential drug targets and is publicly available
via <https://datascience.unm.edu/tin-x/>. TIN-X uses natural language processing to identify disease
and protein mentions within PubMed content using previously published tools for named entity
recognition (NER) of gene/protein and disease names.

See also the repo [TIN-X API](https://github.com/unmtransinfo/tinx-api).

### References

- "TIN-X version 3: update with expanded dataset and modernized architecture for enhanced illumination of understudied targets", Vincent T. Metzger, Daniel C. Cannon, Jeremy J. Yang, Stephen L. Mathias, Cristian G. Bologa, Anna Waller, Stephan C. Schürer, Dušica Vidović, Keith J. Kelleher, Timothy K. Sheils, Lars Juhl Jensen, Christophe G. Lambert, Tudor I. Oprea, Jeremy S. Edwards, [PeerJ 12:e17470, https://doi.org/10.7717/peerj.17470](https://peerj.com/articles/17470/) (2024).
- "TIN-X: target importance and novelty explorer", Daniel C Cannon, Jeremy J Yang, Stephen L Mathias, Oleg Ursu, Subramani Mani, Anna Waller, Stephan C Schürer, Lars Juhl Jensen, Larry A Sklar, Cristian G Bologa, Tudor I. Oprea, [Bioinformatics, Volume 33, Issue 16, 2601–2603, (2017) https://doi.org/10.1093/bioinformatics/btx200](https://academic.oup.com/bioinformatics/article/33/16/2601/3111842)

### Installation

```
npm install
```

### Start Dev Server

1. Create .env file (modify port `8000` if necessary):

```
echo "API_ROOT=http://localhost:8000" > .env
```

2. Launch

```
npm run dev
```

### Build Prod Version

```
npm run build
```

### Features:

- ES6 Support via [babel-loader](https://github.com/babel/babel-loader)
- SASS Support via [sass-loader](https://github.com/jtangelder/sass-loader)
- Linting via [eslint-loader](https://github.com/MoOx/eslint-loader)

When you run `npm run build` we use the [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin) to move the css to a separate file. The css file gets included in the head of the `index.html`.
