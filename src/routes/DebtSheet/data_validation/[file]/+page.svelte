<script lang="ts">
	import { onMount } from 'svelte';
	import BreadCrumb from '$lib/components/BreadCrumb.svelte';
	import {
		Button,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Modal
	} from 'flowbite-svelte';
	import DateFormatModalForm from '$lib/components/DateFormatModalForm.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import {
		CurrencyFormatModal,
		DataFormatModal,
		NumberFormatModal
	} from '../../../../store/toogleModal.svelte';
	import { VITE_API_URL } from '$lib/constants';
	import CurrencyFormatModalForm from '$lib/components/CurrencyFormatModalForm.svelte';
	import NumberFormatModalForm from '$lib/components/NumberFormatModalForm.svelte';

	// State variables using runes
	let isLoading = $state(false);
	let errorMessage = $state('');
	let dateColumns = $state<any[]>([]);
	let numericColumns = $state<any[]>([]);
	let currencyColumns = $state<any[]>([]);
	let hasErrors = $state(false);
	let version_id = $state('');
	// Track fix status per column
	let fixStatus = $state<Record<string, { success: boolean | null; message?: string }>>({});
	// Track which column is being edited in the modal
	let selectedColumn = $state<string | null>(null);
	// Track which column has error for popup
	let errorColumn = $state<string | null>(null);

	// Extract project_id from URL
	let pageUrl = page.url.pathname;
	let urlParts = pageUrl.split('/');
	const project_id = urlParts[3];

	let mappings = $state({});
	let currentFile = $state('');

	// Fetch data from API on mount
	onMount(async () => {
		if (browser) {
			currentFile = localStorage.getItem('currentFile') || 'No file selected';
		}
		if (!project_id) {
			errorMessage = 'Project ID is missing';
			isLoading = false;
			return;
		}

		try {
			const response = await fetch(
				`${VITE_API_URL}/dataset/get_datatype_conversion_preview?project_id=${project_id}`
			);

			if (!response.ok) {
				throw new Error(`API request failed: ${response.statusText}`);
			}

			const data = await response.json();
			if (data.status !== 'success') {
				throw new Error('API returned unsuccessful status');
			}

			console.log('data received: ', data);

			// Update state with API data
			dateColumns = data.date_columns || [];
			numericColumns = data.numeric_columns || [];
			currencyColumns = data.currency_columns || [];
			version_id = data.version_id;

			// Initialize fixStatus for each date column
			dateColumns.forEach((col) => {
				fixStatus[col.column_name] = { success: null };
			});

			// Check for errors in any columns or unfixed date columns
			hasErrors =
				dateColumns.some((col) => col.error || fixStatus[col.column_name]?.success !== true) ||
				numericColumns.some((col) => col.error) ||
				currencyColumns.some((col) => col.error);
		} catch (error) {
			console.error('Error fetching API data:', error);
			errorMessage = 'Failed to load data. Please try again.';
		} finally {
			isLoading = false;
		}
	});

	// Function to confirm and navigate
	function confirmMapping(): void {
		if (hasErrors) {
			errorMessage = 'Please fix all data type errors before continuing.';
			return;
		}

		isLoading = true;
		setTimeout(() => {
			goto(`/Transactions/add_fields/${project_id}`).catch((err) => {
				console.error('Navigation error:', err);
				errorMessage = 'Failed to navigate to the next page.';
			});
			isLoading = false;
		}, 1500);
	}

	// Handle update for a specific column
	function handleUpdate(columnName: string, status: { success: boolean; message?: string }) {
		fixStatus[columnName] = status;
		if (status.success) {
			console.log(`Update successful for ${columnName}:`, status.message);
		} else {
			console.error(`Update failed for ${columnName}:`, status.message);
		}
		// Recheck errors after update
		hasErrors =
			dateColumns.some((col) => col.error || fixStatus[col.column_name]?.success !== true) ||
			numericColumns.some((col) => col.error) ||
			currencyColumns.some((col) => col.error);
	}

	const partition_by_tags = async () => {
		try {
			isLoading = true;
			const response = await fetch(`${VITE_API_URL}/dataset/partition_by_tags`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					project_id: project_id
				})
			});

			if (!response.ok) {
				console.log('response: ', response);
				throw new Error(`Error fetching Data: ${response}`);
			}

			const data = await response.json();
			console.log('data splits: ', data);
			goto(`/DebtSheet/Tagging/${project_id}`);
		} catch (error) {
			console.log('error splitting data by tags: ', error);
		} finally {
			isLoading = false;
		}
	};

	const handleSubmit = async () => {
		try {
			isLoading = true;
			const response = await fetch(
				`${VITE_API_URL}/dataset/after_datatype_conversion_send_temp_to_main`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						project_id: project_id
					})
				}
			);
			if (!response.ok) {
				console.log('response: ', response);
				throw new Error(`Error fetching Data: ${response}`);
			}

			const data = await response.json();
			console.log('data validation response: ', data);
			partition_by_tags();
		} catch (error) {
			console.log('error: ', error);
		} finally {
			isLoading = false;
		}
	};
