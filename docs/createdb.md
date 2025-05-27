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
- `GTDB`: It is auto generated using a `taxid.map` in the taxonkit-GTDB directory.
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
2. **Database Directory:** The directory where the database will be generated.
3. **FASTA List:** A file containing absolute paths to FASTA files.
4. **Accession2TaxId:** A path to NCBI-style accession2taxid following the format below. </br>
    ```
    accession   accession.version   taxid   gi
    ACCESSION   ACCESSION.1         12345   6789
    ```
5. **Taxonomy Path:** Directory of taxonomy dump files (`names.dmp`, `nodes.dmp`, and `merged.dmp` are requried).

### Optional fields
- **Max RAM**: Specify the maximum RAM (in GiB) to allocate for the job.
- **Threads**: Specify the number of threads to use for the job.
- **Accession Level**: Create a database for accession-level classification. </br>
  (WARNING: It it not tested for large databases. Using it with > 100K sequences may cause issues.)
- **Make Library**: Make a library of species genomes. It accelerates the process when some large FASTA files include many species genomes.
- **CDS Info**: File containing absolute paths to CDS. For included accessions, Prodigal's gene prediction is skipped. Only GenBank/RefSeq CDS files are supported.   

---