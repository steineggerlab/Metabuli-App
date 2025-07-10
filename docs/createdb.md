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
