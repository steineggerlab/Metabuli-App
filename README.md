[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.15845480.svg)](https://doi.org/10.5281/zenodo.15845480)
![Platform](https://img.shields.io/badge/platform-Mac%20%7C%20Windows%20%7C%20Linux-brightgreen)

# Metabuli App 

This is the desktop application for Metabuli, a metagenomic classifier that jointly analyzes both DNA and amino acid sequences. Built with Vue.js and Electron, it provides an easy interface for running metagenomic classification jobs and visualizing the results.

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
- macOS (`.dmg`)
- Windows (`.exe`)
- Linux (`.AppImage`)

## Functionality
- **Download** pre-built **databases**
- **Create or update databases**
- Raw-read **quality control (QC)**
- Run **taxonomic classification**
- **Upload and browse** classification results
- **Extract reads** classified under a specific taxon
- Explore results with interactive **Sankey** and **Krona** plots.


---

## Changelog

### v1.1.0
- **Added** `Raw-read Quality Control (QC)` **functionality** via [fastp](https://github.com/OpenGene/fastp)/[fastplong](https://github.com/OpenGene/fastplong).
- Supports **uploading multiple samples at once** for sequential classification or raw-read pre-processing.
- **User manuals** have been added to each page for easier reference and guidance on how to use each feature.
- **Sankey plot improvements:** Now powered by the latest version of [TaxoView](https://github.com/steineggerlab/taxoview), which supports extensive customization and improved interactivity:
  - New visual settings: adjust node label width, padding, font size, and x-axis rank label size.
  - Users can select which taxonomic ranks to display.
  - Node colors are now grouped by `domain`, with gradient shading to clarify taxonomic hierarchy.
  - Users can choose from a selection of color schemes in the customization settings.
- **BibTeX citations for Metabuli**, and for **fastp** when QC is enabled, are now generated automatically upon successful job completion along with the classification results.

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


# Raw Read Quality Control
> You can preprocess raw reads either in the separate `Quality Control` tab or in the `Search Settings` tab as part of the classification process. 

Metabuli App supports `fastp` and `fastplong` for raw read quality control, respectively for short and long reads.
You can upload one or more (gzipped) FASTQ files for quality control. 

For each sample, `fastp`/`fastplong` will generate the following files:
- Pre-processed FASTQ files
- Quality control and filtering report files in HTML format
- JSON format report files for further analysis

## Parameter settings for short read QC using fastp
Default settings are generally suitable for most datasets, but you can adjust them as needed.
Below are the parameters adjustable in the GUI. Other parameters can be provided as a text file (Please see "Advanced Settings" below).
For more details, please refer [fastp GitHub repository](https://github.com/OpenGene/fastp).

### Compress Output Files (Enabled by default)
- Outputs are GZIP-compressed (e.g. `*.fq.gz`).

### Quality Filtering (Enabled by default)
- `--disable_quality_filtering`: Disable quality filtering.
- `--qualified_quality_phred`: Minimum per-base Phred quality score (default 15).
- `--unqualified_percent_limit`: Maximum fraction of "low-quality" bases allowed (default 40%).
- `--average_qual`: Minimum average quality score for the read (default none).

### Length Filtering (Enabled by default)
- `--disable_length_filtering`: Disable length filtering.
- `--length_required`: Minimum read length required (default 15). Reads shorter than this are discarded.
- `--length_limit`: Maximum read length allowed (default none). Reads longer than this are discarded.

### Adapter trimming (Enabled by default)
- Adapter sequences are automatically detected if not specified.
- `--disable_adapter_trimming`: Disable adapter trimming.
- `--adapter_sequence`: Adapter for read 1. It disables auto-detection for SE reads.
- `--adapter_sequence_r2`: Adapter for read 2 (for PE data). For PE data, the specified adapter sequences are used only when auto-detection fails.  
- `--adapter_fasta`: FASTA file of adapter sequences. They are used after trimming adapters that are either auto-detected or specified with `--adapter_sequence` or `--adapter_sequence_r2`.

### Low complexity filtering (*Disabled* by default)
- `--low_complexity_filter`: Enable low complexity filtering.
- `--complexity_threshold`: Reads with complexity below this value are discarded. Range: 0~100. (default 30)

### Per read cutting by quality (*Disabled* by default)
- `--cut_front`: Enable cutting reads from the front (5') based on quality.
- `--cut_front_window_size`: Size of the window for cutting from the front (default 4).
- `--cut_front_mean_quality`: Minimum mean quality for the front window (default 20).
- `--cut_tail`: Enable cutting reads from the tail (3') based on quality.
- `--cut_tail_window_size`: Size of the window for cutting from the tail (default 4).
- `--cut_tail_mean_quality`: Minimum mean quality for the tail window (default 20).

### Other Parameters
- `--thread`: Number of threads to use (default max(all, 16)).
- `--compression`: Output compression level (default 4).


## Parameter settings for long read QC using fastplong
Default settings are generally suitable for most datasets, but you can adjust them as needed.
Below are the parameters adjustable in the GUI. Other parameters can be provided as a text file (Please see "Advanced Settings" below).
For more details, please refer [fastplong GitHub repository](https://github.com/OpenGene/fastplong).

### Quality Filtering (Enabled by default)
- `--disable_quality_filtering`: Disable quality filtering.
- `--qualified_quality_phred`: Minimum per-base Phred quality score (default 15).
- `--unqualified_percent_limit`: Maximum fraction of "low-quality" bases allowed (default 40%).
- `--mean_qual`: Minimum average quality score for the read (default none).

### Length Filtering (Enabled by default)
- `--disable_length_filtering`: Disable length filtering.
- `--length_required`: Minimum read length required (default 1000). Reads shorter than this are discarded.
- `--length_limit`: Maximum read length allowed (default none). Reads longer than this are discarded.

### Adapter trimming (Enabled by default)
- Adapter sequences are automatically detected if not specified.
- It's recommended to specify adapters if they are known using `--start_adapter` and `--end_adapter`. 
- `--disable_adapter_trimming`: Disable adapter trimming.
- `--start_adapter`: Read start adapter sequence.
- `--end_adapter`: Read end adapter sequence.
- `--adapter_fasta`: FASTA file of adapter sequences. 

### Low complexity filtering (*Disabled* by default)
- `--low_complexity_filter`: Enable low complexity filtering.
- `--complexity_threshold`: Reads with complexity below this value are discarded. Range: 0~100. (default 30)

### Per read cutting by quality (*Disabled* by default)
- `--cut_front`: Enable cutting reads from the front (5') based on quality.
- `--cut_front_window_size`: Size of the window for cutting from the front (default 4).
- `--cut_front_mean_quality`: Minimum mean quality for the front window (default 20).
- `--cut_tail`: Enable cutting reads from the tail (3') based on quality.
- `--cut_tail_window_size`: Size of the window for cutting from the tail (default 4).
- `--cut_tail_mean_quality`: Minimum mean quality for the tail window (default 20).

### Other Parameters
- `--thread`: Number of threads to use (default max(all, 16)).
- `--compression`: Output compression level (default 4).

## Advanced Settings
You can provide additional parameters in a text file. The file should contain one parameter per line, and each line should start with the parameter name followed by its value. Parameters here will override the GUI settings.
Check [fastp](https://github.com/OpenGene/fastp) and [fastplong](https://github.com/OpenGene/fastplong) GitHub repository for parameter list.
Please use long options (e.g., `--disable_quality_filtering`) instead of short options (e.g., `-Q`).
For example:
```
--disable_quality_filtering
--qualified_quality_phred 20
--unqualified_percent_limit 30
```








# Classification
Metabuli App provides two taxonomic profiling modes in **Search Settings** panel: **New Search** and **Upload Report**.
<!-- <img alt="SearchPage_Demo_Image" src="https://github.com/user-attachments/assets/9ab5a86c-5603-4dc7-be3b-baf2ed490ef0" style="max-height: 600px; width: auto;"> -->

## New Classification
#### You can perform taxonomic classification on one or more samples using a specified database.
### Required Fields:
1. **Mode:** Select the analysis mode among single-end, paired-end, or long-read.
2. **Enable Quality Control:** Check it to enable quality control for the input reads. 
    - `fastp` and `fastplong` are used for short and long reads, respectively.
    - Please see QC documentation for more details.
3. **Job ID:** Enter a unique identifier for the job.
4. **Query Files:** Specify your query sample(s) to classify.
    - FASTA/FASTQ and their gzipped versions are supported.
    - `ADD ENTRY` to upload **multiple samples** to process using the same settings.
5. **Database Folder:** Select the folder of Metabuli database.
6. **Output Folder:** Specify the folder where the results will be saved.
    - Result files are saved in `Job ID` folder under the specified output folder.
    - When **multiple samples** are processed, results are saved in `Job ID/sample_name` directories.
7. **Max RAM:** Specify the maximum RAM (in GiB) to allocate for the job. (all available RAM by default)

### Advanced Settings (Optional): 
- `--min-score`: Set the minimum similarity score for making a classification.
    - Search results of scores lower than this are discarded to reduce false positives at the cost of sensitivity.
    - Default is 0 to maximize sensitivity.
    - Recommended values below increase precision without reducing the F1 score.
    - These values are determined from score distributions of false and true positives in synthetic benchmarks (details in Supp. Fig. 4-7 in the [Metabuli paper](https://www.nature.com/articles/s41592-024-02273-y.epdf?sharing_token=je_2D5Su0-xVOSjuKSAXF9RgN0jAjWel9jnR3ZoTv0M7gE7NDF_xi_3sW8QdRiwfSJNwqaXItSoeCvr7cvcoQxKLt0oROgWc6urmki9tP80cXEuHPN0D7b4y9y3i8Yv7sZw8MxxhAj7W6p9eZE2zaK3eozdOkXvwADVfso9cXIM%3D)):
        - Illumina short reads: 0.15 
        - PacBio HiFi reads: 0.07
        - PacBio Sequel II reads: 0.005
        - Nanopore long reads: 0.008
- `--min-sp-score`: Set the minimum similarity score for species‐ or lower‐rank classification.
    - Reads with scores below this threshold are assigned to genus‐ or higher‐rank to avoid overconfident calls.
    - Recommended values below increase precision without reducing the F1 score (details in Supp. Fig. 4-7 in the [Metabuli paper](https://www.nature.com/articles/s41592-024-02273-y.epdf?sharing_token=je_2D5Su0-xVOSjuKSAXF9RgN0jAjWel9jnR3ZoTv0M7gE7NDF_xi_3sW8QdRiwfSJNwqaXItSoeCvr7cvcoQxKLt0oROgWc6urmki9tP80cXEuHPN0D7b4y9y3i8Yv7sZw8MxxhAj7W6p9eZE2zaK3eozdOkXvwADVfso9cXIM%3D)):
        - Illumina short reads: 0.5 
        - PacBio HiFi reads: 0.3        
- `--threads`: Specify thread count for the job. (all threads by default)


- `--taxonomy-path`: Use it when your database does not have `taxonomy` folder or `taxonomyDB` file. Provide a directroy of `names.dmp`, `nodes.dmp`, and `mereged.dmp` files. 
- `--accession-level`: Classify reads to accessions if the database is created with `--accession-level` option.
- `--validate-db`: Check if files in database folder are valid.
- `--validate-input`: Vaidate query FASTA/FASTQ file format.

### Start Analysis: 
- Click the `Run Metabuli` button to start the metagenomic classification process.
- You can track the progress and see real-time backend output in the logs.

### View Results: 
   - Once the analysis is complete, you can view the results in three different forms:
     - **Table**: View the raw classification data in a table format.
     - **Sankey Diagram**: A flow diagram representing the lineage information of the displayed taxa.
     - **Krona Chart**: A hierarchical interactive chart that visualizes classification results.

### Generated Result Files:
#### 1. JobID_classifications.tsv: It contains the classification results for each read. The columns are as follows.
1. `is_classified`: Classified or not
2. `name`: Read ID
3. `taxID`: Tax. ID in the tax. dump files used in database creation
4. `query_length`: Effective read length
5. `score`: DNA level identity score
6. `rank`: Taxonomic rank of the taxon
7. `taxID:match_count`: List of "taxID : k-mer match count"
```
#query_id       name    taxID   query_length    score   rank    taxID:match_count
0       SRR14484345.1.1 0       141     0       -       -
1       SRR14484345.8.1 2697049 141     0.808511        no rank 2697049:25
```
#### 2. JobID_report.tsv: It follows Kraken2's report format. The first line is a header, and the rest of the lines are tab-separated values. The columns are as follow.

1. `clade_proportion`: Percentage of reads classified to the clade rooted at this taxon
2. `clade_count`: Number of reads classified to the clade rooted at this taxon
3. `taxon_count`: Number of reads classified directly to this taxon
4. `rank`: Taxonomic rank of the taxon
5. `taxID`: Tax ID according to the taxonomy dump files used in the database creation
6. `name`: Taxonomic name of the taxon

```
#clade_proportion       clade_count     taxon_count     rank    taxID   name
6.3491  1403612 1403612 no rank 0       unclassified
93.6509 20703786        5550    no rank 1       root
93.5580 20683246        8058    no rank 131567    cellular organisms
93.3781 20643465        680714  superkingdom    2           Bacteria
58.9608 13034701        105888  clade   1783272       Terrabacteria group
54.7279 12098906        472184  phylum  1239            Bacillota
50.0354 11061529        743978  class   186801            Clostridia
24.4574 5406894 402967  order   186802              Eubacteriales
18.2228 4028593 206645  family  216572                Oscillospiraceae
8.4570  1869631 950213  genus   216851                  Faecalibacterium
3.0276  669332  655324  species 853                       Faecalibacterium prausnitzii
0.0238  5271    5271    strain  718252                      Faecalibacterium prausnitzii L2-6
0.0199  4407    4407    strain  657322                      Faecalibacterium prausnitzii SL3/3
```

#### 3. JobID_krona.html: It is for an interactive Krona plot. You can use any modern web browser to open `JobID_krona.html`.

## Upload Report

To visualize results from a previously completed job:

1. Navigate to the **Upload Report** tab.
2. Upload the `report.tsv` file from a prior job.
3. View the uploaded results directly in the **Results** tab. For this job type, results are provided in:
   - **Table**: The raw data in table format.
   - **Sankey Diagram**: A flow diagram representing the lineage paths for the displayed taxa (without the Krona chart).
   
---


# Database Curation

## Download Database
You can download pre-built databases [here](https://metabuli.steineggerlab.workers.dev/).

## Create New Database
You can create a new database in "NEW DATABASE" tab by providing these three files:
1. **FASTA files** : Each sequence must have a unique `>accession.version` or `>accesion` header (e.g., `>CP001849.1` or `>CP001849`).
2. **NCBI-style taxonomy dump** : `names.dmp`, `nodes.dmp`, and `merged.dmp`. Sequences with tax. IDs absent here are skipped.
3. **NCBI-style accession2taxid** : Sequences with accessions absent here are skipped, and versions are ignored.


### How to prepare NCBI-style taxonomy dump files and accession2taxid
#### NCBI-style taxonomy dump
- `NCBI Taxonomy`: Download [here](https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/new_taxdump/).
- `GTDB`: Download taxonkit-GTDB files [here](https://github.com/shenwei356/gtdb-taxdump/releases).
- `ICTV`: Download taxonkit-ICTV files [here](https://github.com/shenwei356/ictv-taxdump/releases).
- `Custom taxonomy`: Generate your own `names.dmp`, `nodes.dmp`, and `merged.dmp`.


#### NCBI-style accession2taxid
- `NCBI Taxonomy`: Download [here](https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/accession2taxid/). Check [README](https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/accession2taxid/README) to know what file to use. 
- `GTDB`: It is auto generated using a `taxid.map` in the taxonkit-GTDB folder.
- `ICTV`: Use `prepare-accession2taxid.sh` in [here](https://github.com/jaebeom-kim/Metabuli-ICTV-challenge).
- `Custom accession2taxid`: Generate your own `accession2taxid` file.

#### Edit files to include custom sequences
  * Taxonomy dump files:
    * Edit `nodes.dmp` and `names.dmp` to introduce a new `taxid` in `accession2taxid`.
  * accession2taxid file:
    * For a sequence whose header is `>custom`, add `custom[tab]custom[tab]taxid[tab]anynumber`.
    * As above, version number is not necessary.
    * `taxid` must be included in the `nodes.dmp` and `names.dmp`.
    * Put any number for the last column. It is not used in Metabuli.


### Required fields
1. **GTDB-based checkbox:** Check if you use taxonkit-generated GTDB taxonomy `dmp` files. 
2. **Database Folder:** The folder where the database will be generated.
3. **FASTA List:** A file containing absolute paths to FASTA files.
4. **Accession2TaxId:** A path to NCBI-style accession2taxid following the format below. </br>
    ```
    accession   accession.version   taxid   gi
    ACCESSION   ACCESSION.1         12345   6789
    ```
5. **Taxonomy Path:** Folder of taxonomy dump files (`names.dmp`, `nodes.dmp`, and `merged.dmp` are requried).

### Optional fields
- `--make-library`: Make species genome library before indexing. It is highly recommended when a single FASTA file contains multiple species. 
- `--cds-info`: File containing CDS file paths. Provided CDSs are used for included accessions instead of predicted genes. Prodigal's gene prediction is skipped. Only GenBank/RefSeq CDS files are supported.
- `--accession-level`: Set 1 to create an accession level database, with which you can classify reads to specific accessions. </br>
  (WARNING: It it not tested for large databases. Using it with > 100K sequences may cause issues.)
- `--max-ram`: Specify the maximum RAM (in GiB) to allocate for the job.
- `--threads`: Specify the number of threads to use for the job.
- `--validate-db`: Check if the created database folder is valid.
- `--validate-input`: Validate reference FASTA file format.


---

## Update Existing Database
You can add new sequences to an existing database in the "UPDATE DATABASE" tab by providing these inputs:
1. **FASTA files** : Each sequence must have a unique `>accession.version` or `>accesion` header (e.g., `>CP001849.1` or `>CP001849`).
2. **NCBI-style accession2taxid** : Sequences with accessions not listed here will be skipped. Version numbers are ignored. </br>
(It is auto generated when the GTDB-based checkbox is checked.)
3. **Old database folder**: The folder containing the existing database to be updated.


### Required fields
1. **GTDB-based checkbox:** Check this if you are adding genomes using the taxonkit-GTDB taxonomy.
2. **Old Database Folder:** The folder containing the existing database to be updated.
3. **New Database Folder:** The folder where the updated database will be generated.
4. **FASTA List:** A file containing absolute paths to FASTA files.
5. **Taxonomy Info**
    - If GTDB-based is checked: provide the taxonkit-GTDB taxonomy folder.
    - If not checked: provide an NCBI-style accession2taxid file.

### Optional fields
- `--make-library`: Make species genome library before indexing. It is highly recommended when a single FASTA file contains multiple species. 
- `--cds-info`: File containing CDS file paths. Provided CDSs are used for included accessions instead of predicted genes. Prodigal's gene prediction is skipped. Only GenBank/RefSeq CDS files are supported.
- `--accession-level`: Set 1 to create an accession level database, with which you can classify reads to specific accessions. </br>
  (WARNING: It it not tested for large databases. Using it with > 100K sequences may cause issues.)
- `--max-ram`: Specify the maximum RAM (in GiB) to allocate for the job.
- `--threads`: Specify the number of threads to use for the job.
- `--new-taxa`:  Used when adding sequences from taxa not included in the existing database. See the section below for details.
- `--validate-db`: Check if the created database folder is valid.
- `--validate-input`: Validate reference FASTA file format.


### Adding seqeunces of new taxa
> [WARNING] 
> Mixing taxonomies within the same domain is not recommended. For example, adding prokaryotes to a GTDB-based database using NCBI taxonomy will cause issues, but adding eukaryotes or viruses to a GTDB-based database using NCBI taxonomy is fine since GTDB does not cover them.

1\. **Check taxonomy dump files** to see if you really need to add new taxa. `taxdump` command retrieves taxdump files of an existing database.

2-1\. **Create a new taxa list** 
  
If you have both **accession2taxid** and **taxonomy dump** files for the new sequences, you can use the `CREATE NEW TAXA` button next to the `New Taxa` option.
This generates two files:
- `newtaxa.tsv` for the `New Taxa` option
- `newtaxa.accession2taxid` for `Accession 2 Tax Id` field.

<!-- ```
metabuli createnewtaxalist <OLD DBDIR> <FASTA_LIST> <new taxonomy dump> <accession2taxid> <OUTDIR>
``` -->

##### Example
Suppose you're adding eukaryotic sequences to a GTDB-based database. Since GTDB doesn't include eukaryotes, you may want to use NCBI taxonomy for eukaryotes.
You can download `taxdump` files from [here](https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/new_taxdump/) and `accession2taxid` from [here](https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/accession2taxid/).
- How to use `CREATE NEW TAXA`:
    - `Old Database Folder`: Your existing GTDB database folder.
    - `FASTA List`: A file containing absolute paths to FASTA files to be added.
    - `New Taxonomy Path`: The folder of NCBI Taxonomy dump files.
    - `Accession 2 Tax Id`: NCBI-style accession2taxid file.
    - `Output Folder`: The folder where `newtaxa.tsv` and `newtaxa.accession2taxid` will be generated.
- How to run `UPDATE DATABASE`:
    - `GTDB-Based checkbox`: **Don't Check** it since you are not using GTDB tree for new sequences.
    - `Old Database Folder`: Your existing GTDB database folder.
    - `New Database Folder`: The folder for the updated database to be created.
    - `FASTA List`: The same one as above.
    - `Accession 2 Tax Id`: `newtaxa.accession2taxid` generated by `CREATE NEW TAXA`.
    - `New Taxa` option: `newtaxa.tsv` generated by `CREATE NEW TAXA`.

</br>

2-2\. **Manually prepare a new taxa list**

For the `New Taxa` option, provide a four-column TSV file in the following format.
```
taxID parentID rank name
```
The new taxon must be linked to a taxon in the existing database's taxonomy.

##### Example
Suppose you want to add *Saccharomyces cerevisiae* to a GTDB database whose taxonomy lacks the Fungi kingdom and only includes one eukaryote (*Homo sapiens*). In this scenario, your new taxa list and accession2taxid should be as follows.
```
# New taxa list
## taxid  parentTaxID rank  name // Don't put this header in your actual file.
10000013	10000012	species	Saccharomyces cerevisiae
10000012	10000011	genus	Saccharomyces
10000011	10000010	family	Saccharomycetaceae
10000010	10000009	order	Saccharomycetales
10000009	10000008	class	Saccharomycetes
10000008	10000007	phylum	Ascomycota
10000007	10000000	kingdom	Fungi // 10000000 is Eukaroyte taxID of the pre-built DB.

# accession2taxid
accession accession.version taxid gi
newseq1 newseq1 10000013  0
newseq2 newseq2 10000013  0
```

---


## Demos

### New Search Job Demo
Watch this demo to see how to run a new search on Metabuli:

https://github.com/user-attachments/assets/6c8b848b-77b8-49b1-b01e-069b872ea740

### Viewing Results
Watch this demo to see how to view the results from a completed search:

https://github.com/user-attachments/assets/8cda1132-201f-4f8d-9f09-95ccafb9e685

---

## References
The development of the Metabuli Desktop Application has been inspired by and leverages the following tools:

- **Pavian**: Elements of the table layouts and visualizations in Metabuli were inspired by Pavian for metagenomic data analysis. ([Pavian GitHub Repository](https://github.com/fbreitwieser/pavian)).
  
- **Krona**: The Krona tool is embedded in the results page for hierarchical data visualization. ([Krona GitHub Repository](https://github.com/marbl/Krona/wiki)).

- **fastp**: Ultrafast one-pass FASTQ data preprocessing, quality control, and deduplication software. ([fastp GitHub Repository](https://github.com/OpenGene/fastp))

- **fastplong**: `fastp` for long reads. ([fastplong GitHub Repository](https://github.com/OpenGene/fastplong))


We would like to acknowledge the authors of these tools for their excellent work, which has significantly contributed to the development of Metabuli App.


