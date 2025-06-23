<script lang="ts">
	import BreadCrumb from '$lib/components/BreadCrumb.svelte';
	import { Button, Checkbox } from 'flowbite-svelte';
	import { InsertionModal } from '../../../../store/toogleModal.svelte';
	import { EjectionModal } from '../../../../store/toogleModal.svelte';
	import InsertionModalForm from '$lib/components/InsertionModalForm.svelte';
	import EjectionModalForm from '$lib/components/EjectionModalForm.svelte';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { VITE_API_URL } from '$lib/constants';

	let isloading = $state(true);
	let tagGroups = $state<
		Array<{
			tag_name: string;
			tag_type_name: string;
			version_id: string;
			number_of_rows: number;
			file_path: string;
			bdc_multiplier: number;
			loan_amount_total: number;
		}>
	>([]);
	let selectedTag = $state<string | null>(null);
	let columns = $state<string[]>([]);

	interface TagRule {
		insertionRules: any[][];
		ejectionRules: any[][];
	}

	let tagRules = $state<Record<string, TagRule>>({});
	let pinnedRuleIds = $state<Record<string, { insertion: number[]; ejection: number[] }>>({});

	let draggedItem = $state<{ tagName: string; ruleType: string; index: number } | null>(null);
	let dragOverItem = $state<{ tagName: string; ruleType: string; index: number } | null>(null);

	let editingRuleIndex = $state<number | null>(null);
	let editingRuleType = $state<string | null>(null);
	let editingRuleData = $state<any[] | null>(null);

	let pageUrl = page.url.pathname;
	let urlParts = pageUrl.split('/');
	let projectId = urlParts[3];

	let CustomError = $state([]);
	let submittedRules = $state<any[]>([]);
	let rules_applied_success = $state(false);
	let currentFile = $state('');

	const cleanup = async () => {
		editingRuleData = null;
	};

	const fetchData = async () => {
		try {
			isloading = true;
			const response = await fetch(
				`${VITE_API_URL}/dataset/get_split_files_for_rule_addition?project_id=${projectId}`
			);
			if (!response.ok) {
				CustomError = await response.json();
				throw new Error('error fetching data');
			}
			let data = await response.json();
			console.log(data);
			tagGroups = data.split_files || [];
			tagGroups.forEach((tag) => {
				if (!tagRules[tag.tag_name]) {
					tagRules[tag.tag_name] = {
						insertionRules: [],
						ejectionRules: []
					};
					pinnedRuleIds[tag.tag_name] = { insertion: [], ejection: [] };
				}
			});
			if (data.pinned_rules && data.pinned_rules.length > 0) {
				data.pinned_rules.forEach((rule) => {
					const tagName = rule.tag_name;
					if (!tagRules[tagName]) {
						tagRules[tagName] = {
							insertionRules: [],
							ejectionRules: []
						};
						pinnedRuleIds[tagName] = { insertion: [], ejection: [] };
					}
					if (rule.type_of_rule === 'insertion') {
						tagRules[tagName].insertionRules = rule.rules;
						pinnedRuleIds[tagName].insertion = rule.rules.map((_, index) => index);
					} else if (rule.type_of_rule === 'ejection') {
						tagRules[tagName].ejectionRules = rule.rules;
						pinnedRuleIds[tagName].ejection = rule.rules.map((_, index) => index);
					}
				});
			}
			isloading = false;
		} catch (error) {
			console.error('Error fetching data:', error);
			isloading = false;
		}
	};

	const fetchColumns = async () => {
		try {
			isloading = true;
			const response = await fetch(
				`${VITE_API_URL}/dataset/get_column_names?project_id=${projectId}`
			);
			if (!response.ok) {
				CustomError = await response.json();
				throw new Error('Failed to fetch column data');
			}
			const data = await response.json();
			console.log(data);
			columns = data.column_names || [];
			isloading = false;
		} catch (error) {
			console.error('Error fetching column data:', error);
			isloading = false;
		}
	};

	onMount(() => {
		if (browser) {
			currentFile = localStorage.getItem('currentFile') || 'No file selected';
		}
		fetchData();
		fetchColumns();
	});

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

	function openInsertionModal(tagName: string) {
		selectedTag = tagName;
		InsertionModal.isInsertionModalOpen = true;
	}

	function openEjectionModal(tagName: string) {
		selectedTag = tagName;
		EjectionModal.isEjectionModalOpen = true;
	}

	function processRules(rules: any, type: string) {
		if (!tagRules[selectedTag]) {
			tagRules[selectedTag] = {
				insertionRules: [],
				ejectionRules: []
			};
			pinnedRuleIds[selectedTag] = { insertion: [], ejection: [] };
		}
		if (editingRuleIndex !== null && editingRuleType === type) {
			if (type === 'insertion') {
				tagRules[selectedTag].insertionRules[editingRuleIndex] = rules;
				const index = pinnedRuleIds[selectedTag].insertion.indexOf(editingRuleIndex);
				if (index !== -1) {
					pinnedRuleIds[selectedTag].insertion.splice(index, 1);
				}
			} else {
				tagRules[selectedTag].ejectionRules[editingRuleIndex] = rules;
				const index = pinnedRuleIds[selectedTag].ejection.indexOf(editingRuleIndex);
				if (index !== -1) {
					pinnedRuleIds[selectedTag].ejection.splice(index, 1);
				}
			}
			editingRuleIndex = null;
			editingRuleType = null;
			editingRuleData = null;
		} else {
			if (type === 'insertion') {
				tagRules[selectedTag].insertionRules.push(rules);
			} else {
				tagRules[selectedTag].ejectionRules.push(rules);
			}
		}
		InsertionModal.isInsertionModalOpen = false;
		EjectionModal.isEjectionModalOpen = false;
		const previewData = {
			project_id: projectId,
			acception_rules_for_all_files: [],
			ejection: []
		};
		Object.entries(tagRules).forEach(([tagName, rules]) => {
			const tagInfo = tagGroups.find((tag) => tag.tag_name === tagName);
			if (!tagInfo) return;
			if (rules.insertionRules && rules.insertionRules.length > 0) {
				previewData.acception_rules_for_all_files.push({
					tag_name: tagName,
					tag_type: tagInfo.tag_type_name,
					version_id: tagInfo.version_id,
					rules: rules.insertionRules
				});
			}
			if (rules.ejectionRules && rules.ejectionRules.length > 0) {
				previewData.ejection.push({
					tag_name: tagName,
					tag_type: tagInfo.tag_type_name,
					version_id: tagInfo.version_id,
					rules: rules.ejectionRules
				});
			}
		});
		console.log('Preview of data to be sent to backend:', previewData);
		return {
			success: true,
			message: `Successfully added ${rules.length} rules to ${rules[0].column}`
		};
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

	async function saveRulesToBackend() {
		try {
			isloading = true;
			const formattedData = {
				project_id: projectId,
				acception_rules_for_all_files: [],
				ejection: []
			};
			Object.entries(tagRules).forEach(([tagName, rules]) => {
				const tagInfo = tagGroups.find((tag) => tag.tag_name === tagName);
				if (!tagInfo) return;
				if (rules.insertionRules && rules.insertionRules.length > 0) {
					formattedData.acception_rules_for_all_files.push({
						tag_name: tagName,
						tag_type: tagInfo.tag_type_name,
						version_id: tagInfo.version_id,
						rules: rules.insertionRules
					});
				}
				if (rules.ejectionRules && rules.ejectionRules.length > 0) {
					formattedData.ejection.push({
						tag_name: tagName,
						tag_type: tagInfo.tag_type_name,
						version_id: tagInfo.version_id,
						rules: rules.ejectionRules
					});
				}
			});
			console.log('Submitting rules:', formattedData);
			const response = await fetch(`${VITE_API_URL}/dataset/apply_rules`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formattedData)
			});
			if (!response.ok) {
				CustomError = await response.json();
				alert('Error applying rules');
				throw new Error('Failed to save rules');
			}
			const result = await response.json();
			isloading = false;
			rules_applied_success = true;
			goto(`/DebtSheet/retagged_items/${projectId}`);
			return result;
		} catch (error) {
			console.error('Error saving rules:', error);
			isloading = false;
			alert('Error applying rules');
		}
	}

	function deleteRule(tagName: string, ruleType: string, index: number) {
		if (tagRules[tagName]) {
			if (ruleType === 'insertion') {
				tagRules[tagName].insertionRules.splice(index, 1);
				pinnedRuleIds[tagName].insertion = pinnedRuleIds[tagName].insertion
					.filter((i) => i !== index)
					.map((i) => (i > index ? i - 1 : i));
			} else {
				tagRules[tagName].ejectionRules.splice(index, 1);
				pinnedRuleIds[tagName].ejection = pinnedRuleIds[tagName].ejection
					.filter((i) => i !== index)
					.map((i) => (i > index ? i - 1 : i));
			}
			const previewData = {
				project_id: projectId,
				acception_rules_for_all_files: [],
				ejection: []
			};
			Object.entries(tagRules).forEach(([tagName, rules]) => {
				const tagInfo = tagGroups.find((tag) => tag.tag_name === tagName);
				if (!tagInfo) return;
				if (rules.insertionRules && rules.insertionRules.length > 0) {
					previewData.acception_rules_for_all_files.push({
						tag_name: tagName,
						tag_type: tagInfo.tag_type_name,
						version_id: tagInfo.version_id,
						rules: rules.insertionRules
					});
				}
				if (rules.ejectionRules && rules.ejectionRules.length > 0) {
					previewData.ejection.push({
						tag_name: tagName,
						tag_type: tagInfo.tag_type_name,
						version_id: tagInfo.version_id,
						rules: rules.ejectionRules
					});
				}
			});
		}
	}

	function editRule(tagName: string, ruleType: string, index: number) {
		selectedTag = tagName;
		editingRuleIndex = index;
		editingRuleType = ruleType;
		if (ruleType === 'insertion') {
			editingRuleData = [...tagRules[tagName].insertionRules[index]];
			InsertionModal.isInsertionModalOpen = true;
		} else {
			editingRuleData = [...tagRules[tagName].ejectionRules[index]];
			EjectionModal.isEjectionModalOpen = true;
		}
	}

	function handleDragStart(tagName: string, ruleType: string, index: number) {
		draggedItem = { tagName, ruleType, index };
		const dragElements = document.querySelectorAll('.rule-item');
		dragElements.forEach((el, i) => {
			if (i === index) {
				el.classList.add('dragging');
			}
		});
	}

	function handleDragOver(tagName: string, ruleType: string, index: number, e: DragEvent) {
		e.preventDefault();
		dragOverItem = { tagName, ruleType, index };
		const container = e.currentTarget.parentElement as HTMLElement;
		if (!container) return;
		const allItems = Array.from(container.querySelectorAll('.rule-item:not(.dragging)'));
		const currentItem = e.currentTarget as HTMLElement;
		allItems.forEach((item) => {
			item.classList.remove('drop-indicator');
		});
		currentItem.classList.add('drop-indicator');
	}

	function handleDragEnd() {
		if (draggedItem && dragOverItem) {
			// Only allow reordering within the same tag and rule type
			if (
				draggedItem.tagName === dragOverItem.tagName &&
				draggedItem.ruleType === dragOverItem.ruleType
			) {
				const { tagName, ruleType } = draggedItem;
				// Get the array of rules
				const rulesArray =
					ruleType === 'insertion'
						? tagRules[tagName].insertionRules
						: tagRules[tagName].ejectionRules;
				// Get the array of pinned indices
				const pinnedArray =
					ruleType === 'insertion'
						? pinnedRuleIds[tagName].insertion
						: pinnedRuleIds[tagName].ejection;
				// Make a copy of the dragged item
				const itemToMove = rulesArray[draggedItem.index];
				const wasPinned = pinnedArray.includes(draggedItem.index);
				// Remove it from the original position
				rulesArray.splice(draggedItem.index, 1);
				// Calculate the new drop index
				const dropIndex =
					dragOverItem.index > draggedItem.index ? dragOverItem.index - 1 : dragOverItem.index;
				// Insert it at the new position
				rulesArray.splice(dropIndex, 0, itemToMove);
				// Rebuild pinnedRuleIds to reflect the new order
				const newPinnedArray: number[] = [];
				rulesArray.forEach((rule, index) => {
					// If this rule was the one we moved and it was pinned, keep it pinned
					if (index === dropIndex && wasPinned) {
						newPinnedArray.push(index);
					}
					// If this index was previously pinned (and isn't the dragged item), keep it pinned
					else if (pinnedArray.includes(index) && index !== draggedItem.index) {
						newPinnedArray.push(index);
					}
					// Adjust indices for rules that shifted due to the move
					else if (
						pinnedArray.includes(index + 1) &&
						index >= Math.min(draggedItem.index, dropIndex) &&
						index < Math.max(draggedItem.index, dropIndex)
					) {
						newPinnedArray.push(index);
					}
				});
				// Update the pinnedRuleIds array
				if (ruleType === 'insertion') {
					pinnedRuleIds[tagName].insertion = newPinnedArray;
				} else {
					pinnedRuleIds[tagName].ejection = newPinnedArray;
				}
				// Update the tagRules and pinnedRuleIds state to trigger a re-render
				tagRules = { ...tagRules };
				pinnedRuleIds = { ...pinnedRuleIds };
			}
		}
		// Reset the drag state
		draggedItem = null;
		dragOverItem = null;
		// Remove all dragging and indicator classes
		document.querySelectorAll('.rule-item').forEach((item) => {
			item.classList.remove('dragging', 'drop-indicator');
		});
	}

	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		(e.currentTarget as HTMLElement).classList.add('drag-over');
	}

	function handleDragLeave(e: DragEvent) {
		(e.currentTarget as HTMLElement).classList.remove('drag-over', 'drop-indicator');
	}
