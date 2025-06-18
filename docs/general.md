[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.14603649.svg)](https://doi.org/10.5281/zenodo.14603649)
![Platform](https://img.shields.io/badge/platform-Mac%20%7C%20Windows%20%7C%20Linux-brightgreen)

# Metabuli App 

This is the desktop application for Metabuli, a metagenomic classification that jointly analyzes both DNA and amino acid sequences. Built with Vue.js and Electron, it provides an intuitive interface for running metagenomic classification jobs and visualizing the results.

For more details of Metabuli, please see
[GitHub](https://github.com/steineggerlab/Metabuli),
[Nature Methods](https://www.nature.com/articles/s41592-024-02273-y), 
[PDF](https://www.nature.com/articles/s41592-024-02273-y.epdf?sharing_token=je_2D5Su0-xVOSjuKSAXF9RgN0jAjWel9jnR3ZoTv0M7gE7NDF_xi_3sW8QdRiwfSJNwqaXItSoeCvr7cvcoQxKLt0oROgWc6urmki9tP80cXEuHPN0D7b4y9y3i8Yv7sZw8MxxhAj7W6p9eZE2zaK3eozdOkXvwADVfso9cXIM%3D), 
[bioRxiv](https://www.biorxiv.org/content/10.1101/2023.05.31.543018v2), or [ISMB 2023 talk](https://www.youtube.com/watch?v=vz2fuRcVwyk).
<p align="center"><img src="https://raw.githubusercontent.com/steineggerlab/Metabuli/master/.github/marv_metabuli_small.png" height="350" /></p>

## NOTE
The `NCBI` and `Assemblies` buttons in the Sankey subtree view do not work when searching against a GTDB-based database. 
We will make a button for GTDB soon.

## Platforms Supported

- macOS (Universal `.dmg`)
- Windows (`.exe`)
- Linux (AppImage `.AppImage`)

## Functionality
- **Download** pre-built **databases**
- **Create or update databases** directly in the app
- Run **taxonomic classification**
- **Upload and browse** classification results
- **Extract reads** classified under a specific taxon
- Explore results with interactive **Sankey** and **Krona** plots.


---

## Changelog

### v1.0.1
- Introduced the `Custom Database` page, enabling users to:
    - Create new databases.
    - Add new sequences to existing databases.
- Enhanced `Sankey visualization`:
    - Implemented Sankey plot verification for ensuring accuracy of visualized results.
    - Resolved a bug in lineage extraction from raw data that previously caused inaccuracies in lineage representation on the Sankey plot.

### v1.0.0
- Initial release of Metabuli App.

---

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
    - [Raw Read QC and Preprocessing](#raw-read-quality-control)
    - [Classification](#classification)
        - [New Classification](#new-classification)
        - [Upload Report](#upload-report)
    - [Create New Database](#create-new-database)
    - [Update Existing Database](#update-existing-database)
- [Demos](#demos)
- [Acknowledgments](#acknowledgments)

## Installation

- Visit the [GitHub Releases](https://github.com/steineggerlab/Metabuli-App/releases) page for the latest builds.
- The application is pre-built for **macOS**, **Windows**, and **Linux**.
- Simply download the executable for your platform from the Releases section.

> **Note:** If you encounter a security warning when opening the app, follow the instructions below to bypass the warning:
>- **macOS**: Refer to [this guide](https://support.apple.com/en-gb/guide/mac-help/mh40616/15.0/mac/15.0) on how to open apps from unidentified developers.
>- **Windows**: Click 'More info' and then 'Run anyway' to continue.

---