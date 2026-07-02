# TIN-X UI

This is the frontend application for TIN-X.

TIN-X (Target Importance and Novelty eXplorer) is an interactive visualization tool for
illuminating associations between diseases and potential drug targets and is publicly available
via <https://newdrugtargets.org/>.

TIN-X uses natural language processing to identify disease
and protein mentions within PubMed content using previously published tools for named entity
recognition (NER) of gene/protein and disease names.

See also the repo [TIN-X API](https://github.com/unmtransinfo/tinx-api).

## References

- "TIN-X version 3: update with expanded dataset and modernized architecture for enhanced illumination of understudied targets", Vincent T. Metzger, Daniel C. Cannon, Jeremy J. Yang, Stephen L. Mathias, Cristian G. Bologa, Anna Waller, Stephan C. Schürer, Dušica Vidović, Keith J. Kelleher, Timothy K. Sheils, Lars Juhl Jensen, Christophe G. Lambert, Tudor I. Oprea, Jeremy S. Edwards, [PeerJ 12:e17470, https://doi.org/10.7717/peerj.17470](https://peerj.com/articles/17470/) (2024).
- "TIN-X: target importance and novelty explorer", Daniel C Cannon, Jeremy J Yang, Stephen L Mathias, Oleg Ursu, Subramani Mani, Anna Waller, Stephan C Schürer, Lars Juhl Jensen, Larry A Sklar, Cristian G Bologa, Tudor I. Oprea, [Bioinformatics, Volume 33, Issue 16, 2601–2603, (2017) https://doi.org/10.1093/bioinformatics/btx200](https://academic.oup.com/bioinformatics/article/33/16/2601/3111842)

## Installation

```
npm install
```

## Environment Files

This project uses a separate `.env` file per environment, loaded automatically by the
corresponding webpack config:

| Environment | npm script              | .env file          |
| ----------- | ----------------------- | ------------------ |
| Development | `npm run dev`           | `.env.development` |
| Staging     | `npm run build-staging` | `.env.staging`     |
| Production  | `npm run build`         | `.env.production`  |

Each file should define at least `API_ROOT`, e.g.:

```
API_ROOT=http://localhost:8000
```

`.env.development` additionally supports `TINX_UI_HTTP_PORT`, which sets the port the
dev server listens on (defaults to `8080` if unset). This variable is only used by
`npm run dev` and has no effect on staging/production builds.

## Start Dev Server

1. Create `.env.development` (modify the values as needed):

```bash
# .env.development example
API_ROOT=http://localhost:8000
TINX_UI_HTTP_PORT=8081
```

2. Launch

```
npm run dev
```

## Build Staging Version

1. Create `.env.staging` with the appropriate `API_ROOT` for staging.

```
npm run build-staging
```

## Build Prod Version

1. Create `.env.production` with the appropriate `API_ROOT` for production.

```
npm run build
```
