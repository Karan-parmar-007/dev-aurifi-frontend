<script lang="ts">
	import {
		Button,
		Checkbox,
		Input,
		Label,
		Modal,
		Select,
		Table,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import { CurrencyFormatModal } from '../../store/toogleModal.svelte';
	import { VITE_API_URL } from '$lib/constants';
	import { onMount } from 'svelte';

	let {
		data: currency_columns,
		v_id,
		onUpdate,
		isTransaction = false
	} = $props<{
		data: { column_name: string; rows: { row_number: number; value: string }[] }[];
		v_id: string | number;
		onUpdate?: (status: { success: boolean; message?: string }) => void;
		isTransaction?: boolean; // Flag to determine API endpoint
	}>();

	console.log(currency_columns);

	let options = [
		{ value: 'up', name: 'Round up' },
		{ value: 'down', name: 'Round down' }
	];

	let selected = $state('up');
	let convert_to_int = $state(false);

	let whole_number_multiplier: number = $state(1);
	let submitStatus = $state(false);
	let processedRows = $state<{ row_number: number; value: string }[]>([]);

	let isLoading = $state(false);

	async function handleRegenerate() {
		try {
			isLoading = true;
			// Select API endpoint based on isTransaction flag
			const apiEndpoint = isTransaction
				? `${VITE_API_URL}/transaction_dataset/get_column_sample_rows?column_name=${currency_columns.column_name}&version_id=${v_id}`
				: `${VITE_API_URL}/dataset/get_column_sample_rows?version_id=${v_id}&column_name=${currency_columns.column_name}`;

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

			isLoading = false;
		} catch (error) {
			console.error('Error fetching new sample rows:', error);
			isLoading = false;
			alert('Failed to fetch new sample rows. Please try again.');
		}
	}

	onMount(() => {
		handleRegenerate();
	});

	function convertCurrency(
		currencyValue: number,
		selected: 'up' | 'down',
		whole_number_multiplier: number
	): number {
		// Validate whole_number_multiplier
		if (whole_number_multiplier <= 0) {
			return currencyValue;
		}

		// Multiply currencyValue by whole_number_multiplier
		const multipliedValue = currencyValue * whole_number_multiplier;

		// Round based on selected option
		if (selected === 'up') {
			return Math.ceil(multipliedValue);
		} else if (selected === 'down') {
			return Math.floor(multipliedValue);
		} else {
			return currencyValue;
		}
	}
	const handleSubmit = async () => {
		if (!whole_number_multiplier || !selected) {
			alert('Please fill all the required fields');
			return;
		}

		if (!whole_number_multiplier || whole_number_multiplier < 1) {
			alert('Please enter a positive, non-zero number');
			whole_number_multiplier = 1;
			return;
		}

		if (!currency_columns[0]?.column_name) {
			console.log(currency_columns);
		}

		const payload = {
			version_id: v_id,
			column_name: currency_columns?.column_name || 'N/A',
			convert_to_int: convert_to_int,
			round_off_using: selected,
			whole_number_multiplier: whole_number_multiplier
		};

		console.log('payload: ', payload);

		try {
			isLoading = true;
			// Select API endpoint based on isTransaction flag
			const apiEndpoint = isTransaction
				? `${VITE_API_URL}/transaction_dataset/update_currency_column`
				: `${VITE_API_URL}/dataset/update_currency_column`;

			const response = await fetch(apiEndpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				throw new Error(`API request failed: ${response.statusText}`);
			}

			const data = await response.json();
			console.log('API response:', data);

			if (data.status !== 'success') {
				throw new Error('API returned unsuccessful status');
			}

			submitStatus = true;
			CurrencyFormatModal.isCurrencyFormatModalOpen = false; // Close the modal
			if (onUpdate) {
				onUpdate({
					success: true,
					message: `Currency format updated successfully for ${payload.column_name}`
				});
			}
		} catch (error) {
			console.error('Error submitting currency formats:', error);
			submitStatus = false;
			if (onUpdate) {
				onUpdate({
					success: false,
					message: `Failed to update currency format for ${payload.column_name}`
				});
			}
			alert('Failed to update currency format. Please try again.');
		} finally {
			isLoading = false;
		}
	};
</script>

<Modal title="Fix Currency" bind:open={CurrencyFormatModal.isCurrencyFormatModalOpen} size="md">
	{#if isLoading}
		<div class="absolute inset-0 flex items-center justify-center">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
			></div>
		</div>
	{/if}
	<div class="flex h-full w-full flex-col gap-8 p-4">
		<!-- <span class="flex items-center gap-2">
			<Label class="w-[40%]">Convert to whole number:</Label>
			<Checkbox bind:checked={convert_to_int}></Checkbox>
		</span> -->

		<div class="flex items-center justify-between gap-4">
			<span class="flex flex-1 flex-col items-start gap-2">
				<Label class="">Round off:</Label>
				<Select items={options} bind:value={selected} required />
			</span>
			<span class="flex flex-1 flex-col items-start gap-2">
				<Label class="">Whole Number Multiplier:</Label>
				<Input class="" type="number" bind:value={whole_number_multiplier} min="1" required />
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
								{convertCurrency(row.value, selected, whole_number_multiplier)}
							</TableBodyCell>
						</TableBodyRow>
					{/each}
				</Table>
			</span>
		</div>
		<div class="flex w-full items-center justify-end">
			{#if selected && whole_number_multiplier}
				{#if submitStatus}
					<Button color="green">Done</Button>
				{:else}
					<Button color="dark" onclick={handleSubmit}>Update Format</Button>
				{/if}
			{:else}
				<Button color="dark" disabled>Update Format</Button>
			{/if}
		</div>
	</div>
</Modal>
