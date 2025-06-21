<script>
	import { page } from '$app/state';
	import BreadCrumb from '$lib/components/BreadCrumb.svelte';
	import { onMount } from 'svelte';
	import {
		Button,
		Select,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import { goto } from '$app/navigation';
	import { error } from '@sveltejs/kit';
	import { VITE_API_URL } from '$lib/constants';
	/** @type {string[]} */
	let datasetColumns = $state([]);
	let existingMappings = $state([]);

	/** @type {string[]} */
	let systemColumns = $state([]);

	/** @type {{ value: string; name: string }[]} */
	let dataTypes = $state([
		{ value: 'Number', name: 'Number' },
		{ value: 'Decimal', name: 'Decimal' },
		{ value: 'Text', name: 'Text' },
		{ value: 'Date', name: 'Date' },
		{ value: 'Bool', name: 'Boolean' }
	]);

	/** @type {{ uploaded: string; inputValue: string; selected: string; suggestions: string[]; showSuggestions: boolean; }[]} */
	let rows = $state([]);

	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let submitError = $state('');

	/** @type {Record<string, string>} */
	let mappings = $state({});

	// Extract project_id from URL
	const pageUrl = page.url.pathname;
	const urlParts = pageUrl.split('/');
	const project_id = urlParts[3];

	// Function to map API datatype to UI datatype
	/**
	 * Maps API datatype to the corresponding UI datatype value
	 * @param {string} apiDatatype - The datatype from the API
	 * @returns {string} The corresponding datatype value for the UI
	 */
	function mapApiDatatypeToUiDatatype(apiDatatype) {
		switch (apiDatatype.toLowerCase()) {
			case 'number':
			case 'integer':
				return 'Number';
			case 'float':
			case 'double':
			case 'decimal':
				return 'decimal	';
			case 'string':
			case 'text':
				return 'Text';
			case 'date':
			case 'datetime':
				return 'Date';
			default:
				return ''; // Empty means no selection
		}
	}

	/**
	 * Maps UI datatype to API datatype format
	 * @param {string} uiDatatype - The datatype selected in the UI
	 * @returns {string} The corresponding datatype for the API
	 */
	function mapUiDatatypeToApiDatatype(uiDatatype) {
		switch (uiDatatype) {
			case 'Integer':
			case 'Number':
				return 'number';
			case 'Floating Point Number':
			case 'Decimal':
				return 'number';
			case 'Text':
				return 'string';
			case 'Date':
				return 'date';
			default:
				return '';
		}
	}

	onMount(async () => {
		try {
			isLoading = true;
			const [datasetResponse, datatypeResponse] = await Promise.all([
				fetch(`${VITE_API_URL}/dataset/get_column_names?project_id=${project_id}`),
				fetch(`${VITE_API_URL}/project/get_datatype_mapping/${project_id}`)
			]);

			if (!datasetResponse.ok || !datatypeResponse.ok) {
				throw new Error('Failed to fetch column data');
			}

			const datasetData = await datasetResponse.json();
			const datatypeData = await datatypeResponse.json();

			// Get column names and existing datatype mappings
			datasetColumns = datasetData.column_names || [];
			existingMappings = datatypeData.datatype_mapping || {};

			// Initialize rows with existing mappings when available
			rows = datasetColumns.map((column) => {
				const existingDatatype = existingMappings[column];
				const mappedDatatype = existingDatatype ? mapApiDatatypeToUiDatatype(existingDatatype) : '';

				return {
					uploaded: column,
					inputValue: '',
					selected: mappedDatatype, // Pre-select the datatype if it exists
					suggestions: [],
					showSuggestions: false
				};
			});

			// Initialize mappings object
			datasetColumns.forEach((col) => {
				const existingDatatype = existingMappings[col];
				mappings[col] = existingDatatype ? mapApiDatatypeToUiDatatype(existingDatatype) : '';
			});
		} catch (error) {
			console.error('Error fetching column data:', error);
		} finally {
			isLoading = false;
		}
	});

	/**
	 * Handle the submit action to save mappings
	 */
	async function handleConfirmMapping() {
		try {
			isSubmitting = true;
			submitError = '';

			// Update mappings based on current row selections
			rows.forEach((row) => {
				mappings[row.uploaded] = row.selected;
			});

			// Convert UI datatypes to API datatypes
			const apiMappings = {};
			const apiMap = {};
			Object.entries(mappings).forEach(([column, uiDatatype]) => {
				const apiDatatype = mapUiDatatypeToApiDatatype(uiDatatype);
				if (apiDatatype) {
					apiMappings[column] = apiDatatype;
					apiMap[column] = '';
				}
			});

			// Prepare the payload as per the required format
			const payload = {
				datatype_mapping: apiMap
			};

			// Send the mappings to the backend using the specified endpoint
			const response = await fetch(
				`${VITE_API_URL}/project/update_project${project_id}`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				}
			);

			if (!response.ok) {
				throw new Error(`Server responded with status: ${response.status}`);
			}

			const result = await response.json();

			if (result.status === 'success') {
				// Navigate to the dashboard on success
				goto(`/DebtSheet/Tagging/${project_id}`);
			} else {
				// Handle API error
				goto(`/DebtSheet/Tagging/${project_id}`);
				// submitError = result.message || 'Failed to save datatype mappings';
			}
		} catch (err) {
			goto(`/DebtSheet/Tagging/${project_id}`);
			// console.error('Error saving mappings:', err);
			// submitError = err.message || 'An unexpected error occurred';
		} finally {
			isSubmitting = false;
		}
	}

	/**
	 * Get appropriate text color class based on match probability
	 * @param {number} probability - The match probability percentage
	 * @returns {string} CSS class for text color
	 */
	function getProbabilityColorClass(probability) {
		if (probability === 100) {
			return 'text-green-600';
		} else if (probability >= 70) {
			return 'text-yellow-600';
		} else {
			return 'text-red-600';
		}
	}

	/**
	 * Get display text for match probability
	 * @param {number} probability - The match probability percentage
	 * @returns {string} The descriptive text
	 */
	function getProbabilityText(probability) {
		if (probability === 100) {
			return 'Exact Match';
		} else if (probability >= 70) {
			return 'Likely Match';
		} else {
			return 'Suggested Match';
		}
	}
