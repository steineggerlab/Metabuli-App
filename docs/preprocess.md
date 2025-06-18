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

### Quality Filtering (Enabled by default)
- `--disable_quality_filtering`: Disable quality filtering.
- `--qualified_quality_phred`: Minimum per-base Phred quality score (default 15).
- `--unqualified_percent_limit`: Maximum fraction of "low-quality" bases allowed (default 40%).
- `--average_qual`: Minimum average quality score for the read (default none).

### Length Filtering (Enabled by default)
- `--disable_length_filtering`: Disable length filtering.
- `--length_required`: Minimum read length required (default 50). Reads shorter than this are discarded.
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






