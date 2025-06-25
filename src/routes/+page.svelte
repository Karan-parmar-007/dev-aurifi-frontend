<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Import from '$lib/components/Import.svelte';
	import { onMount } from 'svelte';
	import { modal } from '../store/toogleModal.svelte';
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Checkbox,
		TableSearch,
		Dropdown,
		DropdownItem
	} from 'flowbite-svelte';
	import { browser } from '$app/environment';
	import { user_id, VITE_API_URL } from '$lib/constants';
	import { goto } from '$app/navigation';

	let { data } = $props();
	let files = $derived(data.files);
	let customError = $derived(data.error);
	let loading = $state(false);
	let archiveConfirmFile = $state(null);
	let archiveConfirmProjectID = $state(null);
	let showArchiveConfirm = $state(false);
	let editFileNameMode = $state(false);
	let fileToRename = $state(null);
	let newFileName = $state('');
	let renameError = $state('');

	function setCurrentFile(fileName) {
		if (browser) {
			localStorage.setItem('currentFile', fileName);
		}
	}

	const fetchFiles = async () => {
		try {
			loading = true;
			const response = await fetch(`${VITE_API_URL}/project/get_projects/${user_id}`);
			if (!response.ok) {
				console.log('response not ok! ', response);
				files = [];
			}
			const result = await response.json();
			files = result.projects.sort(
				(a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
			);
			console.log($state.snapshot(files));
		} catch (error) {
			console.log('error fetching all files', error);
			files = [];
		} finally {
			loading = false;
		}
	};

	onMount(() => {
		fetchFiles();
	});

	const formatDate = (timestamp: string) => {
		const date = new Date(timestamp);
		const formatedDate = date.toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
		return formatedDate;
	};

	const downloadFile = async (file_path: string) => {
		try {
			const downloadUrl = `${VITE_API_URL}/project/download_file?file_path=${encodeURIComponent(file_path)}`;
			console.log('Download URL:', downloadUrl);

			const response = await fetch(downloadUrl, {
				method: 'GET',
				headers: {
					// Add any authentication headers if needed
				}
			});

			if (!response.ok) {
				throw new Error(`Download failed: ${response.statusText}`);
			}

			const blob = await response.blob();
			const blobUrl = window.URL.createObjectURL(blob);
			const filename = file_path.split('/').pop() || 'download.xlsx';
			const a = document.createElement('a');
			a.href = blobUrl;
			a.download = filename;
			a.style.display = 'none';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(blobUrl);
			console.log('Download completed successfully');
		} catch (error) {
			console.error('Error downloading file:', error);
			alert('Failed to download file. Please try again.');
		}
	};

	const startRenameFile = (file) => {
		fileToRename = file;
		newFileName = file.name;
		editFileNameMode = true;
	};

	const cancelRename = () => {
		fileToRename = null;
		newFileName = '';
		editFileNameMode = false;
		renameError = '';
	};

	const saveNewFileName = async () => {
		if (!fileToRename || !newFileName.trim()) {
			renameError = 'Please enter a valid filename';
			return;
		}
		const nameParts = fileToRename.name.split('.');
		const oldExtension = nameParts.length > 1 ? nameParts.pop() : '';
		let processedNewName = newFileName.trim();
		if (oldExtension) {
			if (!processedNewName.endsWith(`.${oldExtension}`)) {
				if (processedNewName.includes('.')) {
					processedNewName = processedNewName.split('.')[0] + `.${oldExtension}`;
				} else {
					processedNewName = `${processedNewName}.${oldExtension}`;
				}
			}
		} else {
			processedNewName = processedNewName.includes('.')
				? processedNewName.split('.')[0]
				: processedNewName;
		}
		try {
			loading = true;
			renameError = '';
			const response = await fetch(`${VITE_API_URL}/project/change-project-name`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					project_id: fileToRename._id,
					new_name: processedNewName
				})
			});
			const result = await response.json();
			if (!response.ok) {
				renameError = result.message || 'Failed to rename file';
				return;
			}
			await fetchFiles();
			cancelRename();
		} catch (error) {
			console.error('Error renaming file:', error);
			renameError = error.message || 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	};

	const confirmArchiveFile = (filename: string, project_id: string) => {
		archiveConfirmFile = filename;
		archiveConfirmProjectID = project_id;
		showArchiveConfirm = true;
	};

	const cancelArchive = () => {
		showArchiveConfirm = false;
		archiveConfirmFile = null;
		archiveConfirmProjectID = null;
	};

	const moveToArchive = async () => {
		if (!archiveConfirmFile || !archiveConfirmProjectID) return;
		try {
			loading = true;
			const response = await fetch(`${VITE_API_URL}/archive_debt_sheet/send_project_to_archive`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					user_id: user_id,
					project_id: archiveConfirmProjectID
				})
			});
			if (!response.ok) {
				const errorData = await response.json();
				customError = errorData.message || 'Failed to archive file';
				return;
			}
			const result = await response.json();
			await fetchFiles();
			showArchiveConfirm = false;
			archiveConfirmFile = null;
			archiveConfirmProjectID = null;
		} catch (error) {
			console.error('Error archiving file:', error);
			customError = error.message || 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	};

	const navigateToNextStep = async (projectId: string, fileName: string) => {
		try {
			const response = await fetch(`${VITE_API_URL}/project/get_project_navigation/${projectId}`);
			if (!response.ok) {
				throw new Error('Failed to fetch project navigation');
			}
			const result = await response.json();
			if (result.status === 'success' && result.navigation) {
				const nextStep = result.navigation.next_step;
				setCurrentFile(fileName);

				const stepToRouteMap = {
					header_mapping: '/DebtSheet/column_mapping',
					datatype_conversion: '/DebtSheet/data_validation',
					select_tags: '/DebtSheet/Tagging',
					apply_rules: '/DebtSheet/retagged_items',
					completed: '/DebtSheet/file_overview'
				};

				const route =
					`${stepToRouteMap[nextStep]}/${projectId}` || `/DebtSheet/file_overview/${projectId}`;
				goto(route);
			}
		} catch (error) {
			console.error('Error fetching navigation:', error);
			// Fallback to original behavior
			goto(`/DebtSheet/file_overview/${projectId}`);
		}
	};

	const formatFileKey = (key: string) => {
		if (key === 'combined_file') return 'Combined File';
		return key
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
	};