</script>

<!-- HTML and styles remain unchanged -->
<div class="flex h-[100vh] w-full flex-col">
	<div class="flex w-full items-center gap-4 px-16 pt-14">
		{#if InsertionModal.isInsertionModalOpen === true}
			<InsertionModalForm
				processRules={(rules) => processRules(rules, 'insertion')}
				initialData={editingRuleData}
				{cleanup}
				tagName={selectedTag}
			/>
		{/if}
		{#if EjectionModal.isEjectionModalOpen === true}
			<EjectionModalForm
				processRules={(rules) => processRules(rules, 'ejection')}
				initialData={editingRuleData}
				{cleanup}
				tagName={selectedTag}
			/>
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
		<div class="flex flex-col gap-1 px-10">
			<h2 class="font-semibold">Tags Found</h2>
			<span class="flex items-center gap-6 pb-6 font-normal">
				<p class="text-sm text-gray-500">We have tagged and separated the debt sheet</p>
			</span>
			{#if isloading}
				<div class="flex items-center justify-center p-10">
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
					></div>
					<span class="ml-3">Loading...</span>
				</div>
			{:else}
				{#each tagGroups as tagInfo}
					<div
						class={`mb-2 flex h-auto min-h-16 w-full items-center justify-between rounded-xl border border-gray-200 p-2 ${tagInfo.tag_name === 'Untagged' ? 'bg-gray-300' : ''}`}
					>
						<div class="flex h-full w-[25%] items-center justify-between px-4">
							<div class="flex items-center font-medium">
								<Checkbox checked>
									<img src="/excel.png" width="40" alt="" />{tagInfo.tag_name}
								</Checkbox>
							</div>
							<div class="flex items-center text-[13px] font-semibold text-[#242C3E]">
								No of Loans: {tagInfo.number_of_rows}
							</div>
						</div>
						<div class="flex h-full w-[35%] flex-col justify-center gap-2">
							<div class="flex justify-between gap-2 px-4">
								{#if tagInfo.tag_name !== 'Untagged'}
									<Button
										onclick={() => openInsertionModal(tagInfo.tag_name)}
										style="padding: 6px"
										class="w-1/2 cursor-pointer border border-[#08FF00] bg-[#e9ffef] text-xs text-black focus:outline-none focus:ring-0"
										>+ Insertion Rule</Button
									>
									<Button
										onclick={() => openEjectionModal(tagInfo.tag_name)}
										style="padding: 6px"
										class="w-1/2 cursor-pointer border border-[#FF0000] bg-[#ffeded] text-xs text-black focus:outline-none focus:ring-0"
										>- Ejection Rule</Button
									>
								{/if}
							</div>
							{#if (tagRules[tagInfo.tag_name] && tagRules[tagInfo.tag_name].insertionRules.length > 0) || (tagRules[tagInfo.tag_name] && tagRules[tagInfo.tag_name].ejectionRules.length > 0)}
								<div class="flex justify-between gap-2 px-4">
									<div class="rule-container flex max-w-[50%] flex-col gap-2">
										{#if tagRules[tagInfo.tag_name] && tagRules[tagInfo.tag_name].insertionRules.length > 0}
											{#each tagRules[tagInfo.tag_name].insertionRules as ruleGroup, index}
												<!-- svelte-ignore a11y_no_static_element_interactions -->
												<div
													style="padding: 6px"
													class="rule-item flex w-full cursor-move items-center justify-between rounded-md text-xs focus:outline-none focus:ring-0"
													class:pinned-rule={pinnedRuleIds[tagInfo.tag_name]?.insertion.includes(
														index
													)}
													class:manual-rule={!pinnedRuleIds[tagInfo.tag_name]?.insertion.includes(
														index
													)}
													draggable="true"
													ondragstart={() => handleDragStart(tagInfo.tag_name, 'insertion', index)}
													ondragover={(e) =>
														handleDragOver(tagInfo.tag_name, 'insertion', index, e)}
													ondragend={handleDragEnd}
													ondragenter={handleDragEnter}
													ondragleave={handleDragLeave}
												>
													<div class="flex items-center">
														<span class="mr-2 cursor-grab text-gray-500">
															<svg
																width="10"
																height="16"
																viewBox="0 0 10 16"
																fill="none"
																xmlns="http://www.w3.org/2000/svg"
															>
																<path
																	d="M4 14C4 15.1 3.1 16 2 16C0.9 16 0 15.1 0 14C0 12.9 0.9 12 2 12C3.1 12 4 12.9 4 14ZM2 6C0.9 6 0 6.9 0 8C0 9.1 0.9 10 2 10C3.1 10 4 9.1 4 8C4 6.9 3.1 6 2 6ZM2 0C0.9 0 0 0.9 0 2C0 3.1 0.9 4 2 4C3.1 4 4 3.1 4 2C4 0.9 3.1 0 2 0ZM8 4C9.1 4 10 3.1 10 2C10 0.9 9.1 0 8 0C6.9 0 6 0.9 6 2C6 3.1 6.9 4 8 4ZM8 6C6.9 6 6 6.9 6 8C6 9.1 6.9 10 8 10C9.1 10 10 9.1 10 8C10 6.9 9.1 6 8 6ZM8 12C6.9 12 6 12.9 6 14C6 15.1 6.9 16 8 16C9.1 16 10 15.1 10 14C10 12.9 9.1 12 8 12Z"
																	fill="currentColor"
																/>
															</svg>
														</span>
														<h1>{formatRuleGroup(ruleGroup)}</h1>
													</div>
													<div class="flex gap-2">
														<button
															aria-label="edit button"
															class="cursor-pointer"
															onclick={() => editRule(tagInfo.tag_name, 'insertion', index)}
															title="Edit rule"
														>
															<svg
																width="15"
																height="15"
																viewBox="0 0 24 24"
																fill="none"
																xmlns="http://www.w3.org/2000/svg"
															>
																<path
																	d="M16.474 5.408L18.592 7.526C18.8113 7.7453 18.8113 8.10067 18.592 8.32L10.48 16.432L7.89333 16.9387C7.17467 17.0653 6.568 16.4587 6.69467 15.74L7.20133 13.1533L15.3133 5.408C15.5333 5.18867 15.8773 5.18867 16.0973 5.408H16.474M21.7693 9.55067L19.04 12.28L19.04 6.61333C19.04 6.35733 18.8347 6.15333 18.5787 6.15333H17.1493V2.98933C17.1493 2.47467 16.7267 2.05333 16.2133 2.05333H7.78667C7.272 2.05333 6.85067 2.47467 6.85067 2.98933V6.15333H5.42133C5.16533 6.15333 4.96 6.35733 4.96 6.61333V19.6933C4.96 19.9493 5.16533 20.1533 5.42133 20.1533H18.5787C18.8347 20.1533 19.04 19.9493 19.04 19.6933V14.0267L21.7693 11.2973C22.744 10.3227 22.744 9.36267 21.7693 8.38933L21.7693 9.55067Z"
																	fill="black"
																	fill-opacity="0.28"
																/>
															</svg>
														</button>
														<button
															aria-label="delete button"
															class="cursor-pointer"
															onclick={() => deleteRule(tagInfo.tag_name, 'insertion', index)}
															title="Delete rule"
														>
															<svg
																width="10"
																height="13"
																viewBox="0 0 10 13"
																fill="none"
																xmlns="http://www.w3.org/2000/svg"
															>
																<path
																	d="M0.714294 11.5556C0.714294 12.3537 1.35357 13 2.14288 13H7.85719C8.64647 13 9.28574 12.3537 9.28574 11.5556V2.88892H0.714294V11.5556Z"
																	fill="black"
																	fill-opacity="0.28"
																/>
																<path
																	d="M7.50002 0.722211L6.78571 0H3.21429L2.49998 0.722211H0V2.16667H10V0.722211H7.50002"
																	fill="black"
																	fill-opacity="0.28"
																/>
															</svg>
														</button>
													</div>
												</div>
											{/each}
										{/if}
									</div>
									<div class="rule-container flex max-w-[50%] flex-col gap-2">
										{#if tagRules[tagInfo.tag_name] && tagRules[tagInfo.tag_name].ejectionRules.length > 0}
											{#each tagRules[tagInfo.tag_name].ejectionRules as ruleGroup, index}
												<!-- svelte-ignore a11y_no_static_element_interactions -->
												<div
													style="padding: 6px"
													class="rule-item flex w-full cursor-move items-center justify-between rounded-md text-xs focus:outline-none focus:ring-0"
													class:pinned-rule={pinnedRuleIds[tagInfo.tag_name]?.ejection.includes(
														index
													)}
													class:manual-rule={!pinnedRuleIds[tagInfo.tag_name]?.ejection.includes(
														index
													)}
													draggable="true"
													ondragstart={() => handleDragStart(tagInfo.tag_name, 'ejection', index)}
													ondragover={(e) => handleDragOver(tagInfo.tag_name, 'ejection', index, e)}
													ondragend={handleDragEnd}
													ondragenter={handleDragEnter}
													ondragleave={handleDragLeave}
												>
													<div class="flex items-center">
														<span class="mr-2 cursor-grab text-gray-500">
															<svg
																width="10"
																height="16"
																viewBox="0 0 10 16"
																fill="none"
																xmlns="http://www.w3.org/2000/svg"
															>
																<path
																	d="M4 14C4 15.1 3.1 16 2 16C0.9 16 0 15.1 0 14C0 12.9 0.9 12 2 12C3.1 12 4 12.9 4 14ZM2 6C0.9 6 0 6.9 0 8C0 9.1 0.9 10 2 10C3.1 10 4 9.1 4 8C4 6.9 3.1 6 2 6ZM2 0C0.9 0 0 0.9 0 2C0 3.1 0.9 4 2 4C3.1 4 4 3.1 4 2C4 0.9 3.1 0 2 0ZM8 4C9.1 4 10 3.1 10 2C10 0.9 9.1 0 8 0C6.9 0 6 0.9 6 2C6 3.1 6.9 4 8 4ZM8 6C6.9 6 6 6.9 6 8C6 9.1 6.9 10 8 10C9.1 10 10 9.1 10 8C10 6.9 9.1 6 8 6ZM8 12C6.9 12 6 12.9 6 14C6 15.1 6.9 16 8 16C9.1 16 10 15.1 10 14C10 12.9 9.1 12 8 12Z"
																	fill="currentColor"
																/>
															</svg>
														</span>
														<h1>{formatRuleGroup(ruleGroup)}</h1>
													</div>
													<div class="flex gap-2">
														<button
															aria-label="edit button"
															class="cursor-pointer"
															onclick={() => editRule(tagInfo.tag_name, 'ejection', index)}
															title="Edit rule"
														>
															<svg width="15" height="15" viewBox="0 0 24 24" fill="none">
																<path
																	d="M16.474 5.408L18.592 7.526C18.8113 7.7453 18.8113 8.10067 18.592 8.32L10.48 16.432L7.89333 16.9387C7.17467 17.0653 6.568 16.4587 6.69467 15.74L7.20133 13.1533L15.3133 5.408C15.5333 5.18867 15.8773 5.18867 16.0973 5.408H16.474M21.7693 9.55067L19.04 12.28L19.04 6.61333C19.04 6.35733 18.8347 6.15333 18.5787 6.15333H17.1493V2.98933C17.1493 2.47467 16.7267 2.05333 16.2133 2.05333H7.78667C7.272 2.05333 6.85067 2.47467 6.85067 2.98933V6.15333H5.42133C5.16533 6.15333 4.96 6.35733 4.96 6.61333V19.6933C4.96 19.9493 5.16533 20.1533 5.42133 20.1533H18.5787C18.8347 20.1533 19.04 19.9493 19.04 19.6933V14.0267L21.7693 11.2973C22.744 10.3227 22.744 9.36267 21.7693 8.38933L21.7693 9.55067Z"
																	fill="black"
																	fill-opacity="0.28"
																/>
															</svg>
														</button>
														<button
															aria-label="delete button"
															onclick={() => deleteRule(tagInfo.tag_name, 'ejection', index)}
															title="Delete rule"
														>
															<svg
																width="10"
																height="13"
																viewBox="0 0 10 13"
																fill="none"
																xmlns="http://www.w3.org/2000/svg"
															>
																<path
																	d="M0.714294 11.5556C0.714294 12.3537 1.35357 13 2.14288 13H7.85719C8.64647 13 9.28574 12.3537 9.28574 11.5556V2.88892H0.714294V11.5556Z"
																	fill="black"
																	fill-opacity="0.28"
																/>
																<path
																	d="M7.50002 0.722211L6.78571 0H3.21429L2.49998 0.722211H0V2.16667H10V0.722211H7.50002"
																	fill="black"
																	fill-opacity="0.28"
																/>
															</svg>
														</button>
													</div>
												</div>
											{/each}
										{/if}
									</div>
								</div>
							{/if}
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
										d="M5.58496 0.900391C5.92537 0.900391 6.25329 1.03484 6.49414 1.27637L10.7236 5.50684H10.7246L10.8096 5.60059C10.9966 5.82899 11.0995 6.11628 11.0996 6.41406C11.0996 6.7544 10.9651 7.08141 10.7246 7.32227H10.7236L7.32227 10.7236V10.7246C7.08145 10.9651 6.7544 11.0996 6.41406 11.0996C6.0739 11.0995 5.74754 10.965 5.50684 10.7246V10.7236L1.27637 6.49414C1.18685 6.40468 1.11123 6.30259 1.05176 6.19141L0.998047 6.07715C0.933444 5.92124 0.900378 5.75373 0.900391 5.58496V2.18457C0.900391 1.47554 1.47554 0.900391 2.18457 0.900391H5.58496ZM2.1582 2.12012L2.13574 2.13574C2.12276 2.14873 2.11523 2.16622 2.11523 2.18457V5.58594C2.11526 5.5949 2.11668 5.60397 2.12012 5.6123L2.13574 5.63477L6.36523 9.86426L6.3877 9.87988L6.41406 9.88477C6.42334 9.88477 6.43315 9.88331 6.44141 9.87988L6.46387 9.86426L9.86426 6.46387L9.87988 6.44141L9.88477 6.41406L9.87988 6.3877L9.86426 6.36523L5.63477 2.13574L5.6123 2.12012C5.60397 2.11668 5.5949 2.11526 5.58594 2.11523H2.18457C2.17553 2.11523 2.16642 2.11677 2.1582 2.12012ZM4.38379 3.60742C4.58982 3.60742 4.78791 3.68929 4.93359 3.83496L4.98535 3.8916C5.0985 4.02974 5.16107 4.20366 5.16113 4.38379C5.16113 4.56388 5.09838 4.73782 4.98535 4.87598L4.93359 4.93359C4.78791 5.07927 4.58982 5.16113 4.38379 5.16113C4.20366 5.16107 4.02974 5.0985 3.8916 4.98535L3.83496 4.93359C3.68929 4.78791 3.60742 4.58982 3.60742 4.38379C3.6075 4.17786 3.68935 3.98058 3.83496 3.83496L3.8916 3.7832C4.02978 3.66995 4.20357 3.60749 4.38379 3.60742Z"
										fill="#37352F"
										stroke="#37352F"
										stroke-width="0.2"
									/>
								</svg>
								<p>{tagInfo.tag_type_name}</p>
							</span>
							<span class="mr-4 flex items-center justify-around gap-6">
								<button
									class="pe-2"
									aria-label="download button"
									onclick={() => downloadFile(tagInfo.file_path)}
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
								</button>
							</span>
						</div>
					</div>
				{/each}
				<div class="mt-5 gap-4">
					<Button
						color="dark"
						class="float-right text-nowrap"
						onclick={() => {
							saveRulesToBackend();
						}}
					>
						Continue with Added Rules
					</Button>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.rule-item {
		transition:
			background-color 0.2s ease,
			transform 0.1s ease;
	}
	.rule-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	.rule-item.dragging {
		opacity: 0.5;
		cursor: grabbing;
	}
	.rule-item.drag-over {
		border: 2px dashed #aaa;
	}
	.rule-item.drop-indicator {
		border: 2px solid #4a90e2;
		background-color: rgba(74, 144, 226, 0.1);
	}
	.rule-container {
		min-height: 50px;
		padding: 2px;
	}
	.pinned-rule {
		background-color: #5b6885;
		color: white;
	}
	.manual-rule {
		background-color: white;
		color: #5b6885;
		border-width: 1px;
		border-color: rgba(91, 104, 133, 0.25);
	}
</style>
