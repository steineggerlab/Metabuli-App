export async function trimAndStoreJobsHistory(jobsHistory) {
	const storageLimit = 20; // Limit to the latest n jobs
	// Convert timestamp strings to numbers for accurate sorting
	jobsHistory.forEach((job) => {
		job.timestamp = new Date(job.timestamp).getTime();
	});

	// Sort jobs by timestamp in descending order (latest first)
	jobsHistory.sort((a, b) => b.timestamp - a.timestamp);

	// Trim the jobsHistory array to keep only the latest 10 jobs
	if (jobsHistory.length > storageLimit) {
		jobsHistory = jobsHistory.slice(0, storageLimit); // Keep the first 10 entries, which are the latest
	}

	// Save the trimmed jobsHistory array to a JSON file using Electron's API
	try {
		await window.electron.saveJobHistory(jobsHistory);
	} catch (error) {
		console.error("Error saving job history:", error);
	}

	return jobsHistory; // Return the trimmed array for immediate use if needed
}

export async function loadJobsHistory() {
	// Load jobs history from the JSON file via Electron
	try {
		const jobsHistory = await window.electron.loadJobHistory();
		if (jobsHistory && Array.isArray(jobsHistory)) {
			return jobsHistory;
		}
		return [];
	} catch (error) {
		console.error("Error loading job history:", error);
		return [];
	}
}
