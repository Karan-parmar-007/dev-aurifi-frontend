<script lang="ts">
	import BreadCrumb from '$lib/components/BreadCrumb.svelte';
	import {
		Button,
		Checkbox,
		Input,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { VITE_API_URL } from '$lib/constants';

	let pageUrl = $page.url.pathname;
	let urlParts = pageUrl.split('/');

	let tagGroups = $state([]);
	let selectedFiles = $state([]);
	let isloading = $state(false);
	let CustomError = $state([]);
	let currentFile = $state('');

	$effect(() => {
		console.log($state.snapshot(selectedFiles));
	});

	// Helper function to check if untagged is selected
	const isUntaggedSelected = () => {
		const untaggedTag = tagGroups.find((tag) => tag.tag_name === 'Untagged');
		return untaggedTag ? selectedFiles.includes(untaggedTag.version_id) : false;
	};

	const fetchData = async () => {
		try {
			isloading = true;
			const response = await fetch(
				`${VITE_API_URL}/dataset/get_split_files_info?project_id=${urlParts[3]}`
			);

			if (!response.ok) {
				isloading = false;
				CustomError = await response.json();
				return;
			}

			const data = await response.json();
			console.log(data);
			tagGroups = data.split_files_info;
			selectedFiles = data.split_files_info
				.filter((tag) => tag.tag_name === 'Untagged')
				.map((tag) => tag.version_id);
			isloading = false;
		} catch (error) {
			console.error('Error fetching data:', error);
			isloading = false;
		}
	};

	onMount(() => {
		if (browser) {
			currentFile = localStorage.getItem('currentFile') || 'No file selected';
		}
		fetchData();
	});

	const handleCheckboxChange = (versionId, event) => {
		const target = event.target as HTMLInputElement;
		const checked = target.checked;

		const tag = tagGroups.find((t) => t.version_id === versionId);

		if (tag && tag.tag_name === 'Untagged' && !checked) {
			target.checked = true;
			return;
		}

		if (checked) {
			selectedFiles = [...selectedFiles, versionId];
		} else {
			selectedFiles = selectedFiles.filter((id) => id !== versionId);
		}
	};

	const handleBdcMultiplierChange = (versionId, event) => {
		const target = event.target as HTMLInputElement;
		const value = parseFloat(target.value) || 1;
		tagGroups = tagGroups.map((tag) =>
			tag.version_id === versionId ? { ...tag, bdc_multiplier: value } : tag
		);
		console.log('Updated tagGroups:', $state.snapshot(tagGroups)); // Log entire tagGroups for debugging
	};

	const sendBdcValues = async () => {
		try {
			const updates = tagGroups.map((tag) => ({
				version: tag.version_id,
				bdc_value: tag.bdc_multiplier
			}));

			console.log('updates:', updates);

			const response = await fetch(
				`${VITE_API_URL}/dataset/update_bdc_multiplier`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ updates })
				}
			);

			if (!response.ok) {
				throw new Error('Error sending BDC values');
			}

			const data = await response.json();
			console.log('BDC values sent successfully:', data);
			return true;
		} catch (error) {
			console.error('Error sending BDC values:', error);
			return false;
		}
	};

	const selectFileToProceed = async () => {
		try {
			const response = await fetch(
				`${VITE_API_URL}/dataset/set_sent_for_rule_addition`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ version_id: selectedFiles })
				}
			);

			if (!response.ok) {
				throw new Error('Error selecting files for rule application');
			}

			const data = await response.json();
			console.log(data);
			return true;
		} catch (error) {
			console.error(error);
			return false;
		}
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

	const handleContinue = async () => {
		if (!isUntaggedSelected()) {
			alert('Please select the Untagged file to continue.');
			return;
		}

		const bdcStatus = await sendBdcValues();
		if (!bdcStatus) {
			alert('Error sending BDC values');
			return;
		}

		const uploadStatus = await selectFileToProceed();
		if (uploadStatus) {
			goto(`/DebtSheet/rule_setup/${urlParts[3]}`);
		} else {
			alert('Error selecting file for rule application');
		}
	};
</script>

