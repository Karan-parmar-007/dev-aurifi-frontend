<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import BreadCrumb from '$lib/components/BreadCrumb.svelte';
	import PriviewModal from '$lib/components/PriviewModal.svelte';
	import { Button, Checkbox, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { ArrowLeftOutline } from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';
	import { PreviewModal } from '../../../../store/toogleModal.svelte';
	import { browser } from '$app/environment';
	import { VITE_API_URL } from '$lib/constants';

	let currentPath = page.url.pathname;
	let urlParts = currentPath.split('/');
	let project_id = urlParts[3];

	let progressCompleted = $state(false);

	let fileData = $state([]);
	let isloading = $state(false);
	let finalized_files = $state([]);
	let processCompleted = $state(false);
	let combinedFilePath = $state(''); // New state for combined file path

	let selectedTag = $state('');
	let currentFile = $state('');

	// Computed state to sort the data with untagged items at the end
	let sortedFileData = $derived.by(() => {
		const data = [...fileData];
		return data.sort((a, b) => {
			if (a.tag_name.toLowerCase() === 'untagged') return 1;
			if (b.tag_name.toLowerCase() === 'untagged') return -1;
			return 0;
		});
	});

	$effect(() => {
		$inspect('sortedFileData: ', sortedFileData);
	});

	const fetchData = async () => {
		try {
			isloading = true;
			const response = await fetch(
				`${VITE_API_URL}/dataset/fetch_data_after_applied_rules?project_id=${project_id}`
			);

			if (!response.ok) {
				console.log('error fetching data: ', response);
				throw new Error('Error fetching files');
			}

			const data = await response.json();
			console.log('data: ', data);

			if (data.status === 'success') {
				fileData = data.versions.map((item: any) => ({
					...item,
					tag_type: item.tag_type === 'unknown' ? 'untagged' : item.tag_type
				}));
			}
			isloading = false;
		} catch (error) {
			console.log('Error: ', error);
			isloading = false;
		}
	};

	const checkProcessStatus = async () => {
		try {
			isloading = true;
			const response = await fetch(
				`${VITE_API_URL}/dataset/check_completion_status?project_id=${project_id}`
			);

			if (!response.ok) {
				console.log('error fetching process status: ', response);
				throw new Error('Error fetching process status!');
			}

			const data = await response.json();
			if (data.status === 'success') {
				processCompleted = data.is_complete;
				if (processCompleted === true) {
					processCompleted = true;
					await fetchFinalFiles();
				} else {
					processCompleted = false;
					await fetchData();
				}
			}
			isloading = false;
		} catch (error) {
			console.log('Error', error);
			isloading = false;
		}
	};

	const fetchFinalFiles = async () => {
		try {
			isloading = true;
			const response = await fetch(
				`${VITE_API_URL}/dataset/get_finalized_data?project_id=${project_id}`
			);

			if (!response.ok) {
				console.log('error fetching data: ', response);
				throw new Error('Error fetching files');
			}

			const data = await response.json();
			if (data.status === 'success') {
				fileData = data.versions.map((item: any) => ({
					...item,
					tag_type: item.tag_type === 'unknown' ? 'untagged' : item.tag_type
				}));
				combinedFilePath = data.combined_file.file_path; // Store the combined file path
			}
			console.log('final data: ', data);

			isloading = false;
		} catch (error) {
			console.log('Error: ', error);
			isloading = false;
		}
	};

	const finalizeRules = async () => {
		try {
			isloading = true;
			const response = await fetch(`${VITE_API_URL}/dataset/finalize_temp_versions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ project_id: project_id })
			});

			if (!response.ok) {
				console.log('error fetching data: ', response);
				throw new Error('Error fetching files');
			}

			const data = await response.json();
			if (data.status === 'success') {
				finalized_files = data.final_versions;
				processCompleted = true;
			}
			await fetchFinalFiles();
			isloading = false;
		} catch (error) {
			console.log('Error: ', error);
			isloading = false;
			processCompleted = false;
		}
	};

	onMount(async () => {
		if (browser) {
			currentFile = localStorage.getItem('currentFile') || 'No file selected';
		}
		await checkProcessStatus();
	});

	const downloadFile = async (file_path: string) => {
		try {
			console.log('file path:', file_path);
			// Use query parameter instead of path parameter
			const downloadUrl = `${VITE_API_URL}/project/download_file?file_path=${encodeURIComponent(file_path)}`;
			console.log('Download URL:', downloadUrl);

			// Fetch the file with proper headers
			const response = await fetch(downloadUrl, {
				method: 'GET'
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

	const handleDownloadCombined = async () => {
		if (combinedFilePath) {
			await downloadFile(combinedFilePath);
		} else {
			console.error('No combined file path available');
		}
	};

	const handleDownloadOption = async (option: string, file_path: string) => {
		try {
			// Fetch the tracking files metadata (which is JSON)
			let api_url = `${VITE_API_URL}/dataset/fetch_data_after_applied_rules?project_id=${project_id}`;
			if (processCompleted) {
				api_url = `${VITE_API_URL}/dataset/get_finalized_data?project_id=${project_id}`;
			}
			const response = await fetch(`${api_url}`);
			if (!response.ok) {
				console.error('Error fetching data:', response.status, response.statusText);
				return;
			}
			const data = await response.json();
			if (data.status !== 'success') {
				console.error('Invalid response status:', data.status);
				return;
			}

			const { versions, tracking_files } = data;
			console.log('versions', versions);
			console.log('tracking_files', tracking_files);
			const rowsAddedFiles = tracking_files?.rows_added_files || [];
			const rowsRemovedFiles = tracking_files?.rows_removed_files || [];

			switch (option) {
				case 'Download All': {
					const version = versions.find(
						(v: any) => v.tag_name.toLowerCase() === selectedTag.toLowerCase()
					);
					if (version?.file_path) {
						await downloadFile(version.file_path);
					}

					const addedFile = rowsAddedFiles.find(
						(f: any) => f.tag_name.toLowerCase() === selectedTag.toLowerCase()
					);
					if (addedFile?.file_location) {
						await downloadFile(addedFile.file_location);
					}

					const removedFile = rowsRemovedFiles.find(
						(f: any) => f.tag_name.toLowerCase() === selectedTag.toLowerCase()
					);
					if (removedFile?.file_location) {
						await downloadFile(removedFile.file_location);
					}
					break;
				}
				case 'Current': {
					console.log('finding with data: ', selectedTag);
					console.log('finding with version: ', versions);

					const version = versions.find(
						(v: any) => v.tag_name.toLowerCase() === selectedTag.toLowerCase()
					);
					if (version?.file_path) {
						await downloadFile(version.file_path);
					} else {
						console.error(`No current file found for tag: ${selectedTag}`);
					}
					break;
				}
				case 'Inserted': {
					const addedFile = rowsAddedFiles.find(
						(f: any) => f.tag_name.toLowerCase() === selectedTag.toLowerCase()
					);
					if (addedFile?.file_location) {
						await downloadFile(addedFile.file_location);
					} else {
						console.error(`No inserted file found for tag: ${selectedTag}`);
					}
					break;
				}
				case 'Ejected': {
					const removedFile = rowsRemovedFiles.find(
						(f: any) => f.tag_name.toLowerCase() === selectedTag.toLowerCase()
					);
					if (removedFile?.file_location) {
						await downloadFile(removedFile.file_location);
					} else {
						console.error(`No ejected file found for tag: ${selectedTag}`);
					}
					break;
				}
				default:
					console.error('Unknown download option:', option);
			}
		} catch (error) {
			console.error('Error in handleDownloadOption:', error);
			alert('Failed to process download. Please try again.');
		}
	};

	const redoTagging = async () => {
		try {
			isloading = true;
			const response = await fetch(`${VITE_API_URL}/dataset/disable_rule_addition_for_project`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ project_id: project_id })
			});

			if (!response.ok) {
				throw new Error(` Error redirecting: ${response}`);
			}
			goto(`/DebtSheet/Tagging/${project_id}`);
		} catch (error) {
			console.log('Error: ', error);
		} finally {
			isloading = false;
		}
	};
</script>

{#if PreviewModal.isPreviewModalOpen && selectedTag !== ''}
	<PriviewModal {selectedTag} />
{/if}

<div class="flex h-[100vh] w-full flex-col">
	<div class="flex w-full items-center gap-4 px-16 pt-14">
		<!-- Breadcrumb -->
		<svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M20.4338 8.69904C20.4333 8.69858 20.4329 8.69812 20.4324 8.69766L11.866 0.539551C11.5009 0.19165 11.0154 0 10.4991 0C9.98268 0 9.49722 0.191498 9.13193 0.539398L0.570075 8.69339C0.567191 8.69614 0.564307 8.69904 0.561423 8.70178C-0.188394 9.42001 -0.187112 10.5853 0.565108 11.3017C0.908774 11.6292 1.36267 11.8188 1.84797 11.8387C1.86767 11.8405 1.88754 11.8414 1.90757 11.8414H2.24899V17.8453C2.24899 19.0334 3.26397 20 4.51174 20H7.86317C8.20283 20 8.4784 19.7377 8.4784 19.4141V14.707C8.4784 14.1649 8.94143 13.7239 9.51068 13.7239H11.4874C12.0567 13.7239 12.5197 14.1649 12.5197 14.707V19.4141C12.5197 19.7377 12.7951 20 13.135 20H16.4864C17.7342 20 18.7491 19.0334 18.7491 17.8453V11.8414H19.0657C19.5819 11.8414 20.0674 11.6499 20.4329 11.302C21.1859 10.5844 21.1862 9.41711 20.4338 8.69904Z"
				fill="#242C3E"
			/>
		</svg>
		<h1 class="text-xl font-semibold">{currentFile}</h1>
	</div>
	<div class="h-full px-20">
		<BreadCrumb />
		<div class="flex flex-col gap-1 px-10">
			<h2 class="font-semibold">Retagged items</h2>
			<span class="flex items-center justify-between gap-6 pb-6 font-normal">
				<p class="text-sm text-gray-500">We have Retagged and separated the debt sheet</p>
				{#if sortedFileData.length != 0 && processCompleted === true}
					<div class="flex gap-6">
						<Button
							color="dark"
							class=""
							onclick={() => {
								handleDownloadCombined();
							}}>Download</Button
						>
					</div>
				{/if}
				{#if sortedFileData.length != 0 && processCompleted === false}
					<div class="flex gap-6">
						<Button
							color="dark"
							class=""
							on:click={() => {
								finalizeRules();
							}}>Save</Button
						>
					</div>
				{/if}
			</span>
			{#if isloading}
				<div class="flex items-center justify-center p-10">
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
					></div>
					<span class="ml-3">Loading...</span>
				</div>
			{:else if sortedFileData.length != 0}
				{#each sortedFileData as file}
					<div
						class={`mb-2 flex h-auto min-h-16 w-full items-center justify-between rounded-xl border border-gray-200 p-2 ${file.tag_name.toLowerCase() === 'untagged' ? 'bg-gray-300' : ''}`}
					>
						<div class="flex h-full w-[25%] items-center justify-between px-4">
							<div class="flex items-center font-medium">
								<img src="/excel.png" alt="excel icon" width="40" />
								<h2>{file.tag_name}</h2>
							</div>
							<div class="flex justify-start text-[13px] font-semibold text-[#242C3E]">
								Entries: {file.rows_count}
							</div>
						</div>
						<div class="flex h-full w-[35%] justify-start gap-2">
							<!-- {#if file.tag_type !== 'static'} -->
							<div class="flex gap-4 px-4 text-[13px] font-semibold">
								<span>{`+${file.rows_added}  -${file.rows_removed}`}</span>
								<span>{`Total Value: ${file.loan_amount_total}`}</span>
							</div>
							<!-- {/if} -->
						</div>
						<div class="flex h-full w-[30%] items-center justify-between">
							<span class="flex flex-1 items-center justify-center gap-2 text-[12px] font-bold">
								<svg
									width="12"
									height="12"
									viewBox="0 0 12 12"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M5.58496 0.900391C5.92537 0.900391 6.25329 1.03484 6.49414 1.27637L10.7236 5.50684H10.7246L10.8096 5.60059C10.9966 5.82899 11.0995 6.11628 11.0996 6.41406C11.0996 6.7544 10.9651 7.08145 10.7246 7.32227H10.7236L7.32227 10.7236V10.7246C7.08145 10.9651 6.7544 11.0996 6.41406 11.0996C6.0739 11.0995 5.74754 10.965 5.50684 10.7246V10.7236L1.27637 6.49414C1.18685 6.40468 1.11123 6.30259 1.05176 6.19141L0.998047 6.07715C0.933444 5.92124 0.900378 5.75373 0.900391 5.58496V2.18457C0.900391 1.47554 1.47554 0.900391 2.18457 0.900391H5.58496ZM2.1582 2.12012L2.13574 2.13574C2.12276 2.14873 2.11523 2.16622 2.11523 2.18457V5.58594C2.11526 5.5949 2.11668 5.60397 2.12012 5.6123L2.13574 5.63477L6.36523 9.86426L6.3877 9.87988L6.41406 9.88477C6.42334 9.88477 6.43315 9.88331 6.44141 9.87988L6.46387 9.86426L9.86426 6.46387L9.87988 6.44141L9.88477 6.41406L9.87988 6.3877L9.86426 6.36523L5.63477 2.13574L5.6123 2.12012C5.60397 2.11668 5.5949 2.11526 5.58594 2.11523H2.18457C2.17553 2.11523 2.16642 2.11677 2.1582 2.12012ZM4.38379 3.60742C4.58982 3.60742 4.78791 3.68929 4.93359 3.83496L4.98535 3.8916C5.0985 4.02974 5.16107 4.20366 5.16113 4.38379C5.16113 4.56388 5.09838 4.73782 4.98535 4.87598L4.93359 4.93359C4.78791 5.07927 4.58982 5.16113 4.38379 5.16113C4.20366 5.16107 4.02974 5.0985 3.8916 4.98535L3.83496 4.93359C3.68929 4.78791 3.60742 4.58982 3.60742 4.38379C3.6075 4.17786 3.68935 3.98058 3.83496 3.83496L3.8916 3.7832C4.02978 3.66995 4.20357 3.60749 4.38379 3.60742Z"
										fill="#37352F"
										stroke="#37352F"
										stroke-width="0.2"
									/>
								</svg>
								<p>{file.tag_type}</p>
							</span>
							<span class="mr-4 flex items-center justify-around gap-6">
								<Button
									color="blue"
									class="h-9 w-36 rounded-xl"
									onclick={() => {
										selectedTag = file.tag_name;
										PreviewModal.isPreviewModalOpen = true;
									}}>Open</Button
								>
								<button class="dropdown-trigger" onclick={() => (selectedTag = file.tag_name)}>
									<svg
										width="17"
										height="17"
										class="cursor-pointer"
										viewBox="0 0 17 17"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M15.2544 1.74287C14.0951 0.583496 12.2291 0.583496 8.49717 0.583496C4.76521 0.583496 2.89924 0.583496 1.73987 1.74287C1.14019 2.34254 0.850698 3.13127 0.710938 4.26948C1.13105 3.80187 1.63584 3.41234 2.20267 3.12353C2.82135 2.80829 3.48381 2.68046 4.21731 2.62053C4.92595 2.56264 5.79791 2.56265 6.86409 2.56266H10.1302C11.1964 2.56265 12.0684 2.56264 12.777 2.62053C13.5106 2.68046 14.173 2.80829 14.7916 3.12353C15.3585 3.41234 15.8633 3.80187 16.2834 4.26948C16.1436 3.13127 15.8541 2.34254 15.2544 1.74287Z"
											fill="#0161DB"
										/>
										<path
											fill-rule="evenodd"
											clip-rule="evenodd"
											d="M0.582031 10.0833C0.582031 7.86643 0.582031 6.75802 1.01347 5.91129C1.39296 5.16648 1.99851 4.56093 2.74332 4.18143C3.59006 3.75 4.69849 3.75 6.91536 3.75H10.082C12.2989 3.75 13.4073 3.75 14.2541 4.18143C14.9989 4.56093 15.6045 5.16648 15.9839 5.91129C16.4154 6.75802 16.4154 7.86643 16.4154 10.0833C16.4154 12.3002 16.4154 13.4087 15.9839 14.2554C15.6045 15.0002 14.9989 15.6058 14.2541 15.9852C13.4073 16.4167 12.2989 16.4167 10.082 16.4167H6.91536C4.69849 16.4167 3.59006 16.4167 2.74332 15.9852C1.99851 15.6058 1.39296 15.0002 1.01347 14.2554C0.582031 13.4087 0.582031 12.3002 0.582031 10.0833ZM8.91852 12.8782C8.80721 12.9895 8.65616 13.0521 8.4987 13.0521C8.34124 13.0521 8.19019 12.9895 8.07888 12.8782L6.09969 10.899C5.86782 10.6671 5.86782 10.2912 6.09969 10.0593C6.33156 9.82747 6.7075 9.82747 6.93935 10.0593L7.90495 11.0249V7.70833C7.90495 7.38042 8.17079 7.11458 8.4987 7.11458C8.82661 7.11458 9.09245 7.38042 9.09245 7.70833V11.0249L10.058 10.0593C10.2899 9.82747 10.6658 9.82747 10.8977 10.0593C11.1296 10.2912 11.1296 10.6671 10.8977 10.899L8.91852 12.8782Z"
											fill="#0161DB"
										/>
									</svg>
									<Dropdown class="w-40">
										<DropdownItem
											onclick={() => handleDownloadOption('Download All', file.file_path)}
										>
											Download All
										</DropdownItem>
										<DropdownItem onclick={() => handleDownloadOption('Current', file.file_path)}>
											Current
										</DropdownItem>
										<DropdownItem onclick={() => handleDownloadOption('Inserted', file.file_path)}>
											Inserted
										</DropdownItem>
										<DropdownItem onclick={() => handleDownloadOption('Ejected', file.file_path)}>
											Ejected
										</DropdownItem>
									</Dropdown>
								</button>
							</span>
						</div>
					</div>
				{/each}
				<div
					class={`mt-10 flex w-full items-center ${processCompleted ? 'justify-end' : 'justify-between'}`}
				>
					{#if sortedFileData.length != 0 && processCompleted === false}
						<Button color="dark" class="" on:click={() => redoTagging()}>
							<span class="flex items-center gap-2"><ArrowLeftOutline /> Redo Tagging</span>
						</Button>
					{/if}

					{#if processCompleted === true}
						<Button
							color="dark"
							class="w-sm"
							on:click={() => {
								goto('/Transactions');
							}}
						>
							+ Add untagged items to Transaction list
						</Button>
					{/if}
				</div>
			{:else}
				<div class="flex items-center justify-center">No Data</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.dropdown-trigger {
		display: inline-flex;
		align-items: center;
	}
</style>
