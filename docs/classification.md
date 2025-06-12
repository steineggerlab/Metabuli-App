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
- `--min-score`: Set the minimum similiarity score for making a classification. 
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