</script>

<div class="flex h-[100vh] w-full flex-col">
	<div class="flex w-full items-center gap-4 px-16 pt-14">
		<svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M20.4338 8.69904C20.4333 8.69858 20.4329 8.69812 20.4324 8.69766L11.866 0.539551C11.5009 0.19165 11.0154 0 10.4991 0C9.98268 0 9.49722 0.191498 9.13193 0.539398L0.570075 8.69339C0.567191 8.69614 0.564307 8.69904 0.561423 8.70178C-0.188394 9.42001 -0.187112 10.5853 0.565108 11.3017C0.908774 11.6292 1.36267 11.8188 1.84797 11.8387C1.86767 11.8405 1.88754 11.8414 1.90757 11.8414H2.24899V17.8453C2.24899 19.0334 3.26397 20 4.51174 20H7.86317C8.20283 20 8.4784 19.7377 8.4784 19.4141V14.707C8.4784 14.1649 8.94143 13.7239 9.51068 13.7239H11.4874C12.0567 13.7239 12.5197 14.1649 12.5197 14.707V19.4141C12.5197 19.7377 12.7951 20 13.135 20H16.4864C17.7342 20 18.7491 19.0334 18.7491 17.8453V11.8414H19.0657C19.5819 11.8414 20.0674 11.6499 20.4329 11.302C21.1859 10.5844 21.1862 9.41711 20.4338 8.69904Z"
				fill="#242C3E"
			/>
		</svg>
		<h1 class="text-xl font-semibold">Book Debt Management</h1>
	</div>
	<div class="h-full px-20">
		<BreadCrumb />
		<div class="flex h-full flex-col gap-2 px-4 py-6">
			<h2 class="font-semibold">Datatype Mapping</h2>
			<span class="flex items-center gap-6 pb-6 font-normal">
				<p class="text-gray-500">
					We've detected column datatypes. Please confirm or update the datatype mappings for your
					uploaded columns.
				</p>
			</span>

			{#if isLoading}
				<div class="flex justify-center py-10">
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
					></div>
				</div>
			{:else if submitError}
				<div class="mb-4 rounded-md bg-red-50 p-4">
					<div class="flex">
						<div class="flex-shrink-0">
							<!-- Error icon -->
							<svg
								class="h-5 w-5 text-red-400"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								aria-hidden="true"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-red-800">Error saving datatype mappings</h3>
							<div class="mt-2 text-sm text-red-700">
								<p>{submitError}</p>
							</div>
						</div>
					</div>
				</div>
			{/if}

			{#if !isLoading}
				<Table divClass="">
					<TableHead>
						<TableHeadCell class="w-1/3">Uploaded Column</TableHeadCell>
						<TableHeadCell class="w-1/3">Select DataType</TableHeadCell>
						<TableHeadCell class="w-1/3">Match Status</TableHeadCell>
					</TableHead>
					<TableBody tableBodyClass="">
						{#each rows as row, index}
							<TableBodyRow class="bg-gray-100">
								<TableBodyCell class="">
									<div class="text-md flex w-auto items-center font-normal text-gray-600">
										{row.uploaded}
									</div>
								</TableBodyCell>

								<TableBodyCell class="">
									<div class="relative">
										<!-- Bind the Select to the individual row's selected property -->
										<Select items={dataTypes} bind:value={row.selected} />
									</div>
								</TableBodyCell>

								<TableBodyCell>
									<div class="text-md flex w-full items-center font-normal">
										<h3 class={getProbabilityColorClass(row.matchProbability || 0)}>
											{row.matchProbability === 100 ? '✓' : '*'}
											{row.matchProbability || 33}% {getProbabilityText(row.matchProbability || 33)}
										</h3>
									</div>
								</TableBodyCell>
							</TableBodyRow>
						{/each}
					</TableBody>
				</Table>
				<Button
					color="dark"
					class="bg-dark-100 mt-6 max-w-40 cursor-pointer rounded-xl p-4 text-white"
					disabled={isSubmitting}
					onclick={handleConfirmMapping}
				>
					{#if isSubmitting}
						<div
							class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
						></div>
						Saving...
					{:else}
						Confirm Mapping
					{/if}
				</Button>
			{/if}
		</div>
	</div>
</div>
