import { VITE_API_URL } from '$lib/constants';

export const load = async ({ fetch, params }) => {
	const fetchFile = async (project_id: string) => {
		try {
			const response = await fetch(
				`${VITE_API_URL}/transaction/get_transaction_data/${project_id}`
			);
			if (!response.ok) {
				console.error('Error fetching file data:', response.status);
				return { success: false, error: `Failed to fetch file data: ${response.status}` };
			}
			const data = await response.json();
			console.log(data);
			return { success: true, data };
		} catch (error) {
			console.error('Exception in fetchFile:', error);
			return { success: false, error: 'Failed to fetch file data' };
		}
	};

	const result = await fetchFile(params.file);

	return {
		result
	};
};
