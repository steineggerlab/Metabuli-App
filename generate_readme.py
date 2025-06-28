parts = ["docs/general.md", "docs/preprocess.md", "docs/classification.md", "docs/createdb.md", "docs/demo.md", "docs/references.md"]

with open("README.md", "w") as outfile:
    for fname in parts:
        with open(fname) as infile:
            outfile.write(infile.read())
            outfile.write("\n\n")