</script>

<Header />
{#if modal.isModalOpen}
	<div class="absolute z-10 flex h-[100vh] w-full items-center justify-center bg-[#00000091]">
		<Import {fetchFiles} {files} />
	</div>
{/if}
<div class="flex h-[100vh] w-full flex-col items-center justify-center pt-12">
	<div class="flex h-[85%] w-[90%] items-center justify-center rounded-3xl bg-gray-100">
		{#if loading}
			<div class="flex items-center justify-center">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
				></div>
				<span class="ml-2">Loading...</span>
			</div>
		{:else if files && files.length != 0}
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

				{#if editFileNameMode && fileToRename}
					<div class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
						<div class="w-96 rounded-lg bg-white p-6 shadow-lg">
							<h3 class="mb-4 text-lg font-medium">Rename File</h3>
							{#if renameError}
								<div class="bg-red-light mb-4 rounded p-2 text-red-500">
									{renameError}
								</div>
							{/if}
							<div class="mb-4">
								<label class="mb-2 block text-sm font-medium text-gray-700" for="file name text">
									Current name: <span class="font-normal">{fileToRename.name}</span>
								</label>
								<input
									type="text"
									bind:value={newFileName}
									class="w-full rounded-lg border border-gray-300 p-2.5 hover:border-blue-300 focus:border-blue-500"
									placeholder="Enter new filename"
								/>
								<p class="mt-1 text-xs text-gray-500">File extension will be preserved</p>
							</div>
							<div class="flex justify-end space-x-4">
								<button
									onclick={cancelRename}
									class="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
								>
									Cancel
								</button>
								<button
									onclick={saveNewFileName}
									class="rounded-lg bg-blue-600 px-4 py-2 text-white"
								>
									Save
								</button>
							</div>
						</div>
					</div>
				{/if}
				<Table divClass={'w-[98%] mx-auto'} class="border-separate border-spacing-y-2">
					<TableHead class=" bg-transparent">
						<TableHeadCell>Sheet name</TableHeadCell>
						<TableHeadCell>Date Created</TableHeadCell>
						<TableHeadCell></TableHeadCell>
						<TableHeadCell></TableHeadCell>
						<TableHeadCell></TableHeadCell>
					</TableHead>
					<TableBody tableBodyClass="divide-y">
						{#each files as items}
							<TableBodyRow>
								<TableBodyCell class="rounded-md"
									><span class="flex items-center"
										><img src="/excel.png" width="40" alt="" />{items.name}</span
									></TableBodyCell
								>
								<TableBodyCell>{`Created on: ${formatDate(items.updated_at)}`}</TableBodyCell>
								<TableBodyCell colspan={1}></TableBodyCell>
								<TableBodyCell
									>{#if !items.is_processing_done}
										<span class=" flex justify-end font-medium text-blue-600"
											><button onclick={() => navigateToNextStep(items._id, items.name)}
												>Process file ></button
											></span
										>
									{:else}<span class=" flex justify-end font-medium text-blue-600">Processed</span>
									{/if}</TableBodyCell
								>
								<TableBodyCell class=" rounded-md bg-transparent"
									><span class=" flex items-center justify-end gap-4">
										{#if items.is_processing_done && items.file_data}
											<div class="dropdown-trigger">
												<svg
													width="17"
													height="17"
													class="cursor-pointer"
													viewBox="0 0 17 17"
													fill="none"
													xmlns="http://www.w3.org/2000/svg"
												>
													<path
														d="M15.2544 1.74287C14.0951 0.583496 12.2291 0.583496 8.49717 0.583496C4.76521 0.583496 2.89924 0.583496 1.73987 1.74287C1.14019 2.34254 0.850698 3.13127 0.710938 4.26948C1.13105 3.80182 1.63582 3.41234 2.20267 3.12353C2.82135 2.80829 3.48381 2.68046 4.21731 2.62053C4.92595 2.56264 5.79791 2.56265 6.86409 2.56266H10.1302C11.1964 2.56265 12.0684 2.56264 12.777 2.62053C13.5106 2.68046 14.173 2.80829 14.7916 3.12353C15.3585 3.41234 15.8633 3.80182 16.2834 4.26948C16.1436 3.13127 15.8541 2.34254 15.2544 1.74287Z"
														fill="#0161DB"
													/>
													<path
														fill-rule="evenodd"
														clip-rule="evenodd"
														d="M0.582031 10.0833C0.582031 7.86643 0.582031 6.75802 1.01347 5.91129C1.39296 5.16648 1.99851 4.56093 2.74332 4.18143C3.59006 3.75 4.69849 3.75 6.91536 3.75H10.082C12.2989 3.75 13.4073 3.75 14.2541 4.18143C14.9989 4.56093 15.6045 5.16648 15.9839 5.91129C16.4154 6.75802 16.4154 7.86643 16.4154 10.0833C16.4154 12.3002 16.4154 13.4086 15.9839 14.2554C15.6045 15.0002 14.9989 15.6058 14.2541 15.9852C13.4073 16.4167 12.2989 16.4167 10.082 16.4167H6.91536C4.69849 16.4167 3.59006 16.4167 2.74332 15.9852C1.99851 15.6058 1.39296 15.0002 1.01347 14.2554C0.582031 13.4086 0.582031 12.3002 0.582031 10.0833ZM8.91852 12.8782C8.80721 12.9895 8.65616 13.0521 8.4987 13.0521C8.34124 13.0521 8.19019 12.9895 8.07888 12.8782L6.09969 10.899C5.86782 10.6671 5.86782 10.2912 6.09969 10.0593C6.33156 9.82746 6.7075 9.82746 6.93935 10.0593L7.90495 11.0249V7.70833C7.90495 7.38042 8.17086 7.11458 8.4987 7.11458C8.82661 7.11458 9.09245 7.38042 9.09245 7.70833V11.0249L10.058 10.0593C10.2899 9.82746 10.6658 9.82746 10.8977 10.0593C11.1296 10.2912 11.1296 10.6671 10.8977 10.899L8.91852 12.8782Z"
														fill="#0161DB"
													/>
												</svg>
												<Dropdown class="w-48 rounded-lg bg-white shadow-lg">
													{#each Object.keys(items.file_data) as key}
														<DropdownItem
															onclick={() =>
																downloadFile(
																	items.file_data[key].file_path,
																	`${items.name}_${key}`
																)}
														>
															{formatFileKey(key)}
														</DropdownItem>
													{/each}
												</Dropdown>
											</div>
										{:else}<button
												aria-label="download file"
												onclick={() => downloadFile(items.original_file_path, items.name)}
												class="button-group"
											>
												<svg
													width="23"
													height="23"
													viewBox="0 0 23 23"
													fill="none"
													xmlns="http://www.w3.org/2000/svg"
												>
													<path
														d="M19.679 3.3202C18.2756 1.91675 16.0168 1.91675 11.4994 1.9167C6.98154 1.91667 4.72261 1.91675 3.31924 3.3202C2.59332 4.04634 2.2421 5.0009 2.07373 6.37073C2.6 2.81273 3.19135 5.34146 3.87952 4.99186C4.62834 4.61026 5.43037 4.45552 6.31828 4.38298C7.17612 4.31289 8.23164 4.3129 9.52228 4.31291H13.476C14.7667 4.3129 15.8222 4.31289 16.68 4.38298C17.568 4.45552 18.3699 4.61026 19.1188 4.99186C19.8049 5.34146 20.4161 5.81299 20.9246 6.37073C20.7554 5.0009 20.405 4.04634 19.679 3.3202Z"
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
											</button>{/if}
										<button aria-label="edit file name" onclick={() => startRenameFile(items)}>
											<svg
												width="24"
												height="24"
												viewBox="0 0 24 24"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
												class="button-group"
											>
												<path
													d="M5 19H6.425L16.2 9.225L14.775 7.8L5 17.575V19ZM3 21V16.75L16.2 3.575C16.4 3.39167 16.6208 3.25 16.8625 3.15C17.1042 3.05 17.3583 3 17.625 3C17.8917 3 18.15 3.05 18.4 3.15C18.65 3.25 18.8667 3.4 19.05 3.6L20.425 5C20.625 5.18333 20.7708 5.4 20.8625 5.65C20.9542 5.9 21 6.15 21 6.4C21 6.66667 20.9542 6.92083 20.8625 7.1625C20.7708 7.40417 20.625 7.625 20.425 7.825L7.25 21H3ZM15.475 8.525L14.775 7.8L16.2 9.225L15.475 8.525Z"
													fill="black"
													fill-opacity="0.2"
												/>
											</svg>
										</button>
										<button
											aria-label="archive file"
											onclick={() => confirmArchiveFile(items.name, items._id)}
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
			<p class=" opacity-50">No Previous Transactions</p>
		{/if}
	</div>
</div>

<style>
	.button-group {
		cursor: pointer;
	}
	.dropdown-trigger {
		display: inline-flex;
		align-items: center;
	}
</style>
