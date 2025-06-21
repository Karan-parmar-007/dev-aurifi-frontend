<script lang="ts">
	import { Button, Checkbox, Label, Modal, Select } from 'flowbite-svelte';
	import { CurrencyFormatModal } from '../../store/toogleModal.svelte';
	import { VITE_API_URL } from '$lib/constants';

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

	let selected = $state(null);
	let convert_to_int = $state(false);
	let submitStatus = $state(false);

	const handleSubmit = async () => {
		if (!convert_to_int || !selected) {
			alert('Please select both "Convert to whole number" and a rounding option.');
			return;
		}

		const payload = {
			version_id: v_id,
			column_name: currency_columns[0]?.column_name || 'N/A',
			convert_to_int: convert_to_int,
			round_off_using: selected
		};

		try {
			// Select API endpoint based on isTransaction flag
			const apiEndpoint = isTransaction
				? `${VITE_API_URL}/transaction_dataset/update_currency_colum`
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
		}
	};
</script>

<Modal title="Fix Currency" bind:open={CurrencyFormatModal.isCurrencyFormatModalOpen} size="sm">
	<div class="flex h-full w-full flex-col gap-8 p-4">
		<span class="flex items-center gap-2">
			<Label class="w-[40%]">Convert to whole number:</Label>
			<Checkbox bind:checked={convert_to_int}></Checkbox>
		</span>
		{#if convert_to_int}
			<span class="flex items-center">
				<Label class="w-[40%]">Round off:</Label>
				<Select items={options} bind:value={selected} />
			</span>
		{/if}
		<div class="flex w-full items-center justify-end">
			{#if convert_to_int && selected}
				{#if submitStatus}
					<Button color="green">Done</Button>
				{:else}
					<Button color="dark" on:click={handleSubmit}>Update Format</Button>
				{/if}
			{:else}
				<Button color="dark" disabled>Update Format</Button>
			{/if}
		</div>
	</div>
</Modal>
