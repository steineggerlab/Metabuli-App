# Metabuli Desktop Application 

This is the desktop application for Metabuli built with Vue.js and Electron, which enables development of cross-platform desktop apps using web technologies.

## Features

- Joint analysis of DNA and amino acid sequences.
- Supports single-end, paired-end, and long-read modes.
- Visualization of results through Krona charts.
- Real-time backend output for efficient job tracking.
- Easy-to-use interface for researchers without programming experience.

For more details of Metabuli, please see
[GitHub](https://github.com/steineggerlab/Metabuli),
[Nature Methods](https://www.nature.com/articles/s41592-024-02273-y), 
[PDF](https://www.nature.com/articles/s41592-024-02273-y.epdf?sharing_token=je_2D5Su0-xVOSjuKSAXF9RgN0jAjWel9jnR3ZoTv0M7gE7NDF_xi_3sW8QdRiwfSJNwqaXItSoeCvr7cvcoQxKLt0oROgWc6urmki9tP80cXEuHPN0D7b4y9y3i8Yv7sZw8MxxhAj7W6p9eZE2zaK3eozdOkXvwADVfso9cXIM%3D), 
[bioRxiv](https://www.biorxiv.org/content/10.1101/2023.05.31.543018v2), or [ISMB 2023 talk](https://www.youtube.com/watch?v=vz2fuRcVwyk).
<p align="center"><img src="https://raw.githubusercontent.com/steineggerlab/Metabuli/master/.github/marv_metabuli_small.png" height="350" /></p>

## Platforms Supported

- macOS (Universal `.dmg`)
- Windows (`.exe`)
- Linux (AppImage `.AppImage`)

## Getting Started

### Installation

- Visit the [GitHub Releases](https://github.com/steineggerlab/Metabuli-App/releases) page for the latest builds.
- The application is pre-built for **macOS**, **Windows**, and **Linux**.
- Simply download the executable for your platform from the Releases section.

## Usage

The Metabuli App provides two modes for metagenomic classification: **New Search** and **Upload Report**. These modes are accessible via tabs in the **Search Settings** panel.

### New Search

To run a **New Search** job, follow these steps:

1. **Required Fields**: 
   Complete the following mandatory fields:
   - **Mode**: Select the analysis mode:
     - Single-end
     - Paired-end
     - Long-end
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
