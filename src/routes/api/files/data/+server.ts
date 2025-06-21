import { VITE_API_URL } from '$lib/constants';

export async function GET({ url, fetch }) {
	try {
		// Get project_id from the URL query parameters
		const projectId = url.searchParams.get('projectId');

		if (!projectId) {
			return new Response(
				JSON.stringify({
					error: 'Project ID is required'
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}

		// Call the Flask backend API
		const response = await fetch(
			`${VITE_API_URL}/project/get_project_data/${projectId}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);

		if (!response.ok) {
			let errorMsg;
			try {
				const errorData = await response.json();
				errorMsg = errorData.message || `Failed to fetch project data: ${response.status}`;
			} catch (e) {
				errorMsg = `Failed to fetch project data with status: ${response.status}`;
			}

			return new Response(JSON.stringify({ error: errorMsg }), {
				status: response.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Return the data from the backend directly to the frontend
		const projectData = await response.json();

		return new Response(JSON.stringify(projectData), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Error fetching project data:', error);
		return new Response(
			JSON.stringify({
				error: 'Failed to fetch project data',
				details: error.message
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
}
