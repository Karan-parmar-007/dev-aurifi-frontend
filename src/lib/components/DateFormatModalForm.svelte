<script lang="ts">
	import {
		Modal,
		Button,
		Select,
		Label,
		Table,
		TableHead,
		TableHeadCell,
		TableBodyRow,
		TableBodyCell
	} from 'flowbite-svelte';
	import { DataFormatModal } from '../../store/toogleModal.svelte';
	import { format, parse } from 'date-fns';
	import { VITE_API_URL } from '$lib/constants';

	let submitStatus = $state<boolean | null>(null);
	let processedRows = $state<{ row_number: number; value: string }[]>([]);

	let isloading = $state(false);

	// Define the expected prop structure for a single column
	let {
		data: column,
		v_id,
		onUpdate,
		isTransaction = false
	} = $props<{
		data: {
			column_name: string;
			rows: { row_number: number; value: string }[];
			error?: boolean;
			is_incorrect_format?: boolean;
		};
		v_id: string | number;
		onUpdate?: (status: { success: boolean; message?: string }) => void;
		isTransaction?: boolean;
	}>();

	// Initialize processedRows with prop data
	$effect(() => {
		processedRows =
			column?.rows.map((row) => ({
				row_number: row.row_number,
				value: row.value.split(' ')[0]
			})) || [];
	});

	// Define date format options for the input format
	let dateFormat = [
		{ value: 'yyyy-MM-dd', name: 'YYYY-MM-DD' },
		{ value: 'dd/MM/yyyy', name: 'DD/MM/YYYY' },
		{ value: 'MM/dd/yyyy', name: 'MM/DD/YYYY' },
		{ value: 'yyyy/dd/MM', name: 'YYYY/DD/MM' },
		{ value: 'dd.MM.yyyy', name: 'DD.MM.YYYY' },
		{ value: 'MM.dd.yyyy', name: 'MM.DD.YYYY' },
		{ value: 'dd-MM-yyyy', name: 'DD-MM-YYYY' },
		{ value: 'MM-dd-yyyy', name: 'MM-DD-YYYY' }
	];

	let selectedInputFormat = $state('');

	// Expected output format
	const expectedOutputFormat = 'dd/MM/yyyy';

	// Function to convert date from input format to expected format
	function convertDate(dateString: string, inputFormat: string, outputFormat: string): string {
		try {
			if (!inputFormat) return dateString;
			const date = parse(dateString, inputFormat, new Date());
			if (isNaN(date.getTime())) return dateString;
			return format(date, outputFormat);
		} catch (error) {
			console.error('Error converting date:', error);
			return dateString;
		}
	}

	// Function to fetch new sample rows
	async function handleRegenerate() {
		try {
			isloading = true;
			// Select API endpoint based on isTransaction flag
			const apiEndpoint = isTransaction
				? `${VITE_API_URL}/transaction_dataset/get_column_sample_rows?column_name=${column.column_name}&version_id=${v_id}`
				: `${VITE_API_URL}/dataset/get_column_sample_rows?version_id=${v_id}&column_name=${column.column_name}`;

			const response = await fetch(apiEndpoint, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error(`API request failed: ${response.statusText}`);
			}

			const data = await response.json();
			if (data.status !== 'success') {
				throw new Error('API returned unsuccessful status');
			}

			// Update processedRows with new data
			processedRows = data.sample_rows.map((row: { row_number: number; row_value: string }) => ({
				row_number: row.row_number,
				value: row.row_value.split(' ')[0]
			}));

			isloading = false;
		} catch (error) {
			console.error('Error fetching new sample rows:', error);
			isloading = false;
			alert('Failed to fetch new sample rows. Please try again.');
		}
	}

	// Handle Update Format button click
	async function handleUpdateFormat() {
		if (!selectedInputFormat) {
			alert('Please select an input format.');
			return;
		}

		const payload = {
			column_name: column.column_name || 'N/A',
			current_date_format: selectedInputFormat,
			system_format: 'dd/MM/yyyy',
			version_id: v_id || 'N/A'
		};

		try {
			isloading = true;
			const apiEndpoint = isTransaction
				? `${VITE_API_URL}/transaction_dataset/update_date_format`
				: `${VITE_API_URL}/dataset/update_date_format`;

			const response = await fetch(apiEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				throw new Error(`API request failed: ${response.statusText}`);
			}

			const data = await response.json();
			if (data.status !== 'success') {
				throw new Error('API returned unsuccessful status');
			}

			submitStatus = true;
			DataFormatModal.isDataFormatModalOpen = false;
			if (onUpdate) {
				onUpdate({
					success: true,
					message: `Date format updated successfully for ${column.column_name}`
				});
				isloading = false;
			}
			isloading = false;
		} catch (error) {
			console.error('Error submitting date formats:', error);
			submitStatus = false;
			if (onUpdate) {
				onUpdate({
					success: false,
					message: `Failed to update date format for ${column.column_name}`
				});
				isloading = false;
			}
			isloading = false;
			alert('Failed to update date format. Please try again.');
		}
	}
