<p align="center">
  <img src="logo.png" alt="JS Recon" width="180" />
</p>

<h1 align="center">JS Recon GitHub Action</h1>

<p align="center">
  Run <a href="https://js-recon.io">JS Recon</a> against any URL in your GitHub workflow.
  Surface exposed endpoints, client-side vulnerabilities, and leaked source maps automatically.
</p>

---

## Usage

```yaml
- name: JS Recon
  uses: shriyanss/js-recon-action@v1
  with:
    url: https://your-target.com
```

### Scan a localhost app

```yaml
- name: Build app
  run: npm run build

- name: JS Recon
  uses: shriyanss/js-recon-action@v1
  with:
    url: http://localhost:3000
    start-cmd: npm start
    working-directory: ./my-app
```

---

## Inputs

| Input                      | Required | Default           | Description                                                |
| -------------------------- | -------- | ----------------- | ---------------------------------------------------------- |
| `url`                      | Yes      | —                 | URL to scan (external or `http://localhost:PORT`)          |
| `start-cmd`                | No       | —                 | Shell command to start the app (for localhost URLs)        |
| `working-directory`        | No       | `.`               | Working directory for `start-cmd`                          |
| `version`                  | No       | `latest`          | JS Recon version (e.g. `latest`, `alpha`, `1.3.1-beta.1`)  |
| `break-on-map-files`       | No       | `true`            | Fail if `.map` source map files are detected               |
| `break-on-vulnerabilities` | No       | `true`            | Fail if vulnerabilities at or above threshold are detected |
| `vulnerability-severity`   | No       | `high`            | Minimum severity to fail on: `low`, `medium`, or `high`    |
| `output-dir`               | No       | `js-recon-output` | Directory to save output files                             |

## Outputs

| Output                | Description                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `map-files-found`     | `true` if `.map` source map files were detected, `false` otherwise |
| `vulnerability-count` | Number of findings at or above the configured severity             |
| `output-path`         | Absolute path to the output directory                              |

---

## Output Files

JS Recon produces the following files in the output directory:

| File                  | Description                              |
| --------------------- | ---------------------------------------- |
| `analyze.json`        | All vulnerability findings               |
| `mapped.json`         | Parsed webpack/Vite bundle structure     |
| `mapped-openapi.json` | Extracted HTTP endpoints as OpenAPI spec |
| `endpoints.json`      | Client-side routes                       |
| `report.html`         | Full HTML report                         |
| `js-recon.db`         | SQLite database of all findings          |

---

## Break conditions

### Source maps

If `.map` files are publicly accessible, the action fails by default:

```yaml
- uses: shriyanss/js-recon-action@v1
  with:
    url: https://target.com
    break-on-map-files: true # default
```

To disable: set `break-on-map-files: false`.

### Vulnerabilities

Control which severity level triggers a failure:

```yaml
- uses: shriyanss/js-recon-action@v1
  with:
    url: https://target.com
    break-on-vulnerabilities: true
    vulnerability-severity: medium # fail on medium, high
```

Available severities: `low`, `medium`, `high` (default: `high`).

---

## Uploading output as artifact

```yaml
- name: JS Recon
  id: jsrecon
  uses: shriyanss/js-recon-action@v1
  with:
    url: https://target.com

- name: Upload JS Recon output
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: js-recon-output
    path: ${{ steps.jsrecon.outputs.output-path }}
```

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

---

## License

MIT — see [LICENSE](LICENSE).
