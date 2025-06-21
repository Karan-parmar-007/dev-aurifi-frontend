<script lang="ts">
	import { Button, Checkbox, Label, Modal, Select } from 'flowbite-svelte';
	import { NumberFormatModal } from '../../store/toogleModal.svelte';
	import { VITE_API_URL } from '$lib/constants';

	let {
		data: numericColumns,
		v_id,
		onUpdate,
		isTransaction = false
	} = $props<{
		data: { column_name: string; rows: { row_number: number; value: string }[] }[];
		v_id: string | number;
		onUpdate?: (status: { success: boolean; message?: string }) => void;
		isTransaction?: boolean; // Flag to determine API endpoint
	}>();

	console.log(numericColumns);

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
			column_name: numericColumns[0]?.column_name || 'N/A',
			convert_to_int: convert_to_int,
			round_off_using: selected
		};

		try {
			// Select API endpoint based on isTransaction flag
			const apiEndpoint = isTransaction
				? `${VITE_API_URL}/transaction_dataset/update_numeric_column`
				: `${VITE_API_URL}/dataset/update_numeric_column`;

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
			NumberFormatModal.isNumberFormatModalOpen = false; // Close the modal
			if (onUpdate) {
				onUpdate({
					success: true,
					message: `Numeric format updated successfully for ${payload.column_name}`
				});
			}
		} catch (error) {
			console.error('Error submitting numeric formats:', error);
			submitStatus = false;
			if (onUpdate) {
				onUpdate({
					success: false,
					message: `Failed to update numeric format for ${payload.column_name}`
				});
			}
			alert('Failed to update numeric format. Please try again.');
		}
	};
</script>

<Modal title="Fix Number" bind:open={NumberFormatModal.isNumberFormatModalOpen} size="sm">
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