<div class="flex h-[100vh] w-full flex-col">
	<div class="flex w-full items-center gap-4 px-16 pt-14">
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
		<div class="relative flex flex-col gap-1 px-10">
			<h2 class="font-semibold">Tags Found</h2>
			<span class="flex items-center gap-6 pb-6 font-normal">
				<p class="text-sm text-gray-500">We have tagged and separated the debt sheet</p>
			</span>
			{#if isloading}
				<div class="flex justify-center py-10">
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
					></div>
				</div>
			{:else if CustomError.length === 0}
				<Table>
					<TableHead class="text-center">
						<TableHeadCell><h3 class="pl-8">Tags</h3></TableHeadCell>
						<TableHeadCell>Number of Loans</TableHeadCell>
						<TableHeadCell>Total Outstanding</TableHeadCell>
						<TableHeadCell>BCD Multiplier</TableHeadCell>
						<TableHeadCell>Tag Type</TableHeadCell>
						<TableHeadCell></TableHeadCell>
						<TableHeadCell></TableHeadCell>
					</TableHead>
					<TableBody>
						{#each tagGroups as tag}
							<TableBodyRow class="rounded-xl border border-gray-200 text-center">
								<TableBodyCell class="rounded-xl">
									<div class="flex h-full w-[25%] items-center justify-between px-4">
										<div class="flex items-center font-medium">
											<Checkbox
												checked={selectedFiles.includes(tag.version_id)}
												on:change={(e) => handleCheckboxChange(tag.version_id, e)}
											>
												<img src="/excel.png" width="40" alt="" />{tag.tag_name}
											</Checkbox>
										</div>
									</div>
								</TableBodyCell>
								<TableBodyCell>
									{tag.number_of_rows}
								</TableBodyCell>
								<TableBodyCell>
									<h3>{tag.loan_amount_total.toLocaleString('en-IN')}</h3>
								</TableBodyCell>
								<TableBodyCell>
									<Input
										type="number"
										value={tag.bdc_multiplier}
										on:input={(e) => handleBdcMultiplierChange(tag.version_id, e)}
										class="ml-26 w-24 text-center"
									/>
								</TableBodyCell>
								<TableBodyCell>
									<span class="flex flex-1 items-center justify-center gap-2 text-[12px] font-bold">
										<svg
											width="12"
											height="12"
											viewBox="0 0 12 12"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M5.58496 0.900391C5.92537 0.900391 6.25329 1.03484 6.49414 1.27637L10.7236 5.50684H10.7246L10.8096 5.60059C10.9966 5.82899 11.0995 6.11628 11.0996 6.41406C11.0996 6.7544 10.9651 7.08145 10.7246 7.32227H10.7236L7.32227 10.7236V10.7246C7.08145 10.9651 6.7544 11.0996 6.41406 11.0996C6.0739 11.0995 5.74754 10.965 5.50684 10.7246V10.7236L1.27637 6.49414C1.18685 6.40468 1.11123 6.30259 1.05176 6.19141L0.998047 6.07715C0.933444 5.92124 0.900378 5.75373 0.900391 5.58496V2.18457C0.900391 1.47554 1.47554 0.900391 2.18457 0.900391H5.58496ZM2.1582 2.12012L2.13574 2.13574C2.12276 2.14873 2.11523 2.16622 2.11523 2.18457V5.58594C2.11526 5.5949 2.11668 5.60397 2.12012 5.6123L2.13574 5.63477L6.36523 9.86426L6.3877 9.87988L6.41406 9.88477C6.42334 9.88477 6.43315 9.88331 6.44141 9.87988L6.46387 9.86426L9.86426 6.46387L9.87988 6.44141L9.88477 6.41406L9.87988 6.3877L9.86426 6.36523L5.63477 2.13574L5.6123 2.12012C5.60397 2.11668 5.5949 2.11526 5.58594 2.11523H2.18457C2.17553 2.11523 2.16642 2.11677 2.1582 2.12012ZM4.38379 3.60742C4.58982 3.60742 4.78791 3.68929 4.93359 3.83496L4.98535 3.8916C5.0985 4.02974 5.16107 4.20366 5.16113 4.38379C5.16113 4.56388 5.09838 4.73782 4.98535 4.87598L4.93359 4.93359C4.78791 5.07927 4.58982 5.16113 4.38379 5.16113C4.17776 5.16113 3.97967 5.07927 3.83398 4.93359L3.77637 4.87598C3.66334 4.73782 3.60059 4.56388 3.60059 4.38379C3.60065 4.20366 3.66322 4.02974 3.77637 3.8916L3.83398 3.83496C3.97967 3.68929 4.17776 3.60742 4.38379 3.60742Z"
												fill="#37352F"
												stroke="#37352F"
												stroke-width="0.2"
											/>
										</svg>
										<p>{tag.tag_type_name}</p>
									</span>
								</TableBodyCell>
								<TableBodyCell>
									<div class="flex items-center justify-center gap-2">
										<!-- <span class="flex-1"><Button color="blue" class="w-32">open</Button></span> -->
										<span class="flex items-center justify-between">
											<button
												class="pe-2"
												aria-label="download button"
												on:click={() => downloadFile(tag.file_path)}
											>
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
											</button>
										</span>
									</div>
								</TableBodyCell>
							</TableBodyRow>
						{/each}
					</TableBody>
				</Table>
				<div class="w-full">
					<Button
						color="dark"
						class={`float-right mt-12 w-[20%] ${!isUntaggedSelected() ? 'cursor-not-allowed opacity-50' : ''}`}
						disabled={!isUntaggedSelected()}
						on:click={handleContinue}
					>
						Continue with selected
					</Button>
				</div>
			{:else}
				<div class="flex w-full items-center justify-center">
					<h2 class="text-red-400">{`Error fetching Data: ${CustomError.error}`}</h2>
				</div>
			{/if}
		</div>
	</div>
</div>