</script>

{#if DataFormatModal.isDataFormatModalOpen && selectedColumn}
	<DateFormatModalForm
		data={dateColumns.find((col) => col.column_name === selectedColumn)}
		v_id={version_id}
		onUpdate={(status) => handleUpdate(selectedColumn, status)}
		isTransaction={false}
	/>
{/if}
{#if NumberFormatModal.isNumberFormatModalOpen && selectedColumn}
	<NumberFormatModalForm
		data={numericColumns.find((col) => col.column_name === selectedColumn)}
		v_id={version_id}
		onUpdate={(status) => handleUpdate(selectedColumn, status)}
	/>
{/if}
{#if CurrencyFormatModal.isCurrencyFormatModalOpen && selectedColumn}
	<CurrencyFormatModalForm
		data={currencyColumns.find((col) => col.column_name === selectedColumn)}
		v_id={version_id}
		onUpdate={(status) => handleUpdate(selectedColumn, status)}
	/>
{/if}
{#if errorColumn}
	<Modal title="Data Error" open={!!errorColumn} on:close={() => (errorColumn = null)}>
		<p>
			The values in the "{errorColumn}" column are unexpected. Please review and correct the data.
		</p>
		<div class="mt-4 flex justify-end">
			<Button color="dark" onclick={() => (errorColumn = null)}>Close</Button>
		</div>
	</Modal>
{/if}
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
		<div class="flex h-full flex-col px-4 py-6">
			<h2 class="font-semibold">Data Validation & Formatting</h2>
			<span class="flex items-center gap-6 pb-6 font-normal">
				<p class="text-gray-500">Check for inconsistencies and fix data formatting errors.</p>
				{#if hasErrors}
					<span class="rounded-xl bg-[#FFFAE9] p-2 text-[#755C0B]">Data Type Errors Found</span>
				{/if}
			</span>
			{#if errorMessage}
				<p class="mb-4 text-red-500">{errorMessage}</p>
			{/if}
			{#if isLoading}
				<div class="flex justify-center py-10">
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
					></div>
				</div>
			{:else}
				<!-- Date Columns -->
				<div class="flex w-full flex-col items-center gap-6">
					<div
						class="text-md flex h-10 w-full items-center rounded-lg bg-[#242C3E5C] px-4 font-semibold text-black"
					>
						Date
					</div>
					<Table divClass="w-full mb-24">
						<TableHead>
							<TableHeadCell class="font-normal text-[#24273180]">Column Name</TableHeadCell>
							<TableHeadCell class="font-normal text-[#24273180]">Example</TableHeadCell>
							<TableHeadCell class="font-normal text-[#24273180]"></TableHeadCell>
							<TableHeadCell class="font-normal text-[#24273180]"></TableHeadCell>
							<TableHeadCell class="font-normal text-[#24273180]"></TableHeadCell>
							<TableHeadCell class="font-normal text-[#24273180]"></TableHeadCell>
							<TableHeadCell class="font-normal text-[#24273180]"></TableHeadCell>
						</TableHead>
						<TableBody>
							{#each dateColumns as column}
								<TableBodyRow>
									<TableBodyCell>{column.column_name}</TableBodyCell>
									<TableBodyCell>{column.rows[0]?.value || 'N/A'}</TableBodyCell>
									<TableBodyCell></TableBodyCell>
									<TableBodyCell></TableBodyCell>
									<TableBodyCell></TableBodyCell>
									<TableBodyCell></TableBodyCell>
									<TableBodyCell>
										{#if column.error}
											<button
												class="text-red-500"
												onclick={() => (errorColumn = column.column_name)}
											>
												Error
											</button>
										{:else if fixStatus[column.column_name]?.success}
											<button class="text-[#2362EB]">Fixed!</button>
										{:else}
											<button
												class="text-[#2362EB]"
												onclick={() => {
													selectedColumn = column.column_name;
													DataFormatModal.isDataFormatModalOpen = true;
												}}
											>
												Fix
											</button>
										{/if}
									</TableBodyCell>
								</TableBodyRow>
							{:else}
								<TableBodyRow>
									<TableBodyCell colspan="7">No date columns found</TableBodyCell>
								</TableBodyRow>
							{/each}
						</TableBody>
					</Table>
				</div>

				<!-- Numeric Columns -->
				<div class="flex w-full flex-col items-center gap-6">
					<div
						class="text-md flex h-10 w-full items-center rounded-lg bg-[#242C3E5C] px-4 font-semibold text-black"
					>
						Number
					</div>
					<Table divClass="w-full mb-24">
						<TableHead>
							<TableHeadCell class="font-normal text-[#24273180]">Column Name</TableHeadCell>
							<TableHeadCell class="font-normal text-[#24273180]">Example</TableHeadCell>
							<TableHeadCell class="font-normal text-[#24273180]"></TableHeadCell>
							<TableHeadCell class="font-normal text-[#24273180]"></TableHeadCell>
							<TableHeadCell class="font-normal text-[#24273180]"></TableHeadCell>
							<TableHeadCell class="font-normal text-[#24273180]"></TableHeadCell>
							<TableHeadCell class="font-normal text-[#24273180]"></TableHeadCell>
						</TableHead>
						<TableBody>
							{#each numericColumns as column}
								<TableBodyRow>
									<TableBodyCell>{column.column_name}</TableBodyCell>
									<TableBodyCell>{column.rows[0]?.value || 'N/A'}</TableBodyCell>
									<TableBodyCell></TableBodyCell>
									<TableBodyCell></TableBodyCell>
									<TableBodyCell></TableBodyCell>
									<TableBodyCell></TableBodyCell>
									<TableBodyCell>
										{#if column.error}
											<button
												class="text-red-500"
												onclick={() => (errorColumn = column.column_name)}
											>
												Error
											</button>
										{:else if column.is_floating}
											<button
												class="text-[#2362EB]"
												onclick={() => {
													selectedColumn = column.column_name;
													NumberFormatModal.isNumberFormatModalOpen = true;
												}}
											>
												Fix
											</button>
										{:else}
											<button class="text-[#2362EB]">Fixed!</button>
										{/if}
									</TableBodyCell>
								</TableBodyRow>
							{:else}
								<TableBodyRow>
									<TableBodyCell colspan="7">No numeric columns found</TableBodyCell>
								</TableBodyRow>
							{/each}
						</TableBody>
					</Table>
				</div>

				<!-- Currency Columns -->
				<div class="flex w-full flex-col items-center gap-6">
					<div
						class="text-md flex h-10 w-full items-center rounded-lg bg-[#242C3E5C] px-4 font-semibold text-black"
					>
						Currency
					</div>
					<Table divClass="w-full mb-24">
						<TableHead>
							<TableHeadCell class="font-normal text-[#24273180]">Column Name</TableHeadCell>
							<TableHeadCell class="font-normal text-[#24273180]">Example</TableHeadCell>
							<TableHeadCell class="font-normal text-[#24273180]"></TableHeadCell>
							<TableHeadCell class="font-normal text-[#24273180]"></TableHeadCell>
							<TableHeadCell class="font-normal text-[#24273180]"></TableHeadCell>
							<TableHeadCell class="font-normal text-[#24273180]"></TableHeadCell>
							<TableHeadCell class="font-normal text-[#24273180]"></TableHeadCell>
						</TableHead>
						<TableBody>
							{#each currencyColumns as column}
								<TableBodyRow>
									<TableBodyCell>{column.column_name}</TableBodyCell>
									<TableBodyCell>{column.rows[0]?.value || 'N/A'}</TableBodyCell>
									<TableBodyCell></TableBodyCell>
									<TableBodyCell></TableBodyCell>
									<TableBodyCell></TableBodyCell>
									<TableBodyCell></TableBodyCell>
									<TableBodyCell>
										{#if column.error}
											<button
												class="text-red-500"
												onclick={() => (errorColumn = column.column_name)}
											>
												Error
											</button>
										{:else if fixStatus[column.column_name]?.success}
											<button class="text-[#2362EB]">Fixed!</button>
										{:else}
											<button
												class="text-[#2362EB]"
												onclick={() => {
													selectedColumn = column.column_name;
													CurrencyFormatModal.isCurrencyFormatModalOpen = true;
												}}
											>
												Fix
											</button>
										{/if}
									</TableBodyCell>
								</TableBodyRow>
							{:else}
								<TableBodyRow>
									<TableBodyCell colspan="7">No currency columns found</TableBodyCell>
								</TableBodyRow>
							{/each}
						</TableBody>
					</Table>
				</div>

				<div class="flex w-full items-center justify-end">
					<Button
						color="dark"
						class="text-nowrap"
						onclick={() => {
							handleSubmit();
						}}
						disabled={hasErrors}
					>
						Continue
					</Button>
				</div>
			{/if}
		</div>
	</div>
</div>
