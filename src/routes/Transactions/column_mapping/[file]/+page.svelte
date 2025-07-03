<script lang="ts">
	import { page } from '$app/state';
	import BreadCrumb from '$lib/components/BreadCrumb.svelte';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import {
		Button,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import { goto } from '$app/navigation';
	import { VITE_API_URL } from '$lib/constants';

	interface SystemColumn {
		column_name: string;
		general_mandatory: boolean;
	}

	interface GptMapping {
		confidence: string;
		matchedColumn: string;
		systemColumn: string;
	}

	type ColumnRow = {
		uploaded: string;
		inputValue: string;
		selected: string;
		suggestions: Array<{ column_name: string }>;
		showSuggestions: boolean;
		highlightedIndex: number;
		confidence?: string;
	};

	let datasetColumns = $state<string[]>([]);
	let systemColumns = $state<SystemColumn[]>([]);
	let rows = $state<ColumnRow[]>([]);
	let isLoading = $state(true);
	let mappings = $state<Record<string, string>>({});
	let pageUrl = page.url.pathname;
	let urlParts = pageUrl.split('/');
	const project_id = urlParts[3];
	let currentFile = $state('');
	let unmappedMandatoryCount = $state(0);

	onMount(async () => {
		try {
			if (browser) {
				currentFile = localStorage.getItem('currentFile') || 'No file selected';
			}

			const [datasetResponse, systemResponse, gptMappingResponse] = await Promise.all([
				fetch(`${VITE_API_URL}/transaction_dataset/get_column_names?transaction_id=${project_id}`),
				fetch(`${VITE_API_URL}/admin/get_system_transaction_columns`),
				fetch(`${VITE_API_URL}/transaction_dataset/get_gpt_column_mapping/${project_id}`)
			]);

			let gptMappings: Record<string, { systemColumn: string; confidence: string }> = {};
			if (gptMappingResponse.ok) {
				const gptData = await gptMappingResponse.json();
				if (gptData.status === 'success') {
					gptData?.gpt_response?.forEach((mapping: GptMapping) => {
						gptMappings[mapping.matchedColumn] = {
							systemColumn: mapping.systemColumn,
							confidence: mapping.confidence
						};
					});
				}
			} else {
				console.warn('GPT mapping API failed, falling back to empty mappings');
			}

			if (!datasetResponse.ok || !systemResponse.ok) {
				throw new Error('Failed to fetch column data');
			}

			const datasetData = await datasetResponse.json();
			const systemData = await systemResponse.json();

			datasetColumns = datasetData.column_names || [];
			systemColumns = systemData.data || [];

			rows = datasetColumns.map((column) => ({
				uploaded: column,
				inputValue: gptMappings[column]?.systemColumn || '',
				selected: gptMappings[column]?.systemColumn || '',
				suggestions: [],
				showSuggestions: false,
				highlightedIndex: -1,
				confidence: gptMappings[column]?.confidence
			}));

			datasetColumns.forEach((col) => {
				mappings[col] = gptMappings[col]?.systemColumn || '';
			});

			updateUnmappedMandatoryCount();
		} catch (error) {
			console.error('Error fetching column data:', error);
			rows = datasetColumns.map((column) => ({
				uploaded: column,
				inputValue: '',
				selected: '',
				suggestions: [],
				showSuggestions: false,
				highlightedIndex: -1,
				confidence: undefined
			}));
			datasetColumns.forEach((col) => {
				mappings[col] = '';
			});
		} finally {
			isLoading = false;
		}
	});

	function updateUnmappedMandatoryCount() {
		const mandatoryColumns = systemColumns.filter((col) => col.general_mandatory === true);
		const mappedColumns = Object.values(mappings).filter((val) => val !== '');
		unmappedMandatoryCount = mandatoryColumns.filter(
			(col) => !mappedColumns.includes(col.column_name)
		).length;
	}

	function filterSuggestions(index: number) {
		const row = rows[index];
		const otherSelected = rows.filter((r, i) => i !== index && r.selected).map((r) => r.selected);
		const availableColumns = systemColumns.filter(
			(opt) => !otherSelected.includes(opt.column_name)
		);

		if (!row.inputValue.trim()) {
			row.suggestions = availableColumns.map((col) => ({ column_name: col.column_name }));
		} else {
			row.suggestions = availableColumns
				.filter((opt) => opt.column_name.toLowerCase().includes(row.inputValue.toLowerCase()))
				.map((col) => ({ column_name: col.column_name }));
		}

		row.showSuggestions = row.suggestions.length > 0;
		row.highlightedIndex = row.suggestions.length > 0 ? 0 : -1;
	}

	function selectSuggestion(index: number, suggestion: string) {
		rows[index].inputValue = suggestion;
		rows[index].selected = suggestion;
		rows[index].showSuggestions = false;
		rows[index].highlightedIndex = -1;
		rows[index].confidence = undefined;
		mappings[rows[index].uploaded] = suggestion;
		updateUnmappedMandatoryCount();
	}

	function validateSelection(index: number) {
		setTimeout(() => {
			const row = rows[index];
			const inputValue = row.inputValue.trim();
			const match = systemColumns.find((opt) => opt.column_name === inputValue) || null;

			if (!match) {
				row.inputValue = '';
				row.selected = '';
				mappings[row.uploaded] = '';
				row.confidence = undefined;
			} else {
				const selectedColumn = match.column_name;
				const isAlreadySelected = rows.some((r, i) => i !== index && r.selected === selectedColumn);

				if (isAlreadySelected) {
					console.error(`Column "${selectedColumn}" is already selected in another row.`);
					row.inputValue = '';
					row.selected = '';
					mappings[row.uploaded] = '';
					row.confidence = undefined;
				} else {
					row.selected = selectedColumn;
					mappings[row.uploaded] = selectedColumn;
					row.confidence = undefined;
				}
			}

			row.showSuggestions = false;
			row.highlightedIndex = -1;
			updateUnmappedMandatoryCount();
		}, 200);
	}

	const start_datatype_conversion_temp = async () => {
		try {
			const response = await fetch(
				`${VITE_API_URL}/transaction_dataset/start_datatype_conversion_temp`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ transaction_id: project_id })
				}
			);

			if (!response.ok) {
				throw new Error('Failed to start datatype conversion');
			}

			const data = await response.json();
			goto(`/Transactions/data_validation/${project_id}`);
		} catch (error) {
			console.error('Error:', error);
		}
	};

	const saveColumnMappings = async () => {
		try {
			isLoading = true;
			const formdata = new FormData();
			formdata.append('transaction_id', project_id);
			formdata.append('mapped_columns', JSON.stringify(mappings));

			const response = await fetch(`${VITE_API_URL}/transaction_dataset/update_column_names`, {
				method: 'POST',
				body: formdata
			});

			if (!response.ok) {
				throw new Error('Error sending column map');
			}

			const data = await response.json();
			await start_datatype_conversion_temp();
		} catch (error) {
			console.error('Error:', error);
		} finally {
			isLoading = false;
		}
	};

	function handleSuggestionClick(index: number, suggestion: { column_name: string }) {
		selectSuggestion(index, suggestion.column_name);
	}

	function handleInputFocus(index: number) {
		filterSuggestions(index);
		rows[index].showSuggestions = rows[index].suggestions.length > 0;
	}

	function handleKeyDown(event: KeyboardEvent, index: number) {
		const row = rows[index];
		if (!row.showSuggestions || row.suggestions.length === 0) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				row.highlightedIndex = (row.highlightedIndex + 1) % row.suggestions.length;
				break;
			case 'ArrowUp':
				event.preventDefault();
				row.highlightedIndex =
					row.highlightedIndex <= 0 ? row.suggestions.length - 1 : row.highlightedIndex - 1;
				break;
			case 'Enter':
				event.preventDefault();
				if (row.highlightedIndex >= 0) {
					const selectedSuggestion = row.suggestions[row.highlightedIndex].column_name;
					selectSuggestion(index, selectedSuggestion);
				}
				break;
			case 'Escape':
				event.preventDefault();
				row.showSuggestions = false;
				row.highlightedIndex = -1;
				break;
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
		<h1 class="text-xl font-semibold">{currentFile}</h1>
	</div>
	<div class="h-full px-20">
		<BreadCrumb />
		<div class="flex h-full flex-col gap-2 px-4 py-6">
			<h2 class="font-semibold">Column Mapping</h2>
			<span class="flex items-center gap-6 pb-6 font-normal">
				{#if unmappedMandatoryCount > 0}
					<p class="text-gray-500">
						We've detected column mismatches. Please map your uploaded columns to the system's
						expected fields.
					</p>
					<span class="rounded-xl bg-[#FFFAE9] px-3 py-2 text-[#755C0B]">
						{unmappedMandatoryCount} Mandatory Header{unmappedMandatoryCount !== 1 ? 's' : ''} Not Found
					</span>
				{/if}
			</span>

			{#if isLoading}
				<div class="flex justify-center py-10">
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
					></div>
				</div>
			{:else}
				<Table divClass="w-full">
					<TableHead>
						<TableHeadCell>Uploaded Column</TableHeadCell>
						<TableHeadCell>Map To System Column</TableHeadCell>
						<TableHeadCell>Match Probability</TableHeadCell>
					</TableHead>
					<TableBody>
						{#each rows as row, index}
							<TableBodyRow>
								<TableBodyCell class="w-auto max-w-[5%]">
									<div class="text-md flex w-auto items-center font-normal text-gray-600">
										{row.uploaded}
									</div>
								</TableBodyCell>
								<TableBodyCell>
									<div class="relative w-full">
										<input
											id="autocomplete-{index}"
											type="text"
											placeholder="Type to search..."
											bind:value={row.inputValue}
											onfocus={() => handleInputFocus(index)}
											oninput={() => filterSuggestions(index)}
											onblur={() => validateSelection(index)}
											onkeydown={(e) => handleKeyDown(e, index)}
											class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900"
											autocomplete="off"
										/>
										{#if row.showSuggestions && row.suggestions.length > 0}
											<ul
												class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg"
											>
												{#each row.suggestions as suggestion, suggestionIndex}
													<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
													<li
														onmousedown={() => handleSuggestionClick(index, suggestion)}
														class="cursor-pointer px-4 py-2 hover:bg-gray-100 {row.highlightedIndex ===
														suggestionIndex
															? 'bg-gray-200'
															: ''}"
													>
														{suggestion.column_name}
													</li>
												{/each}
											</ul>
										{/if}
									</div>
								</TableBodyCell>
								<TableBodyCell>
									<div class="text-md flex w-full items-center font-normal">
										{#if row.confidence}
											<span class="text-[#EF1F0F]">{row.confidence}</span>
										{:else}
											<span class="text-gray-500">Not mapped</span>
										{/if}
									</div>
								</TableBodyCell>
							</TableBodyRow>
						{/each}
					</TableBody>
				</Table>
				<div class="flex w-full items-center justify-end py-10">
					<Button
						color="dark"
						class="bg-dark-100 mt-6 h-[38px] w-[144px] max-w-40 cursor-pointer text-nowrap rounded-xl p-4 text-white"
						onclick={saveColumnMappings}
						disabled={unmappedMandatoryCount > 0}
					>
						Confirm Mapping
					</Button>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.relative {
		position: relative;
	}
	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	li {
		padding: 8px 12px;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	li:hover {
		background-color: #f3f4f6;
	}
</style>
