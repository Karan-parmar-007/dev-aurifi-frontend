<script lang="ts">
	import { Modal, Input, Button, Label } from 'flowbite-svelte';
	import { assetClassModal } from '../../store/toogleModal.svelte';
	import { VITE_API_URL } from '$lib/constants';

	// Props
	let { fetchData, assetClass } = $props<{
		fetchData: () => Promise<void>;
		assetClass: { _id: string; name: string } | null;
	}>();

	// Form state
	let className = $state(assetClass?.name || '');

	// Handle form submission
	async function handleSubmit() {
		try {
			const url = assetClass
				? `${VITE_API_URL}/admin/update_asset_class/${assetClass._id}`
				: `${VITE_API_URL}/admin/add_asset_class`;
			const method = assetClass ? 'PUT' : 'POST';

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name: className })
			});

			if (!response.ok) {
				throw new Error('Failed to save asset class');
			}

			assetClassModal.isAssetClassModalOpen = false;
			className = '';
			await fetchData();
		} catch (error) {
			console.error('Error saving asset class:', error);
		}
	}
</script>

<Modal bind:open={assetClassModal.isAssetClassModalOpen} title={assetClass ? 'Edit Asset Class' : 'Add Asset Class'}>
	<div class="flex flex-col items-center justify-center gap-6 p-4">
		<span class="flex w-[90%] flex-1 items-center justify-center gap-4">
			<Label for="className" class="text-nowrap">Class Name:</Label>
			<Input bind:value={className} placeholder="Enter Class Name" id="className" />
		</span>
		<span class="flex items-center justify-center">
			<Button color="dark" onclick={handleSubmit}>Save</Button>
		</span>
	</div>
</Modal>