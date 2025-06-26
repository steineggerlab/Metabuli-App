export function makeCompletedJob({ jobDetails, sampleNames, batchFolder, backendOutput, processedResults, isSample, jobType, reportFilePath }) {
  return {
    jobDetails: { ...jobDetails }, // Null when job is uploadReport
    outdir: batchFolder,
    jobid: jobDetails ? jobDetails.jobid : null,
    sampleNames: sampleNames ? sampleNames : [], // List of samples
    isSample,
    qcEnabled: jobDetails ? jobDetails.enableQC : false,
    jobStatus: "Completed",
    jobType,
    backendOutput,
    resultsJSON: processedResults.jsonData.results,
    kronaContent: processedResults.kronaContent,
    reportFilePath: reportFilePath,
  };
}

export function makeFailedJob({ jobDetails, sampleNames, backendOutput, status, jobType, isSample }) {
  return {
    jobDetails: { ...jobDetails }, // Null when job is uploadReport
    outdir: jobDetails ? jobDetails.outdir : null,
    jobid: jobDetails ? jobDetails.jobid : null,
    sampleNames: sampleNames ? sampleNames : [], // List of samples
    isSample,
    qcEnabled: jobDetails ? jobDetails.enableQC : false,
    jobStatus: status,
    jobType,
    backendOutput,
    resultsJSON: null,
    kronaContent: null,
    reportFilePath: null,
  };
}
