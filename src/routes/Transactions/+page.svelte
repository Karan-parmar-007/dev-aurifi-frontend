<script lang="ts">
	import TransactionHeader from '$lib/components/TransactionHeader.svelte';
	import { onMount } from 'svelte';
	import {
		breakDownBar,
		breakdownTransactionID,
		modal,
		transactionModal
	} from '../../store/toogleModal.svelte';
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import ImportTransaction from '$lib/components/ImportTransaction.svelte';
	import { user_id, VITE_API_URL } from '$lib/constants';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';

	let { data } = $props();
	console.log('data: ', data);
	let files = $state([]);
	let archiveConfirmFile = $state('');
	let archiveConfirmProjectID = $state('');
	let showArchiveConfirm = $state(false);
	let customError = $derived(data.error);
	let isloading = $state(false);

	function setCurrentFile(fileName) {
		if (browser) {
			localStorage.setItem('currentFile', fileName);
		}
	}

	const fetchFiles = async () => {
		try {
			console.log('fetching files');
			isloading = true;
			const response = await fetch(`${VITE_API_URL}/transaction/get_all_transactions/${user_id}`);
			if (!response.ok) {
				console.error('Response not OK:', response.status, response.statusText);
				files = [];
				customError = 'Failed to fetch transactions';
				const data = await response.json();
				console.log('data: ', data);
				return;
			}

			const result = await response.json();
			if (result.status !== 'success') {
				console.error('API error:', result.message);
				files = [];
				customError = result.message || 'Error fetching transactions';
				return;
			}

			// Map API response to table structure
			files = result.transactions
				.map((transaction) => ({
					_id: transaction._id,
					name: transaction.name,
					updated_at: formatDate(transaction.updated_at),
					raw_updated_at: transaction.updated_at, // Store original date for sorting
					totalValue: transaction.total_loan_amount || 'N/A', // Placeholder if not available
					assetClass: `${transaction.primary_asset_class}, ${transaction.secondary_asset_class}`,
					entries: transaction.number_of_rows || 'N/A', // Placeholder if not available
					base_file_path: transaction.base_file_path,
					base_file_location: transaction.base_file_location
				}))
				.sort(
					(a, b) => new Date(b.raw_updated_at).getTime() - new Date(a.raw_updated_at).getTime()
				);
		} catch (error) {
			console.error('Error fetching transactions:', error);
			files = [];
			customError = error.message || 'An unexpected error occurred';
		} finally {
			isloading = false;
		}
	};

	onMount(() => {
		fetchFiles();
	});

	const formatDate = (timestamp) => {
		const date = new Date(timestamp);
		return date.toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	};

	const downloadFile = async (file_path: string) => {
		try {
			// Use query parameter instead of path parameter
			const downloadUrl = `${VITE_API_URL}/project/download_file?file_path=${encodeURIComponent(file_path)}`;
			console.log('Download URL:', downloadUrl);

			// Fetch the file with proper headers
			const response = await fetch(downloadUrl, {
				method: 'GET',
				headers: {
					// Add any authentication headers if needed
					// 'Authorization': `Bearer ${token}`
				}
			});

			if (!response.ok) {
				throw new Error(`Download failed: ${response.statusText}`);
			}

			// Create blob from response
			const blob = await response.blob();

			// Create temporary URL for the blob
			const blobUrl = window.URL.createObjectURL(blob);

			// Extract filename from path or use default
			const filename = file_path.split('/').pop() || 'download.xlsx';

			// Create temporary anchor element and trigger download
			const a = document.createElement('a');
			a.href = blobUrl;
			a.download = filename;
			a.style.display = 'none';
			document.body.appendChild(a);
			a.click();

			// Cleanup
			document.body.removeChild(a);
			window.URL.revokeObjectURL(blobUrl);

			console.log('Download completed successfully');
		} catch (error) {
			console.error('Error downloading file:', error);
			// You might want to show a toast/notification to the user here
			alert('Failed to download file. Please try again.');
		}
	};

	const confirmArchiveFile = (filename, project_id) => {
		archiveConfirmFile = filename;
		archiveConfirmProjectID = project_id;
		showArchiveConfirm = true;
	};

	const cancelArchive = () => {
		showArchiveConfirm = false;
		archiveConfirmFile = '';
		archiveConfirmProjectID = '';
	};

	const moveToArchive = async () => {
		if (!archiveConfirmProjectID) return;

		try {
			isloading = true;
			const response = await fetch(
				`${VITE_API_URL}/archive_transaction/send_transaction_to_archive`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						user_id: user_id,
						transaction_id: archiveConfirmProjectID
					})
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				console.error('Error archiving transaction:', errorData);
				customError = errorData.message || 'Failed to archive transaction';
				return;
			}

			const result = await response.json();
			console.log('Archive successful:', result);
			await fetchFiles();
			showArchiveConfirm = false;
			archiveConfirmFile = '';
			archiveConfirmProjectID = '';
		} catch (error) {
			console.error('Error archiving transaction:', error);
			customError = error.message || 'An unexpected error occurred';
		} finally {
			isloading = false;
		}
	};

	const navigateToNextStep = async (projectId: string, fileName: string) => {
		try {
			const response = await fetch(
				`${VITE_API_URL}/transaction/get_transaction_navigation/${projectId}`
			);
			if (!response.ok) {
				throw new Error('Failed to fetch project navigation');
			}
			const result = await response.json();
			if (result.status === 'success' && result.navigation) {
				const nextStep = result.navigation.route;
				setCurrentFile(fileName);
				console.log(nextStep);

				const stepToRouteMap = {
					'/transaction/upload-dataset': '/Transactions/file_overview',
					'/transaction/column-mapping': '/Transactions/column_mapping',
					'/transaction/datatype-conversion': '/Transactions/data_validation',
					'/transaction/add-fields': '/Transactions/add_fields',
					'/transaction/rbi-rules': '/Transactions/rbi_guidelines',
					'/transaction/rule-versions': '/Transactions/sanitised_data'
				};

				const route =
					`${stepToRouteMap[nextStep]}/${projectId}` || `/Transactions/file_overview/${projectId}`;

				// console.log(route);
				goto(route);
			}
		} catch (error) {
			console.error('Error fetching navigation:', error);
			// Fallback to original behavior
			goto(`/Transactions/file_overview/${projectId}`);
		}
	};
