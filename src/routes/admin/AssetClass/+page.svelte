<script lang="ts">
	import {
		Button,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import { assetClassModal } from '../../../store/toogleModal.svelte';
	import { VITE_API_URL } from '$lib/constants';
	import AddAssetClassModalForm from '$lib/components/AddAssetClassModalForm.svelte';

	let errorMessage = $state('');
	let { data } = $props();
	console.log('load data: ', data);

	// Define the AssetClass type
	interface AssetClass {
		_id: string;
		name: string;
		created_at: string;
		updated_at: string;
	}

	async function handleDelete(id: string, className: string) {
		if (confirm(`Are you sure you want to delete "${className}" class ?`)) {
			try {
				const response = await fetch(`${VITE_API_URL}/admin/delete_asset_class/${id}`, {
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json'
					}
				});

				if (!response.ok) {
					console.log('error deleting column:', response);
					errorMessage = 'Failed to delete column. Please try again.';
					return;
				}

				const result = await response.json();
				fetchData();
			} catch (error) {
				console.log(error);
				errorMessage = `Error: ${error}`;
			}
		}
	}

	async function fetchData() {
		try {
			const response = await fetch(`${VITE_API_URL}/admin/get_asset_classes`);

			if (!response.ok) {
				console.log('response is not ok', response);
			}

			data = await response.json();
			console.log('initial load data: ', data);
		} catch (error) {
			console.error('Error loading files:', error);
			data = [];
		}
	}

	// State to hold the asset class being edited
	let selectedAssetClass = $state<AssetClass | null>(null);

	// Function to open modal for editing
	function openEditModal(assetClass: AssetClass) {
		selectedAssetClass = assetClass;
		assetClassModal.isAssetClassModalOpen = true;
	}
</script>

<div class="flex w-full flex-col items-center justify-center">
	<div class="h-[80%] w-[92%] py-10">
		{#if errorMessage}
			<div class="error-message mb-4 rounded bg-red-100 p-3 text-red-700">
				{errorMessage}
			</div>
		{/if}

		{#if data?.data?.length > 0}
			<div class="h-full w-full">
				<Table>
					<TableHead>
						<TableHeadCell>Class Name</TableHeadCell>
						<TableHeadCell>Created At</TableHeadCell>
						<TableHeadCell>Updated At</TableHeadCell>
						<TableHeadCell>Actions</TableHeadCell>
					</TableHead>
					<TableBody>
						{#each data.data as column, index}
							<TableBodyRow>
								<TableBodyCell>{column.name}</TableBodyCell>
								<TableBodyCell>{column.created_at}</TableBodyCell>
								<TableBodyCell>{column.updated_at}</TableBodyCell>
								<TableBodyCell>
									<div class="form-group">
										<Button color="dark" onclick={() => openEditModal(column)}>Edit</Button>
										<Button color="dark" onclick={() => handleDelete(column._id, column.name)}>
											Delete
										</Button>
									</div>
								</TableBodyCell>
							</TableBodyRow>
						{/each}
					</TableBody>
				</Table>
				<hr class="my-4" />
			</div>
		{:else}
			<p>No columns</p>
		{/if}
	</div>
</div>

{#if assetClassModal.isAssetClassModalOpen === true}
	<AddAssetClassModalForm {fetchData} assetClass={selectedAssetClass} />
{/if}
