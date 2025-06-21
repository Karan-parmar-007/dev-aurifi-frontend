import { user_id, VITE_API_URL } from '$lib/constants';
export async function GET({ fetch }) {
	try {
		const response = await fetch(`${VITE_API_URL}/project/get_projects/${user_id}`);

		if (!response.ok) {
			console.log(await response.json());
			return new Response(JSON.stringify({ error: response }), {
				status: response.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const data = await response.json();

		return new Response(JSON.stringify(data), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.log(error);
		return new Response(
			JSON.stringify({
				error: error
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
}

export async function POST({ request, fetch }) {
	try {
		const formData = await request.formData();

		const backendFormData = new FormData();

		const file = formData.get('file');
		const name = formData.get('name');
		const user_id = formData.get('user_id');

		if (!file) {
			return new Response(JSON.stringify({ error: 'No File Provided' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		if (!name) {
			return new Response(JSON.stringify({ error: 'No File Provided' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		if (!user_id) {
			return new Response(JSON.stringify({ error: 'No File Provided' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		backendFormData.append('file', file);
		backendFormData.append('name', name);
		backendFormData.append('user_id', user_id);

		const response = await fetch(`${VITE_API_URL}/project/upload_dataset`, {
			method: 'POST',
			body: backendFormData
		});

		if (!response.ok) {
			let errorMsg;
			try {
				const errorData = await response.json();
				console.error('error', errorData);
				errorMsg = errorData || 'Upload failed..';
			} catch (e) {
				errorMsg = `Upload failed with status: ${response.status}`;
			}

			return new Response(JSON.stringify({ error: errorMsg }), {
				status: response.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const result = await response.json();
		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Error in upload endpoint:', error);
		return new Response(JSON.stringify({ error: error }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

export async function DELETE({ request, fetch }) {
	try {
		const { projectID } = await request.json();
		const response = await fetch(
			`${VITE_API_URL}/project/delete_project/${projectID}`,
			{
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
		if (!response.ok) {
			return new Response(
				JSON.stringify({
					error: 'Error deleting file'
				})
			);
		}
		return new Response(
			JSON.stringify({
				success: true,
				message: 'delete file'
			})
		);
	} catch (error) {
		console.error('Error in delete file endpoint: ', error);
		return new Response(JSON.stringify({ message: 'Error in delete Endpoint' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
}

export async function PUT({ request, fetch }) {
	try {
		const { projectID } = await request.json();
		const response = await fetch(
			`${VITE_API_URL}/project/delete_project/${projectID}`,
			{
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
		if (!response.ok) {
			return new Response(
				JSON.stringify({
					error: 'Error deleting file'
				})
			);
		}
		return new Response(
			JSON.stringify({
				success: true,
				message: 'delete file'
			})
		);
	} catch (error) {
		console.error('Error in delete file endpoint: ', error);
		return new Response(JSON.stringify({ message: 'Error in delete Endpoint' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
}
