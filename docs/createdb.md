## Database Management

### Create New Database
To create a new database, you need to provide the following 4 inputs:
1. **Database Directory:** The directory where the database will be generated.
2. **FASTA List:** A file containing absolute paths to FASTA files.
3. **Accession2TaxId:** A path to NCBI-style accession2taxid.
4. **Taxonomy Path:** Directory where the taxonomy dump files are stored (DBDIR/taxonomy by default).

### Add New Sequences to An Existing Database
To add new sequences to an existing database, you need to provide the following:
1. **New Database Directory:** The directory where the updated database will be generated.
2. **FASTA List:** A file of paths to the FASTA file to be added.
3. **Accession2taxid:** A path to NCBI-style accession2taxid.
4. **Old Database Directory:** The directory containing the old database to be updated.

#### Create New Taxa List
To create a new taxa list, click the `New Taxa List` button beside the Taxa List parameter and input the following:
1. **Database Directory:** The directory containing the old database.
2. **FASTA List:** A file of paths to the FASTA file to be added.
3. **New Taxonomy Path:** The directory where the new taxonomy dump files are stored.
4. **Accession2taxid:** A path to NCBI-style accession2taxid.
5. **Output Directory:** The directory where the new taxa list will be generated.

---