</script>

{#if transactionModal.isTransactionModalOpen}
	<div class="absolute z-10 flex h-[100vh] w-full items-center justify-center bg-[#00000091]">
		<ImportTransaction {fetchFiles} />
	</div>
{/if}
<TransactionHeader />
<div class="flex h-[100vh] w-full flex-col items-center justify-center pt-12">
	<div class="flex h-[85%] w-[90%] items-center justify-center rounded-3xl">
		{#if isloading}
			<div class="flex items-center justify-center">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
				></div>
				<span class="ml-2">Loading...</span>
			</div>
		{:else if files && files.length > 0}
			<div
				class="h-full w-full overflow-y-scroll [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
			>
				{#if showArchiveConfirm}
					<div class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
						<div class="w-96 rounded-lg bg-white p-6 shadow-lg">
							<h3 class="mb-4 text-lg font-medium">Confirm Archive</h3>
							<p class="mb-6">
								Are you sure you want to move "{archiveConfirmFile}" to the archive? This action can
								be undone later.
							</p>
							<div class="flex justify-end space-x-4">
								<button
									onclick={cancelArchive}
									class="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
								>
									Cancel
								</button>
								<button onclick={moveToArchive} class="rounded-lg bg-blue-600 px-4 py-2 text-white">
									Archive
								</button>
							</div>
						</div>
					</div>
				{/if}
				<!-- {#if customError}
					<div class="mb-4 rounded bg-red-100 p-2 text-red-700">{customError}</div>
				{/if} -->
				<Table divClass={'w-full'} class="border-separate border-spacing-y-2">
					<TableHead class="bg-transparent">
						<TableHeadCell>Name</TableHeadCell>
						<TableHeadCell>No. of Entries</TableHeadCell>
						<TableHeadCell>Asset Class</TableHeadCell>
						<TableHeadCell>Total Value</TableHeadCell>
						<TableHeadCell>Date Modified</TableHeadCell>
						<TableHeadCell></TableHeadCell>
						<TableHeadCell></TableHeadCell>
						<TableHeadCell></TableHeadCell>
					</TableHead>
					<TableBody tableBodyClass="divide-y">
						{#each files as item}
							<TableBodyRow class="bg-[#F9FAFB]">
								<TableBodyCell class="rounded-md">
									<span class="flex items-center">
										<img src="/excel.png" width="40" alt="Excel icon" />
										{item.name}
									</span>
								</TableBodyCell>
								<TableBodyCell>{item.entries}</TableBodyCell>
								<TableBodyCell>{item.assetClass}</TableBodyCell>
								<TableBodyCell>{item.totalValue}</TableBodyCell>
								<TableBodyCell>{item.updated_at}</TableBodyCell>
								<TableBodyCell>
									<button
										aria-label="continue session button"
										onclick={() => navigateToNextStep(item._id, item.name)}
										class="text-primaryBlue-100 flex cursor-pointer justify-end font-medium"
										>Continue Session</button
									>
								</TableBodyCell>
								<TableBodyCell>
									<button
										onclick={() => {
											breakdownTransactionID.transaction_id = item._id;
											breakDownBar.isBreakDownBarVisible = false;
										}}
										class="text-primaryBlue-100 flex cursor-pointer justify-end font-medium"
									>
										See Breakdown
									</button>
								</TableBodyCell>
								<TableBodyCell class="rounded-md">
									<span class="flex items-center justify-end gap-4">
										<button
											aria-label="Download file"
											onclick={() => downloadFile(item.base_file_location)}
										>
											<svg
												width="23"
												height="23"
												viewBox="0 0 23 23"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
												class="button-group"
											>
												<path
													d="M19.679 3.3202C18.2756 1.91675 16.0168 1.91675 11.4992 1.91675C6.98154 1.91675 4.72273 1.91675 3.31929 3.3202C2.59336 4.04612 2.24291 5.0009 2.07373 6.37873C2.58229 5.81268 3.19335 5.34114 3.87952 4.99152C4.62844 4.60992 5.43037 4.45518 6.31828 4.38264C7.17612 4.31255 8.23164 4.31256 9.52228 4.31258H13.476C14.7667 4.31256 15.8222 4.31255 16.68 4.38264C17.568 4.45518 18.3699 4.60992 19.1188 4.99152C19.8049 5.34114 20.4161 5.81268 20.9246 6.37873C20.7554 5.0009 20.405 4.04612 19.679 3.3202Z"
													fill="url(#paint0_linear_2026_2000)"
												/>
												<path
													fill-rule="evenodd"
													clip-rule="evenodd"
													d="M1.9165 13.4167C1.9165 10.733 1.9165 9.39129 2.43877 8.3663C2.89815 7.46469 3.63119 6.73165 4.5328 6.27226C5.5578 5.75 6.89959 5.75 9.58317 5.75H13.4165C16.1001 5.75 17.4419 5.75 18.4669 6.27226C19.3685 6.73165 20.1016 7.46469 20.5609 8.3663C21.0832 9.39129 21.0832 10.733 21.0832 13.4167C21.0832 16.1003 21.0832 17.4421 20.5609 18.4671C20.1016 19.3687 19.3685 20.1017 18.4669 20.561C17.4419 21.0833 16.1001 21.0833 13.4165 21.0833H9.58317C6.89959 21.0833 5.5578 21.0833 4.5328 20.561C3.63119 20.1017 2.89815 19.3687 2.43877 18.4671C1.9165 17.4421 1.9165 16.1003 1.9165 13.4167ZM12.008 16.7999C11.8733 16.9347 11.6904 17.0104 11.4998 17.0104C11.3092 17.0104 11.1264 16.9347 10.9916 16.7999L8.59577 14.404C8.31509 14.1233 8.31509 13.6683 8.59577 13.3876C8.87646 13.1069 9.33155 13.1069 9.61221 13.3876L10.7811 14.5564V10.5417C10.7811 10.1447 11.1029 9.82292 11.4998 9.82292C11.8968 9.82292 12.2186 10.1447 12.2186 10.5417V14.5564L13.3875 13.3876C13.6682 13.1069 14.1232 13.1069 14.4039 13.3876C14.6846 13.6683 14.6846 14.1233 14.4039 14.404L12.008 16.7999Z"
													fill="url(#paint1_linear_2026_2000)"
												/>
												<defs>
													<linearGradient
														id="paint0_linear_2026_2000"
														x1="15.9417"
														y1="16.6661"
														x2="11.8024"
														y2="1.98359"
														gradientUnits="userSpaceOnUse"
													>
														<stop stop-color="#0070FF" />
														<stop offset="1" stop-color="#015ED4" />
													</linearGradient>
													<linearGradient
														id="paint1_linear_2026_2000"
														x1="16.0168"
														y1="56.4352"
														x2="-11.1843"
														y2="27.888"
														gradientUnits="userSpaceOnUse"
													>
														<stop stop-color="#0070FF" />
														<stop offset="1" stop-color="#015ED4" />
													</linearGradient>
												</defs>
											</svg>
										</button>
										<button
											aria-label="archive file"
											onclick={() => confirmArchiveFile(item.name, item._id)}
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
			<p class="opacity-50">No Previous Transactions</p>
		{/if}
	</div>
</div>

<style>
	.button-group {
		cursor: pointer;
	}
</style>
