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
	import AdminAddColumnForm from '$lib/components/AdminAddColumnForm.svelte';
	import {
		systemColumnModal,
		TransactionsystemColumnModal
	} from '../../../store/toogleModal.svelte';
	import { VITE_API_URL } from '$lib/constants';
	import AdminAddTransactionColumn from '$lib/components/AdminAddTransactionColumn.svelte';

	let errorMessage = $state('');
	let { data } = $props();
	let editingColumn = $state(null);
	let purpose = $state<string | null>(null);

	async function handleDelete(id: string, columnName: string) {
		if (confirm(`Are you sure you want to delete column "${columnName}"?`)) {
			try {
				const response = await fetch(
					`${VITE_API_URL}/admin/delete_system_transaction_column/${id}`,
					{
						method: 'DELETE',
						headers: {
							'Content-Type': 'application/json'
						}
					}
				);

				if (!response.ok) {
					errorMessage = 'Failed to delete column. Please try again.';
					return;
				}

				await fetchData();
			} catch (error) {
				errorMessage = `Error: ${error.message}`;
			}
		}
	}

	async function fetchData() {
		try {
			const response = await fetch(`${VITE_API_URL}/admin/get_system_transaction_columns`);
			if (!response.ok) {
				console.error('Response not ok:', response);
				data = { data: [] };
				return;
			}
			data = await response.json();
		} catch (error) {
			console.error('Error loading files:', error);
			data = { data: [] };
		}
	}

	async function cleanup() {
		console.log('clenup called');
		purpose = null;
		editingColumn = null;
	}

	function openEditModal(column: any) {
		editingColumn = column;
		purpose = 'edit';
		TransactionsystemColumnModal.isTransactionSystemColumnModalOpen = true;
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
						<TableHeadCell>Column Name</TableHeadCell>
						<TableHeadCell>Description</TableHeadCell>
						<TableHeadCell>Alt Names</TableHeadCell>
						<TableHeadCell>Asset Class</TableHeadCell>
						<TableHeadCell>DataType</TableHeadCell>
						<TableHeadCell>General Mandatory</TableHeadCell>
						<TableHeadCell>Is Currency</TableHeadCell>
						<TableHeadCell>Actions</TableHeadCell>
					</TableHead>
					<TableBody>
						{#each data.data as column}
							<TableBodyRow>
								<TableBodyCell>{column.column_name}</TableBodyCell>
								<TableBodyCell>{column.description}</TableBodyCell>
								<TableBodyCell>
									<div class="alt-names-display">
										{#if column.alt_names}
											{#each Array.isArray(column.alt_names) ? column.alt_names : [column.alt_names] as altName}
												<span class="m-1 rounded-xl bg-gray-200 p-1.5">{altName}</span>
											{/each}
										{:else}
											<span class="text-gray-400">No alt names</span>
										{/if}
									</div>
								</TableBodyCell>
								<TableBodyCell>{column.asset_class}</TableBodyCell>
								<TableBodyCell>{column.datatype}</TableBodyCell>
								<TableBodyCell>{column.general_mandatory ? 'Yes' : 'No'}</TableBodyCell>
								<TableBodyCell>{column.is_currency ? 'Yes' : 'No'}</TableBodyCell>
								<TableBodyCell>
									<div class="form-group flex gap-2">
										<Button color="dark" onclick={() => openEditModal(column)}>Edit</Button>
										<Button
											color="dark"
											onclick={() => handleDelete(column._id, column.column_name)}
										>
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

		{#if TransactionsystemColumnModal.isTransactionSystemColumnModalOpen === true}
			<AdminAddTransactionColumn {editingColumn} {purpose} {fetchData} {cleanup} />
		{/if}
	</div>
</div>
