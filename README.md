<a href="https://doi.org/10.5281/zenodo.14603649" target="_blank">
  <img src="https://img.shields.io/badge/DOI-10.5281%2Fzenodo.14603649-blue" alt="DOI">
</a>

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
- Run new **taxonomic profiling**
- **Upload and browse** taxonomic profiling results
- **Extract reads** classified under a specific taxon
- Explore results with customizable interactive **Sankey plots**
- Explore results with interactive **Krona plots**

## Getting Started

### Installation

- Visit the [GitHub Releases](https://github.com/steineggerlab/Metabuli-App/releases) page for the latest builds.
- The application is pre-built for **macOS**, **Windows**, and **Linux**.
- Simply download the executable for your platform from the Releases section.

> **Note:** If you encounter a security warning when opening the app, follow the instructions below to bypass the warning:

- **macOS**: Refer to [this guide](https://support.apple.com/en-gb/guide/mac-help/mh40616/15.0/mac/15.0) on how to open apps from unidentified developers.
- **Windows**: Click 'More info' and then 'Run anyway' to continue.


## Usage

The Metabuli App provides two modes for metagenomic classification: **New Search** and **Upload Report**. These modes are accessible via tabs in the **Search Settings** panel.

### New Search
To run a **New Search** job, follow these steps:
<img alt="SearchPage_Demo_Image" src="https://github.com/user-attachments/assets/9ab5a86c-5603-4dc7-be3b-baf2ed490ef0" style="max-height: 600px; width: auto;">

1. **Required Fields**: 
   Complete the following mandatory fields:
   - **Mode**: Select the analysis mode:
     - Single-end
     - Paired-end
     - Long-read
   - **Job ID**: Enter a unique identifier for the job.
   - **Select Files**: Upload the necessary files and directories:
     - Read 1 File (and Read 2 File if Paired-end is selected)
     - Database Directory
     - Output Directory
   - **Max RAM**: Specify the maximum RAM (in GiB) to allocate for the job.

2. **Advanced Settings** (Optional): 
   Configure optional parameters to fine-tune the analysis:
   - Threads
   - Min Score
   - Min SP Score
   - Taxonomy Path
   - Accession Level

3. **Start Analysis**: 
   - Click the `Run Metabuli` button to start the metagenomic classification process.
   - You can track the progress and see real-time backend output in the logs.

4. **View Results**: 
   - Once the analysis is complete, you can view the results in three different forms:
     - **Table**: View the raw classification data in a table format.
     - **Sankey Diagram**: A flow diagram representing the lineage information of the displayed taxa.
     - **Krona Chart**: A hierarchical interactive chart that visualizes classification results.
---

### Upload Report

To visualize results from a previously completed job:

1. Navigate to the **Upload Report** tab.
2. Upload the `report.tsv` file from a prior job.
3. View the uploaded results directly in the **Results** tab. For this job type, results are provided in:
   - **Table**: The raw data in table format.
   - **Sankey Diagram**: A flow diagram representing the lineage paths for the displayed taxa (without the Krona chart).


## Demos

### New Search Job Demo
Watch this demo to see how to run a new search on Metabuli:

https://github.com/user-attachments/assets/6c8b848b-77b8-49b1-b01e-069b872ea740

### Viewing Results
Watch this demo to see how to view the results from a completed search:

https://github.com/user-attachments/assets/8cda1132-201f-4f8d-9f09-95ccafb9e685

## Acknowledgments
The development of the Metabuli Desktop Application has been inspired by and leverages the following tools:

- **Pavian**: Elements of the table layouts and visualizations in Metabuli were inspired by Pavian for metagenomic data analysis. ([Pavian GitHub Repository](https://github.com/fbreitwieser/pavian)).
  
- **Krona**: The Krona tool is embedded in the results page for hierarchical data visualization. ([Krona Github Repository](https://github.com/marbl/Krona/wiki)).

We would like to acknowledge the authors of Pavian and Krona for their excellent work, which has significantly contributed to the development of Metabuli.
