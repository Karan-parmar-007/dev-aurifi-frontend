import { user_id, VITE_API_URL } from '$lib/constants.js';
export async function load({ fetch }) {
	try {
		const response = await fetch(
			`${VITE_API_URL}/transaction/get_all_transactions/${user_id}`
		);

		if (!response.ok) {
			return {
				files: [],
				error: 'Failed to fetch initial files data'
			};
		}

		const files = await response.json();
		return {
			files
		};
	} catch (error) {
		console.error('Error loading files:', error);
		return {
			files: [],
			error: error.message
		};
	}
}
