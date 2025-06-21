<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Tooltip
	} from 'flowbite-svelte';
	import TransactionHeader from '$lib/components/TransactionHeader.svelte';

	let isloading = $state(true);
	let archives = $state([]);
	let errorMessage = $state('');
	import { user_id, VITE_API_URL } from '$lib/constants';
	let transactionIdToArchive = $state(''); // State for transaction ID to archive

	// Fetch all archived transactions for the user
	async function fetchArchives() {
		isloading = true;
		errorMessage = '';
		try {
			const response = await fetch(
				`${VITE_API_URL}/archive_transaction/get_transaction_archives/${user_id}`
			);
			const data = await response.json();
			if (data.status === 'success') {
				archives = data.archives;
			} else {
				errorMessage = 'Failed to load archived transactions';
			}
		} catch (error) {
			errorMessage = 'Error fetching archives: ' + error.message;
		} finally {
			isloading = false;
		}
	}

	// Send a transaction to the archive
	async function sendToArchive() {
		if (!transactionIdToArchive) {
			errorMessage = 'Please enter a Transaction ID to archive';
			return;
		}
		isloading = true;
		errorMessage = '';
		try {
			const response = await fetch(
				`${VITE_API_URL}/archive_transaction/send_transaction_to_archive`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						user_id: user_id,
						transaction_id: transactionIdToArchive
					})
				}
			);
			const data = await response.json();
			if (data.status === 'success') {
				alert(data.message);
				transactionIdToArchive = ''; // Reset input
				await fetchArchives(); // Refresh the list after archiving
			} else {
				errorMessage = 'Failed to archive transaction: ' + (data.message || 'Unknown error');
			}
		} catch (error) {
			errorMessage = 'Error archiving transaction: ' + error.message;
		} finally {
			isloading = false;
		}
	}

	// Restore transaction from archive
	async function restoreTransaction(archiveId: string) {
		isloading = true;
		errorMessage = '';
		try {
			const response = await fetch(
				`${VITE_API_URL}/archive_transaction/revert_transaction_back_from_archive`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						archive_id: archiveId
					})
				}
			);
			const data = await response.json();
			if (data.status === 'success') {
				alert(data.message);
				await fetchArchives(); // Refresh the list after restoring
			} else {
				errorMessage = 'Failed to restore transaction: ' + (data.message || 'Unknown error');
			}
		} catch (error) {
			errorMessage = 'Error restoring transaction: ' + error.message;
		} finally {
			isloading = false;
		}
	}

	// Delete transaction permanently from archive
	async function deleteTransactionPermanently(archiveId: string, fileName: string) {
		if (!confirm(`Are you sure you want to permanently delete "${fileName}"?`)) return;
		isloading = true;
		errorMessage = '';
		try {
			const response = await fetch(
				`${VITE_API_URL}/archive_transaction/delete_permanently_from_archive`,
				{
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						archive_id: archiveId
					})
				}
			);
			const data = await response.json();
			if (data.status === 'success') {
				alert(data.message);
				await fetchArchives(); // Refresh the list after deletion
			} else {
				errorMessage = 'Failed to delete transaction: ' + (data.message || 'Unknown error');
			}
		} catch (error) {
			errorMessage = 'Error deleting transaction: ' + error.message;
		} finally {
			isloading = false;
		}
	}

	// Format date for display
	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
	}

	// Fetch archives on mount
	onMount(() => {
		if (browser) {
			fetchArchives();
		}
	});
</script>

<TransactionHeader />

<div class="flex h-[100vh] w-full flex-col items-center justify-center pt-12">
	<div class="flex h-[85%] w-[90%] items-center justify-center rounded-3xl bg-gray-100">
		{#if isloading}
			<div class="flex items-center justify-center">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
				></div>
				<span class="ml-2">Loading...</span>
			</div>
		{:else if archives && archives.length != 0}
			<div class="h-full w-full">
				<Table divClass={'w-[98%] mx-auto'} class="border-separate border-spacing-y-2">
					<TableHead class="bg-transparent">
						<TableHeadCell>Transaction Name</TableHeadCell>
						<TableHeadCell>Date Created</TableHeadCell>
						<TableHeadCell>Archived At</TableHeadCell>
						<TableHeadCell>Primary Asset Class</TableHeadCell>
						<TableHeadCell>Secondary Asset Class</TableHeadCell>
						<TableHeadCell></TableHeadCell>
					</TableHead>
					<TableBody tableBodyClass="divide-y">
						{#each archives as item}
							<TableBodyRow>
								<TableBodyCell class="rounded-md">
									<span class="flex items-center">
										<img src="/excel.png" width="40" alt="Excel icon" />
										{item.name}
									</span>
								</TableBodyCell>
								<TableBodyCell>
									{`Created on: ${formatDate(item.created_at)}`}
								</TableBodyCell>
								<TableBodyCell>
									{`Archived on: ${formatDate(item.archived_at)}`}
								</TableBodyCell>
								<TableBodyCell>
									{item.primary_asset_class}
								</TableBodyCell>
								<TableBodyCell>
									{item.secondary_asset_class}
								</TableBodyCell>
								<TableBodyCell class="rounded-md bg-transparent">
									<span class="flex items-center justify-end gap-6">
										<Tooltip arrow={false} class="bg-white text-black" triggeredBy="#disable-arrow"
											>Restore Transaction</Tooltip
										>
										<button
											aria-label="restore transaction"
											class="hover:cursor-pointer"
											id="disable-arrow"
											onclick={() => restoreTransaction(item._id)}
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="24"
												height="24"
												viewBox="0 0 24 24"
												fill="none"
												stroke="#b8b8b8"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												class="lucide lucide-rotate-ccw-icon lucide-rotate-ccw"
											>
												<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
												<path d="M3 3v5h5" />
											</svg>
										</button>
										<button
											aria-label="delete permanently"
											class="hover:cursor-pointer"
											onclick={() => deleteTransactionPermanently(item._id, item.name)}
										>
											<svg
												width="14"
												height="17"
												viewBox="0 0 14 17"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
												class="button-group"
											>
												<path
													d="M0.962402 15.1112C0.962402 16.1548 1.82382 17.0001 2.8874 17.0001H10.5874C11.6509 17.0001 12.5123 16.1548 12.5123 15.1112V3.77783H0.962402V15.1112Z"
													fill="black"
													fill-opacity="0.28"
												/>
												<path
													d="M10.1062 0.94443L9.14365 0H4.33122L3.3687 0.94443H0V2.83333H13.4749V0.94443H10.1062Z"
													fill="black"
													fill-opacity="0.28"
												/>
											</svg>
										</button>
									</span>
								</TableBodyCell>
							</TableBodyRow>
						{/each}
					</TableBody>
				</Table>
			</div>
		{:else}
			<p class="opacity-50">Nothing in Archive</p>
		{/if}
	</div>
</div>
