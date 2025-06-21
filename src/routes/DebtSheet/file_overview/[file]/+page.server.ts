export const load = async ({ fetch, params }) => {
	const fetchFile = async (project_id: string) => {
		try {
			console.log('called the server fetch function');

			const response = await fetch(`/api/files/data?projectId=${project_id}`);
			if (!response.ok) {
				console.error('Error fetching file data:', response.status);
				return { success: false, error: `Failed to fetch file data: ${response.status}` };
			}
			console.log(response);
			const data = await response.json();
			return { success: true, data };
		} catch (error) {
			console.error('Exception in fetchFile:', error);
			return { success: false, error: 'Failed to fetch file data' };
		}
	};

	const result = await fetchFile(params.file);

	console.log('returning result:', result);

	return {
		result
	};
};
