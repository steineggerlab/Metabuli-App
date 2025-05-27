## Usage

## Classification
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

### Upload Report

To visualize results from a previously completed job:

1. Navigate to the **Upload Report** tab.
2. Upload the `report.tsv` file from a prior job.
3. View the uploaded results directly in the **Results** tab. For this job type, results are provided in:
   - **Table**: The raw data in table format.
   - **Sankey Diagram**: A flow diagram representing the lineage paths for the displayed taxa (without the Krona chart).

---