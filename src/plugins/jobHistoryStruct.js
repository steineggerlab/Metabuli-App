export function makeCompletedJob({ jobDetails, q1, q2, sampleFiles, batchFolder, backendOutput, processedResults, isSample, jobType, reportFilePath }) {
  return {
    jobDetails: { ...jobDetails }, // Null when job is uploadReport
    outdir: batchFolder,
    jobid: jobDetails ? jobDetails.jobid : null,
    q1: q1,
    q2: q2,
    database: jobDetails ? jobDetails.database : null,
    sampleFiles: sampleFiles ? sampleFiles : [], // List of read files
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

export function makeFailedJob({ jobDetails, q1, q2, sampleFiles, backendOutput, status, jobType, isSample }) {
  return {
    jobDetails: { ...jobDetails }, // Null when job is uploadReport
    outdir: jobDetails ? jobDetails.outdir : null,
    jobid: jobDetails ? jobDetails.jobid : null,
    q1: q1,
    q2: q2,
    database: jobDetails ? jobDetails.database : null,
    sampleFiles: sampleFiles ? sampleFiles : [], // List of read files
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
