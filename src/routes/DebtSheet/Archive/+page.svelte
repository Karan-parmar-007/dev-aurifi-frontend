<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Tooltip
	} from 'flowbite-svelte';
	import Header from '$lib/components/Header.svelte';

	let isloading = $state(true);
	let files = $state([]);
	let errorMessage = $state('');
	import { user_id, VITE_API_URL } from '$lib/constants';

	// Fetch all archives for the user
	async function fetchArchives() {
		isloading = true;
		errorMessage = '';
		try {
			const response = await fetch(
				`${VITE_API_URL}/archive_debt_sheet/get_archives/${user_id}`
			);
			const data = await response.json();
			if (data.status === 'success') {
				files = data.archives;
			} else {
				errorMessage = 'Failed to load archives';
			}
		} catch (error) {
			errorMessage = 'Error fetching archives: ' + error.message;
		} finally {
			isloading = false;
		}
	}

	// Restore project from archive
	async function restoreProject(archiveId: string) {
		isloading = true;
		errorMessage = '';
		try {
			const response = await fetch(
				`${VITE_API_URL}/archive_debt_sheet/revert_project_back_from_archive`,
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
				errorMessage = 'Failed to restore project';
			}
		} catch (error) {
			errorMessage = 'Error restoring project: ' + error.message;
		} finally {
			isloading = false;
		}
	}

	// Delete project permanently from archive
	async function deleteProjectPermanently(archiveId: string, fileName: string) {
		if (!confirm(`Are you sure you want to permanently delete "${fileName}"?`)) return;
		isloading = true;
		errorMessage = '';
		try {
			console.log('Deleting project with archiveId:', archiveId);
			const response = await fetch(
				`${VITE_API_URL}/archive_debt_sheet/delete_permanently_from_archive`,
				{
					method: 'DELETE', // Using POST based on previous discussion; adjust to 'DELETE' if needed
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						archive_id: archiveId
					})
				}
			);
			console.log('Response status:', response.status);
			const data = await response.json();
			console.log('Response data:', data);
			if (data.status === 'success') {
				alert('Project deleted permanently');
				await fetchArchives(); // Refresh the list after deletion
			} else {
				errorMessage = `Failed to delete project: ${data.message || 'Unknown error'}`;
			}
		} catch (error) {
			console.error('Error in deleteProjectPermanently:', error);
			errorMessage = 'Error deleting project: ' + error.message;
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

<Header />

<div class="flex h-[100vh] w-full flex-col items-center justify-center pt-12">
	<div class="flex h-[85%] w-[90%] items-center justify-center rounded-3xl bg-gray-100">
		{#if isloading}
			<div class="flex items-center justify-center">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
				></div>
				<span class="ml-2">Loading...</span>
			</div>
		{:else if errorMessage}
			<p class="text-red-500">{errorMessage}</p>
		{:else if files && files.length != 0}
			<div class="h-full w-full">
				<Table divClass={'w-[98%] mx-auto'} class="border-separate border-spacing-y-2">
					<TableHead class="bg-transparent">
						<TableHeadCell>Sheet Name</TableHeadCell>
						<TableHeadCell>Date Created</TableHeadCell>
						<TableHeadCell>Archived At</TableHeadCell>
						<TableHeadCell></TableHeadCell>
					</TableHead>
					<TableBody tableBodyClass="divide-y">
						{#each files as item}
							<TableBodyRow>
								<TableBodyCell class="rounded-md">
									<span class="flex items-center">
										<img src="/excel.png" width="40" alt="" />
										{item.name}
									</span>
								</TableBodyCell>
								<TableBodyCell>
									{`Created on: ${formatDate(item.created_at)}`}
								</TableBodyCell>
								<TableBodyCell>
									{`Archived on: ${formatDate(item.archived_at)}`}
								</TableBodyCell>
								<TableBodyCell class="rounded-md bg-transparent">
									<span class="flex items-center justify-end gap-6">
										<Tooltip arrow={false} class="bg-white text-black" triggeredBy="#disable-arrow"
											>Restore File</Tooltip
										>
										<button
											aria-label="restore project"
											class="hover:cursor-pointer"
											id="disable-arrow"
											onclick={() => restoreProject(item._id)}
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
												><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path
													d="M3 3v5h5"
												/></svg
											>
										</button>
										<button
											aria-label="delete permanently"
											class="hover:cursor-pointer"
											onclick={() => deleteProjectPermanently(item._id, item.name)}
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
