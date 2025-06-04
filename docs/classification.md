# Classification
Metabuli App provides two taxonomic profiling modes in **Search Settings** panel: **New Search** and **Upload Report**.
<img alt="SearchPage_Demo_Image" src="https://github.com/user-attachments/assets/9ab5a86c-5603-4dc7-be3b-baf2ed490ef0" style="max-height: 600px; width: auto;">

## New Classification
### Required Fields:
1. **Mode:** Select the analysis mode among single-end, paired-end, or long-read.
2. **Job ID:** Enter a unique identifier for the job.
3. **Select Files:** Upload the necessary files and directories.
    - Read 1 File (and Read 2 File if Paired-end is selected)
    - Database Directory
    - Output Directory
4. **Max RAM:** Specify the maximum RAM (in GiB) to allocate for the job.

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

## Upload Report

To visualize results from a previously completed job:

1. Navigate to the **Upload Report** tab.
2. Upload the `report.tsv` file from a prior job.
3. View the uploaded results directly in the **Results** tab. For this job type, results are provided in:
   - **Table**: The raw data in table format.
   - **Sankey Diagram**: A flow diagram representing the lineage paths for the displayed taxa (without the Krona chart).
   
---