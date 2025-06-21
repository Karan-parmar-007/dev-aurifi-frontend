<script>
	import BreadCrumb from '$lib/components/BreadCrumb.svelte';
	import { Button } from 'flowbite-svelte';
	import { generateFormulaModal } from '../../../../store/toogleModal.svelte.js';
	import GenerateFormulaModalForm from '$lib/components/GenerateFormulaModalForm.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state'; // Use $app/stores for reactive page data
	import CustomTable from '$lib/components/CustomTable.svelte';
	import { onMount } from 'svelte';
	import { VITE_API_URL } from '$lib/constants.js';
	import { browser } from '$app/environment';

	// Reactive page URL parsing
	let path = page.url.pathname;
	let urlParts = path.split('/');
	let project_id = urlParts[3];

	let currentFile = $state('');

	// Props
	let { data } = $props();

	// Reactive state for file data
	let fileData = $state(data.result.data);
	let allColumns = $derived(fileData?.columns ?? []);
	let initialColumnsToDisplay = $derived(allColumns.slice(0)); // Copy all columns
	let isLoading = $state(false);
	let errorMessage = $state(null); // For user feedback

	// Fetch updated data from API
	const fetchUpdatedData = async () => {
		try {
			isLoading = true;
			errorMessage = null;

			const response = await fetch(
				`${VITE_API_URL}/transaction/get_transaction_data/${project_id}`
			);

			if (!response.ok) {
				throw new Error(`Failed to fetch data: ${response.statusText}`);
			}

			const result = await response.json();

			if (result.status !== 'success') {
				throw new Error('API returned an unsuccessful status');
			}

			// Update fileData with new columns and rows
			fileData = {
				columns: result.columns,
				rows: result.rows,
				file_path: fileData.file_path // Preserve existing file_path if needed
			};
		} catch (error) {
			console.error('Error fetching updated data:', error);
			errorMessage = 'Failed to load updated data. Please try again.';
		} finally {
			isLoading = false;
		}
	};

	onMount(() => {
		if (browser) {
			currentFile = localStorage.getItem('currentFile') || 'No file selected';
		}
		fetchUpdatedData();
	});

	// Handle Continue button click
	async function handleContinue() {
		try {
			isLoading = true;
			errorMessage = null;

			// Finalize adding new column
			const finalizeColumnResponse = await fetch(
				`${VITE_API_URL}/transaction_dataset/temp_to_final_adding_new_column`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						transaction_id: project_id
					})
				}
			);

			if (!finalizeColumnResponse.ok) {
				console.log('finalizeColumnResponse: ', await finalizeColumnResponse.json());
				throw new Error('Failed to finalize new column: ' + (await finalizeColumnResponse.json()));
			}

			// Start applying RBI rules
			const rbiRulesResponse = await fetch(
				`${VITE_API_URL}/transaction_dataset/start_applying_rbi_rules`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						transaction_id: project_id
					})
				}
			);

			if (!rbiRulesResponse.ok) {
				throw new Error('Failed to apply RBI rules: ' + rbiRulesResponse.statusText);
			}

			// Navigate to the next page
			goto(`/Transactions/rbi_guidelines/${project_id}`);
		} catch (error) {
			console.error('Error during API calls:', error);
			errorMessage = 'An error occurred while processing your request. Please try again.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex h-[100vh] w-full flex-col">
	<div class="flex w-full items-center gap-16 px-4 pt-8">
		<h1 class="text-xl font-semibold">{currentFile}</h1>
	</div>

	<div class="h-full px-20">
		<BreadCrumb />
		<div class="flex h-full flex-col gap-2 px-4 py-6">
			<h2 class="font-semibold">Add Additional Fields</h2>
			<span class="flex items-center justify-between gap-6 pb-6 font-normal">
				<p class="text-gray-500">Add a new field or add an additional one</p>
				<Button
					color="blue"
					class="h-[38px] w-[144px] bg-[#0161DB] text-nowrap"
					onclick={() => (generateFormulaModal.isGenerateFormulaModalOpen = true)}
				>
					Generate Column
				</Button>
			</span>
			{#if isLoading}
				<p>Loading...</p>
			{:else if errorMessage}
				<p class="text-red-500">{errorMessage}</p>
			{:else}
				{#if generateFormulaModal.isGenerateFormulaModalOpen}
					<GenerateFormulaModalForm {fetchUpdatedData} />
				{/if}
				<div class="flex flex-1 flex-col gap-4 py-4">
					<CustomTable
						data={fileData.rows}
						columns={allColumns}
						initialSelectedColumns={initialColumnsToDisplay}
						showDownloadButton={false}
						downloadPath={fileData.file_path}
					/>
					<div class="flex w-full items-center justify-end">
						<Button
							color="dark"
							class="mt-5 h-[38px] w-[144px] max-w-40 cursor-pointer rounded-xl p-4 text-white"
							onclick={handleContinue}
						>
							Continue
						</Button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
