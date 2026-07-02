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

## Setup

### 1. Install dependencies

```
npm install
```

### 2. Configure environment variables

Each environment loads its own `.env` file, selected automatically based on the npm
script you run:

| Environment | npm script              | .env file          |
| ----------- | ----------------------- | ------------------ |
| Development | `npm run dev`           | `.env.development` |
| Staging     | `npm run build-staging` | `.env.staging`     |
| Production  | `npm run build`         | `.env.production`  |

Create the file for the environment you're targeting, setting the variables below:

| Variable            | Required                      | Description                                                                 |
| ------------------- | ----------------------------- | --------------------------------------------------------------------------- |
| `API_ROOT`          | Yes, in every `.env` file     | Base URL of the TIN-X API                                                   |
| `TINX_UI_HTTP_PORT` | No — dev only, default `8080` | Port the dev server listens on (has no effect on staging/production builds) |

Example `.env.development`:

```
API_ROOT=http://localhost:8000
TINX_UI_HTTP_PORT=8080
```

### 3. Run

Development (live reload):

```
npm run dev
```

The UI will be available at http://localhost:8080/ (or your configured `TINX_UI_HTTP_PORT`).

Staging build:

```
npm run build-staging
```

Production build:

```
npm run build
```
