import { VITE_API_URL } from '$lib/constants';

export async function load({ fetch}) {
    try {
        const response = await fetch(`${VITE_API_URL}/admin/get_asset_classes`);

        if (!response.ok) {
            console.log('response is not ok')
        }
        const data = await response.json()
        return data

    } catch (error) {
        console.error('Error loading files:', error);
        return {
            settings: [],
            error: "Error fetching data from server side"
        };

    }
}

