<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { page } from '$app/state';
	import BreadCrumb from '$lib/components/BreadCrumb.svelte';
	import { CustomRuleModal, RuleModal } from '../../../../store/toogleModal.svelte';
	import CustomRuleForm from '$lib/components/CustomRuleForm.svelte';
	import { VITE_API_URL } from '$lib/constants';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let isloading = $state(false);
	let errorMessage = $state<string | null>(null);
	let path = page.url.pathname;
	let urlParts = path.split('/');
	let project_id = urlParts[3];
	let currentFile = $state('');
	let { data } = $props();
	let reactiveData = $state({ result: data.result });

	$effect(() => {
		console.log('Reactive data.result:', reactiveData.result);
	});

	onMount(() => {
		if (browser) {
			currentFile = localStorage.getItem('currentFile') || 'No file selected';
		}
	});

	let selectedParentVersionId = $state('');

	const fetchData = async () => {
		try {
			isloading = true;
			errorMessage = null;
			const response = await fetch(
				`${VITE_API_URL}/transaction_dataset/fetch_all_rule_versions/${project_id}`
			);
			if (!response.ok) {
				const err = `Failed to fetch file data: ${response.status}`;
				console.error('Fetch error:', err);
				errorMessage = err;
				return { success: false, error: err };
			}
			const newData = await response.json();
			if (!newData || !newData.grouped_versions) {
				const err = 'Invalid data structure: grouped_versions missing';
				console.error(err, newData);
				errorMessage = err;
				return { success: false, error: err };
			}
			reactiveData.result = newData;
			return { success: true };
		} catch (error) {
			console.error('Exception in fetchFile:', error);
			errorMessage = 'Failed to fetch file data';
			return { success: false, error: 'Failed to fetch file data' };
		} finally {
			isloading = false;
		}
	};

	function handleRuleApplied(_data: any) {
		fetchData();
	}

	function getLatestVersionId(versions: any[]) {
		if (versions && versions.length > 0) {
			return versions[versions.length - 1].version_id;
		}
		return '';
	}

	function formatRule(rule: any) {
		let ruleText = `IF ${rule.column} ${rule.operator} "${rule.value}"`;
		if (rule.connector && rule.connector !== 'THEN') {
			ruleText += ` ${rule.connector}`;
		} else if (rule.then) {
			ruleText += ` THEN ${rule.then}`;
		}
		return ruleText;
	}

	function formatRuleGroup(ruleGroup: any[]) {
		return ruleGroup.map((rule) => formatRule(rule)).join(' ');
	}

	async function downloadFile(filePath: string, fileName: string) {
		try {
			isloading = true;
			const downloadUrl = `${VITE_API_URL}/project/download_file?file_path=${encodeURIComponent(filePath)}`;
			const response = await fetch(downloadUrl, {
				method: 'GET',
				headers: {
					Accept: 'application/octet-stream'
				}
			});
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || `Failed to download file: ${response.statusText}`);
			}
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = fileName || filePath.split('/').pop() || 'downloaded_file.xlsx';
			a.style.display = 'none';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Download error:', error);
			alert(
				`Failed to download the file: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			isloading = false;
		}
	}

	// New delete function
	async function deleteRuleVersion(version: any, isRootVersion: boolean) {
		try {
			isloading = true;
			errorMessage = null;

			const apiUrl = isRootVersion
				? `${VITE_API_URL}/transaction_dataset/delete_rule_version`
				: `${VITE_API_URL}/transaction_dataset/delete_sub_version`;

			const body = isRootVersion
				? {
						transaction_id: project_id,
						version_id: version.version_id
					}
				: {
						transaction_id: project_id,
						version_id: version.version_id,
						delete_children: true
					};

			const response = await fetch(apiUrl, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(body)
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.message || `Failed to delete rule version: ${response.statusText}`
				);
			}

			// Refresh data after successful deletion
			console.log('deleted successfully');
			await fetchData();
		} catch (error) {
			console.error('Delete error:', error);
			errorMessage = `Failed to delete rule version: ${error instanceof Error ? error.message : 'Unknown error'}`;
		} finally {
			isloading = false;
		}
	}
</script>

{#if CustomRuleModal.isCustomRuleModalOpen}
	<CustomRuleForm
		transaction_id={project_id}
		parent_version_id={selectedParentVersionId}
		isNewVersion={CustomRuleModal.isNewVersion}
		onRuleApplied={handleRuleApplied}
	/>
{/if}

<div class="flex min-h-[100vh] w-full flex-col">
	<div class="flex w-full items-center gap-4 px-16 pt-14">
		{#if isloading}
			<div class="flex justify-center py-10">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
				></div>
			</div>
		{/if}
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
		{#if errorMessage}
			<p class="px-6 py-2 text-red-500">{errorMessage}</p>
		{/if}
		<div class="flex w-full flex-col gap-6 px-6">
			{#if !reactiveData.result.grouped_versions}
				<p>No versions available.</p>
			{:else}
				{#each Object.entries(reactiveData.result.grouped_versions) as [root_version, versions], index}
					<div class="flex flex-col items-center justify-center gap-4">
						<div class="flex w-full items-center">
							<img src="/excel.png" alt="excel icon" width="40" />
							<h2>Original File</h2>
						</div>
						<div class="flex w-full flex-col items-end gap-2 pe-20">
							{#each versions as version, versionIndex}
								<div class="flex w-full items-center justify-end gap-2">
									<span class="text-nowrap"><h3>Input Rows: {version.rows_before}</h3></span>
									<span
										class={`max-w-[40%] w-[${40 - versionIndex * 5}%] truncate rounded-lg bg-[#FFC45B33] px-4 py-2 text-[#6B480D]`}
									>
										{version.rule_applied
											.map((ruleGroup) => formatRuleGroup(ruleGroup))
											.join(' | ')}
									</span>
									<span
										class="rounded-lg border-[1px] border-[#08FF00] bg-[#FFC45B33] p-1 text-nowrap text-[#242C3E]"
									>
										<h3>Accepted: {version.rows_after}</h3>
									</span>
									<span
										class="rounded-lg border-[1px] border-[#FF0000] bg-[#FFEDED] p-1 text-nowrap text-[#242C3E]"
									>
										<h3>Rejected: {version.rows_removed}</h3>
									</span>
									<span
										class="rounded-lg border-[1px] border-[#BCBCBC] bg-[#FFFFFF] p-1 text-nowrap text-[#242C3E]"
									>
										<h3>Amt: {version.total_amount_after.toLocaleString()}</h3>
									</span>
									<span class="flex items-center justify-evenly gap-4 px-2">
										<button
											aria-label="download button"
											class="cursor-pointer"
											onclick={() => downloadFile(version.file_path, version.description + '.xlsx')}
										>
											<svg
												width="19"
												height="19"
												viewBox="0 0 19 19"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													d="M16.2544 2.74287C15.0951 1.5835 13.2291 1.5835 9.49717 1.5835C5.76521 1.5835 3.89924 1.5835 2.73987 2.74287C2.14019 3.34254 1.8507 4.13127 1.71094 5.26948C2.13105 4.80187 2.63584 4.41234 3.20267 4.12353C3.82135 3.80829 4.48381 3.68046 5.21731 3.62053C5.92595 3.56264 6.79791 3.56265 7.86409 3.56266H11.1302C12.1964 3.56265 13.0684 3.56264 13.777 3.62053C14.5106 3.68046 15.173 3.80829 15.7916 4.12353C16.3585 4.41234 16.8633 4.80187 17.2834 5.26948C17.1436 4.13127 16.8541 3.34254 16.2544 2.74287Z"
													fill="#0161DB"
												/>
												<path
													fill-rule="evenodd"
													clip-rule="evenodd"
													d="M1.58203 11.0833C1.58203 8.86643 1.58203 7.75802 2.01347 6.91129C2.39296 6.16648 2.99851 5.56093 3.74332 5.18143C4.59006 4.75 5.69849 4.75 7.91536 4.75H11.082C13.2989 4.75 14.4073 4.75 15.2541 5.18143C15.9989 5.56093 16.6045 6.16648 16.9839 6.91129C17.4154 7.75802 17.4154 8.86643 17.4154 11.0833C17.4154 13.3002 17.4154 14.4087 16.9839 15.2554C16.6045 16.0002 15.9989 16.6058 15.2541 16.9852C14.4073 17.4167 13.2989 17.4167 11.082 17.4167H7.91536C5.69849 17.4167 4.59006 17.4167 3.74332 16.9852C2.99851 16.6058 2.39296 16.0002 2.01347 15.2554C1.58203 14.4087 1.58203 13.3002 1.58203 11.0833ZM9.91852 13.8782C9.80721 13.9895 9.65616 14.0521 9.4987 14.0521C9.34124 14.0521 9.19019 13.9895 9.07888 13.8782L7.09969 11.899C6.86782 11.6671 6.86782 11.2912 7.09969 11.0593C7.33156 10.8275 7.7075 10.8275 7.93935 11.0593L8.90495 12.0249V8.70833C8.90495 8.38042 9.17079 8.11458 9.4987 8.11458C9.82661 8.11458 10.0924 8.38042 10.0924 8.70833V12.0249L11.058 11.0593C11.2899 10.8275 11.6658 10.8275 11.8977 11.0593C12.1296 11.2912 12.1296 11.6671 11.8977 11.899L9.91852 13.8782Z"
													fill="#0161DB"
												/>
											</svg>
										</button>
										<button aria-label="edit button" class="cursor-pointer">
											<svg
												width="24"
												height="24"
												viewBox="0 0 24 24"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													d="M5 19H6.425L16.2 9.225L14.775 7.8L5 17.575V19ZM3 21V16.75L16.2 3.575C16.4 3.39167 16.6208 3.25 16.8625 3.15C17.1042 3.05 17.3583 3 17.625 3C17.8917 3 18.15 3.05 18.4 3.15C18.65 3.25 18.8667 3.4 19.05 3.6L20.425 5C20.625 5.18333 20.7708 5.4 20.8625 5.65C20.9542 5.9 21 6.15 21 6.4C21 6.66667 20.9542 6.92083 20.8625 7.1625C20.7708 7.40417 20.625 7.625 20.425 7.825L7.25 21H3ZM15.475 8.525L14.775 7.8L16.2 9.225L15.475 8.525Z"
													fill="black"
													fill-opacity="0.2"
												/>
											</svg>
										</button>
										<button
											aria-label="delete button"
											class="cursor-pointer"
											onclick={() => deleteRuleVersion(version, versionIndex === 0)}
										>
											<svg
												width="14"
												height="17"
												viewBox="0 0 14 17"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													d="M0.960938 15.1112C0.960938 16.1548 1.82235 17.0001 2.88594 17.0001H10.5859C11.6494 17.0001 12.5109 16.1548 12.5109 15.1112V3.77783H0.960938V15.1112Z"
													fill="black"
													fill-opacity="0.28"
												/>
												<path
													d="M10.1062 0.94444L9.14344 0H4.33111L3.36859 0.94444H0V2.83333H13.4748V0.94444H10.1062Z"
													fill="black"
													fill-opacity="0.28"
												/>
											</svg>
										</button>
									</span>
								</div>
							{/each}
							<div class="mt-6 flex items-center justify-end">
								<Button
									color="blue"
									onclick={() => {
										CustomRuleModal.isCustomRuleModalOpen = true;
										CustomRuleModal.isNewVersion = false;
										selectedParentVersionId = getLatestVersionId(versions);
									}}>+ New Rule</Button
								>
							</div>
						</div>
					</div>
					<hr class="mx-auto my-6 w-[90%] border-[1px] border-gray-300" />
				{/each}
			{/if}
			<div class="flex flex-col items-center justify-center gap-4">
				<div class="flex w-full items-center justify-between pe-18">
					<span class="flex items-center justify-center">
						<img src="/excel.png" alt="excel icon" width="40" />
						<h2>Original File</h2>
					</span>
					<Button
						color="blue"
						onclick={() => {
							CustomRuleModal.isCustomRuleModalOpen = true;
							CustomRuleModal.isNewVersion = true;
							selectedParentVersionId = '';
						}}>+ Apply Rule</Button
					>
				</div>
				<div class="flex w-full flex-col items-end gap-2"></div>
			</div>
		</div>
	</div>
</div>
