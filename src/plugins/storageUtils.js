export function trimAndStoreJobsHistory(jobsHistory) {
  // Convert timestamp strings to numbers for accurate sorting
  jobsHistory.forEach((job) => {
    job.timestamp = new Date(job.timestamp).getTime();
  });
  // Sort jobs by timestamp in descending order (latest first)
  jobsHistory.sort((a, b) => b.timestamp - a.timestamp);

  // Trim the jobsHistory array to keep only the latest 10 jobs
  if (jobsHistory.length > 10) {
    jobsHistory = jobsHistory.slice(0, 10); // Keep the first 10 entries, which are the latest
  }

  // Store the trimmed jobsHistory back into localStorage
  localStorage.setItem("jobsHistory", JSON.stringify(jobsHistory));

  return jobsHistory; // Return the trimmed array for immediate use if needed
}