</script>

<Modal
	title="Fix Date - {column.column_name}"
	classHeader="text-black"
	bind:open={DataFormatModal.isDataFormatModalOpen}
>
	{#if isloading}
		<div class="absolute inset-0 flex items-center justify-center">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
			></div>
		</div>
	{/if}
	<div class="flex w-full flex-col gap-4">
		<div class="top-section flex flex-1 justify-center gap-16">
			<span class="flex w-[40%] flex-col justify-center gap-4">
				<Label for="original_format">Original Format</Label>
				<Select
					items={dateFormat}
					bind:value={selectedInputFormat}
					placeholder="Select input format"
				/>
			</span>
			<span class="flex w-[40%] flex-col justify-center gap-4">
				<Label for="expected_format">Expected Format</Label>
				<h3 class="font-normal text-black">DD/MM/YYYY</h3>
			</span>
		</div>
		<div class="bottom-section flex min-h-[150px] flex-1 justify-center gap-16">
			<span class="flex w-[40%] flex-col justify-center gap-4">
				<Table>
					<TableHead>
						<TableHeadCell>Row</TableHeadCell>
						<TableHeadCell>Value</TableHeadCell>
						<TableHeadCell>
							<button
								aria-label="regenerate"
								onclick={() => {
									handleRegenerate();
								}}
							>
								<svg
									width="15"
									height="15"
									viewBox="0 0 15 15"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M14.375 2.49999V6.24999M14.375 6.24999H10.625M14.375 6.24999L11.475 3.52499C10.8033 2.85293 9.97227 2.36199 9.05949 2.09797C8.14672 1.83395 7.18194 1.80546 6.25518 2.01515C5.32842 2.22484 4.46987 2.66588 3.75967 3.29712C3.04946 3.92836 2.51073 4.72923 2.19375 5.62499M0.625 12.5V8.74999M0.625 8.74999H4.375M0.625 8.74999L3.525 11.475C4.19672 12.147 5.02773 12.638 5.94051 12.902C6.85328 13.166 7.81806 13.1945 8.74482 12.9848C9.67158 12.7751 10.5301 12.3341 11.2403 11.7028C11.9505 11.0716 12.4893 10.2707 12.8062 9.37499"
										stroke="#0161DB"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</button>
						</TableHeadCell>
					</TableHead>
					{#each processedRows as row}
						<TableBodyRow>
							<TableBodyCell>{row.row_number}</TableBodyCell>
							<TableBodyCell>{row.value}</TableBodyCell>
						</TableBodyRow>
					{/each}
				</Table>
			</span>
			<span class="flex w-[40%] flex-col justify-center gap-4">
				<Table>
					<TableHead>
						<TableHeadCell>Row</TableHeadCell>
						<TableHeadCell>Value</TableHeadCell>
					</TableHead>
					{#each processedRows as row}
						<TableBodyRow>
							<TableBodyCell>{row.row_number}</TableBodyCell>
							<TableBodyCell>
								{convertDate(row.value, selectedInputFormat, expectedOutputFormat)}
							</TableBodyCell>
						</TableBodyRow>
					{/each}
				</Table>
			</span>
		</div>
		<div class="flex w-full justify-end">
			{#if submitStatus}
				<Button color="green">Done</Button>
			{:else}
				<Button color="dark" on:click={handleUpdateFormat}>Update Format</Button>
			{/if}
		</div>
	</div>
</Modal>
