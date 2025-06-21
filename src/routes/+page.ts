export async function load({ fetch }) {
	try {
		const response = await fetch('/api/files');

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
