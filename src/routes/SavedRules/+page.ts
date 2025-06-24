import { user_id, VITE_API_URL } from '$lib/constants.js';
export async function load({ fetch }) {
	try {
		const response = await fetch(`${VITE_API_URL}/rules_book_debt/get_all_rules/${user_id}`);

		if (!response.ok) {
			return {
				rules: [],
				error: 'Failed to fetch initial Rules data'
			};
		}

		const rules = await response.json();
		return {
			rules
		};
	} catch (error) {
		console.error('Error loading Rules: ', error);
		return {
			rules: [],
			error: error.message
		};
	}
}
