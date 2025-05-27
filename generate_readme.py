parts = ["docs/general.md", "docs/classification.md", "docs/createdb.md", "docs/updatedb.md", "docs/demo.md"]

with open("README.md", "w") as outfile:
    for fname in parts:
        with open(fname) as infile:
            outfile.write(infile.read())
            outfile.write("\n\n")