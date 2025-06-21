import { VITE_API_URL } from '$lib/constants.js';

export const load = async ({ fetch, params }) => {
    const fetchFile = async (projectId: string) => {
        try {
            const response = await fetch(`${VITE_API_URL}/transaction_dataset/fetch_all_rule_versions/${projectId}`);
            if (!response.ok) {
                console.error('Error fetching file data:', response.status);
                return { success: false, error: `Failed to fetch file data: ${response.status}` };
            }
            const data = await response.json();
            console.log(data)
            return { ...data };
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