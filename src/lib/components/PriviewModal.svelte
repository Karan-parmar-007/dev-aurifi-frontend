<script lang="ts">
	import { Modal } from 'flowbite-svelte';
	import CustomTable from '$lib/components/CustomTable.svelte';
	import { page } from '$app/state';
	import { PreviewModal } from '../../store/toogleModal.svelte';
	import { onMount } from 'svelte';
	import { VITE_API_URL } from '$lib/constants';

	let page_url = page.url.pathname;
	let urlParts = page_url.split('/');
	let project_id = urlParts[3];

	let isloading = $state(false);
	let activeTab = $state<'Inserted' | 'Ejected' | 'Current'>('Current'); // Set 'Current' as default

	let { selectedTag } = $props();
	let tagName = $derived(selectedTag);

	interface ApiResponse {
		columns: string[];
		data: Record<string, string>[];
		loan_amount_total?: number;
		rows_count?: number;
		status: string;
		[key: string]: any;
	}

	let fileData = $state<ApiResponse>({ columns: [], data: [] });

	const fetchRowsAdded = async () => {
		try {
			isloading = true;
			const response = await fetch(
				`${VITE_API_URL}/dataset/fetch_rows_added/${project_id}/${tagName.toLowerCase()}`
			);

			if (!response.ok) {
				console.error(`Error: ${response.status} ${response.statusText}`);
				fileData = { columns: [], data: [], status: 'error' };
				throw new Error(`Failed to fetch data: ${response.statusText}`);
			}

			const data: ApiResponse = await response.json();
			console.log('Data fetched (Added):', data);
			fileData = data;
		} catch (error) {
			console.error('Error fetching added rows:', error);
			fileData = { columns: [], data: [], status: 'error' };
		} finally {
			isloading = false;
		}
	};

	const fetchRowsRemoved = async () => {
		try {
			isloading = true;
			const response = await fetch(
				`${VITE_API_URL}/dataset/fetch_rows_removed/${project_id}/${tagName.toLowerCase()}`
			);

			if (!response.ok) {
				console.error(`Error: ${response.status} ${response.statusText}`);
				// Reset fileData on error
				fileData = { columns: [], data: [], status: 'error' };
				throw new Error(`Failed to fetch data: ${response.statusText}`);
			}

			const data: ApiResponse = await response.json();
			console.log('Data fetched (Removed):', data);
			fileData = data;
		} catch (error) {
			console.error('Error fetching removed rows:', error);
			// Ensure fileData is reset even if an exception occurs
			fileData = { columns: [], data: [], status: 'error' };
		} finally {
			isloading = false;
		}
	};

	const fetchCurrentRow = async () => {
		try {
			isloading = true;
			const response = await fetch(
				`${VITE_API_URL}/dataset/get_temp_version_by_tag?project_id=${project_id}&tag_name=${tagName.toLowerCase()}&include_data=true`
			);

			if (!response.ok) {
				console.error(`Error: ${response.status} ${response.statusText}`);
				throw new Error(`Failed to fetch data: ${response.statusText}`);
			}

			const data = await response.json();
			console.log('Data fetched (Current):', data);
			if (data.status === 'success' && data.file_data) {
				fileData = {
					columns: data.file_data.columns || [],
					data: data.file_data.full_data || [],
					loan_amount_total: data.version_info?.loan_amount_total || 0,
					rows_count: data.version_info?.rows_count || 0,
					status: data.status
				};
			} else {
				console.error('Invalid response structure:', data);
				fileData = { columns: [], data: [], status: 'error' };
			}
		} catch (error) {
			console.error('Error fetching current rows:', error);
			fileData = { columns: [], data: [], status: 'error' };
		} finally {
			isloading = false;
		}
	};

	// Fetch data when tagName or activeTab changes
	$effect(() => {
		if (tagName) {
			if (activeTab === 'Inserted') {
				fetchRowsAdded();
			} else if (activeTab === 'Ejected') {
				fetchRowsRemoved();
			} else if (activeTab === 'Current') {
				fetchCurrentRow();
			}
		}
	});

	// Initial fetch on mount
	onMount(() => {
		if (tagName && activeTab === 'Current') {
			fetchCurrentRow();
		}
	});

	const allColumns = $derived(fileData?.columns ?? []);
	const initialColumnsToDisplay = $derived(allColumns.slice(0, 10));
</script>

<Modal bind:open={PreviewModal.isPreviewModalOpen} size="xl" class="h-[80vh]">
	<div class="flex w-full items-center">
		<button
			aria-label="CurrentTabButton"
			class="{activeTab === 'Current'
				? 'bg-[#242C3E]'
				: 'bg-[#576177]'} rounded-t-xl px-6 py-2 text-white"
			onclick={() => (activeTab = 'Current')}
		>
			Current
		</button>
		<button
			aria-label="InsertedTabButton"
			class="{activeTab === 'Inserted'
				? 'bg-[#242C3E]'
				: 'bg-[#576177]'} rounded-t-xl px-6 py-2 text-white"
			onclick={() => (activeTab = 'Inserted')}
		>
			Inserted
		</button>
		<button
			aria-label="EjectedTabButton"
			class="{activeTab === 'Ejected'
				? 'bg-[#242C3E]'
				: 'bg-[#576177]'} rounded-t-xl px-6 py-2 text-white"
			onclick={() => (activeTab = 'Ejected')}
		>
			Ejected
		</button>
	</div>
	{#if isloading}
		<p>Loading...</p>
	{:else if fileData.status === 'error'}
		<p>No data available or an error occurred.</p>
	{:else}
		<CustomTable
			data={fileData.data ?? []}
			columns={allColumns}
			initialSelectedColumns={initialColumnsToDisplay}
		/>
	{/if}
</Modal>
