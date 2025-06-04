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
4. **Select Files:** Upload the necessary files and directories.
    - Read 1 File (and Read 2 File if Paired-end is selected)
        - FASTA/FASTQ and their gzipped versions are supported.
        - `ADD ENTRY` to upload **multiple samples** to process using the same settings.
    - Database Directory
    - Output Directory
        - Result files are saved in `Job ID` directory under the specified output directory.
        - When **multiple samples** are processed, results are saved in `Job ID/sample_name` directories.
5. **Max RAM:** Specify the maximum RAM (in GiB) to allocate for the job.

### Advanced Settings (Optional): 
- **Threads:** Specify thread count for the job.
- **Min Score:** Set the minimum score for making a classification. It reduces false positives at the cost of sensitivity.
    - Recommended values (For details, please refer Supp. Fig. 4-7 in the [Metabuli paper](https://www.nature.com/articles/s41592-024-02273-y)):
        - Illumina short reads: 0.15 
        - PacBio HiFi reads: 0.07
        - PacBio Sequel II reads: 0.005
        - Nanopore long reads: 0.008
- **Min SP Score:** Set the minimum score for the species- or lower-level classification. It avoids overconfident classifications.
    - Recommended values (For details, please refer Supp. Fig. 4-7 in the [Metabuli paper](https://www.nature.com/articles/s41592-024-02273-y)):
        - Illumina short reads: 0.5 
        - PacBio HiFi reads: 0.3
- **Taxonomy Path:** Use it when your database does not have `taxonomy` directory or `taxonomyDB` file. Provide a directroy of `names.dmp`, `nodes.dmp`, and `mereged.dmp` files. 
- **Accession Level:** classify reads to accessions if available.

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

#### 2. JobID_report.tsv: It follows Kraken2's report format. The first line is a header, and the rest of the lines are tab-separated values. The columns are as follow.

1. `clade_proportion`: Percentage of reads classified to the clade rooted at this taxon
2. `clade_count`: Number of reads classified to the clade rooted at this taxon
3. `taxon_count`: Number of reads classified directly to this taxon
4. `rank`: Taxonomic rank of the taxon
5. `taxID`: Tax ID according to the taxonomy dump files used in the database creation
6. `name`: Taxonomic name of the taxon

#### 3. JobID_krona.html: It is for an interactive Krona plot. You can use any modern web browser to open `JobID_krona.html`.

## Upload Report

To visualize results from a previously completed job:

1. Navigate to the **Upload Report** tab.
2. Upload the `report.tsv` file from a prior job.
3. View the uploaded results directly in the **Results** tab. For this job type, results are provided in:
   - **Table**: The raw data in table format.
   - **Sankey Diagram**: A flow diagram representing the lineage paths for the displayed taxa (without the Krona chart).
   
---