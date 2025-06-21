<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import BreadCrumb from '$lib/components/BreadCrumb.svelte';
	import CustomTable from '$lib/components/CustomTable.svelte';
	import { Button } from 'flowbite-svelte';
	import { deleteModal, RuleModal } from '../../../../store/toogleModal.svelte.js';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	// Basic state
	let isloading = $state(false);
	let path = page.url.pathname;
	let urlParts = path.split('/');
	let project_id = urlParts[3];
	let currentFile = $state('');

	// Rule management state
	let editingRuleIndex = $state(null);
	let fileRules = $state([]);

	// Component props
	let { data } = $props();
	console.log('data: ', data);
	const fileData = $state(data?.result?.data || { rows: [], columns: [] });
	console.log('fileData: ', fileData);
	const allColumns = $derived(fileData.columns || []);
	const initialColumnsToDisplay = allColumns?.slice(0, 10);

	let applying_rules = $state(false);

	onMount(() => {
		if (browser) {
			currentFile = localStorage.getItem('currentFile') || 'No file selected';
		}
	});

	// Function to open the rule modal
	function openRuleModal() {
		editingRuleIndex = null;
		editingRuleData = null;
		RuleModal.isRuleModalOpen = true;
	}

	// Function to edit an existing rule
	function editRule(index) {
		editingRuleIndex = index;
		editingRuleData = fileRules[index];
		RuleModal.isRuleModalOpen = true;
	}

	// Function to delete a rule
	function deleteRule(index) {
		deletingRuleIndex = index;
		deleteModal.isDeleteModalOpen = true;

		// Set up the callback for when user confirms deletion
		deleteModal.onConfirmDelete = (confirmedIndex) => {
			fileRules.splice(confirmedIndex, 1);
			fileRules = [...fileRules]; // Trigger reactivity
			deletingRuleIndex = null;
		};
	}

	// Function to process rules from modal
	function processRules(rules) {
		// If we're editing an existing rule, replace it
		if (editingRuleIndex !== null) {
			fileRules[editingRuleIndex] = rules;
			// Reset editing state
			editingRuleIndex = null;
			editingRuleData = null;
		} else {
			// Otherwise add a new rule
			fileRules = [...fileRules, rules];
		}

		// Close the modal
		RuleModal.isRuleModalOpen = false;

		// Create a preview of what will be sent to the backend
		const previewData = {
			project_id: project_id,
			file_rules: fileRules
		};

		// Log the preview data (in a real app, you'd send this to the backend)
		console.log('Preview of data to be sent to backend:', previewData);

		// Return a result to the child component
		return {
			success: true,
			message: `Successfully added rule`
		};
	}

	// Function to format a single rule for display
	function formatRule(rule) {
		if (!rule) return '';

		let ruleText = `IF ${rule.column} ${rule.operator} "${rule.value}"`;

		if (rule.connector && rule.connector !== 'THEN') {
			ruleText += ` ${rule.connector}`;
		} else if (rule.then) {
			ruleText += ` THEN ${rule.then}`;
		}

		return ruleText;
	}

	// Format a rule group for display
	function formatRuleGroup(ruleGroup) {
		if (!ruleGroup || !Array.isArray(ruleGroup)) return '';
		return ruleGroup.map((rule) => formatRule(rule)).join(' ');
	}

	// Get appropriate color for rule based on "then" value
	function getRuleColor(rule) {
		if (!rule || !Array.isArray(rule) || rule.length === 0) return 'bg-gray-100';

		const lastRule = rule[rule.length - 1];
		if (lastRule.then === 'accept') return 'bg-[#e9ffef] border-[#08FF00]';
		if (lastRule.then === 'reject') return 'bg-[#ffeded] border-[#FF0000]';
		return 'bg-gray-100';
	}

	// Function to apply the rules and send to backend (mock implementation)
	function applyRules() {
		isloading = true;

		// In a real app, you'd make an API call here
		setTimeout(() => {
			// Mock success
			isloading = false;
			applying_rules = false;

			// You could show a success message here
			alert('Rules applied successfully!');
		}, 1500);
	}
</script>

<div class="flex h-[100vh] w-full flex-col">
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
		<div class={`${applying_rules ? '' : 'bg-[#F9FCF9] '}`}>
			<div class="flex h-full flex-col gap-2 px-4 py-6">
				<span class="my-4 flex items-center gap-2">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M23.25 12C23.25 12.96 22.0706 13.7512 21.8344 14.6362C21.5906 15.5512 22.2075 16.8263 21.7444 17.6269C21.2738 18.4406 19.8581 18.5381 19.1981 19.1981C18.5381 19.8581 18.4406 21.2738 17.6269 21.7444C16.8263 22.2075 15.5512 21.5906 14.6362 21.8344C13.7512 22.0706 12.96 23.25 12 23.25C11.04 23.25 10.2487 22.0706 9.36375 21.8344C8.44875 21.5906 7.17375 22.2075 6.37313 21.7444C5.55938 21.2738 5.46187 19.8581 4.80188 19.1981C4.14188 18.5381 2.72625 18.4406 2.25563 17.6269C1.7925 16.8263 2.40938 15.5512 2.16563 14.6362C1.92938 13.7512 0.75 12.96 0.75 12C0.75 11.04 1.92938 10.2487 2.16563 9.36375C2.40938 8.44875 1.7925 7.17375 2.25563 6.37313C2.72625 5.55938 4.14188 5.46187 4.80188 4.80188C5.46187 4.14188 5.55938 2.72625 6.37313 2.25563C7.17375 1.7925 8.44875 2.40938 9.36375 2.16563C10.2487 1.92938 11.04 0.75 12 0.75C12.96 0.75 13.7512 1.92938 14.6362 2.16563C15.5512 2.40938 16.8263 1.7925 17.6269 2.25563C18.4406 2.72625 18.5381 4.14188 19.1981 4.80188C19.8581 5.46187 21.2738 5.55938 21.7444 6.37313C22.2075 7.17375 21.5906 8.44875 21.8344 9.36375C22.0706 10.2487 23.25 11.04 23.25 12Z"
							fill="#148247"
						/>
						<path
							d="M15.2521 8.64754L10.9696 12.93L8.74961 10.7119C8.26773 10.23 7.48586 10.23 7.00398 10.7119C6.52211 11.1938 6.52211 11.9757 7.00398 12.4575L10.1184 15.5719C10.5871 16.0407 11.3484 16.0407 11.8171 15.5719L16.9959 10.3932C17.4777 9.91129 17.4777 9.12941 16.9959 8.64754C16.514 8.16566 15.734 8.16566 15.2521 8.64754Z"
							fill="#FFFCEE"
						/>
					</svg>
					<h2 class="font-semibold text-[#148247]">Data is Fully Sanitised!</h2>
				</span>

				{#if isloading}
					<div class="flex items-center justify-center">
						<div
							class="border-primary h-12 w-12 animate-spin rounded-full border-4 border-solid border-t-transparent"
						></div>
						<p class="ml-2">Processing...</p>
					</div>
				{:else}
					<!-- Table view -->
					<CustomTable
						data={fileData.rows}
						columns={allColumns}
						initialSelectedColumns={initialColumnsToDisplay}
						showDownloadButton={true}
						downloadPath={data.result.data.file_location}
					/>
					<div class="flex w-full items-center justify-end">
						<Button
							color="green"
							class={`mt-6 h-[38px] w-[200px] text-nowrap `}
							onclick={() => {
								goto(`/Transactions/custom_rules/${project_id}`);
							}}>APPLY ADDITIONAL RULES</Button
						>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
