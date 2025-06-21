<script>
	import BreadCrumb from '$lib/components/BreadCrumb.svelte';
	import Table from '$lib/components/CustomTable.svelte';
	import {
		Button,
		Table as FlowbiteTable,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import { rbiRulesModal } from '../../../../store/toogleModal.svelte.js';
	import RbiRulesModalForm from '$lib/components/RBIRulesModalForm.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { VITE_API_URL } from '$lib/constants.js';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let currentFile = $state('');
	let isloading = $state(false);
	let path = page.url.pathname;
	let urlParts = path.split('/');
	let project_id = urlParts[3];
	let transaction_id = project_id;

	let isProcessing = $state(false);
	let processCompleted = $state(false);
	let errorMessage = $state('');
	let { data } = $props();

	// Log data for debugging
	console.log('Data received:', data);

	// State for file data with fallback
	const fileData = $state(data?.result?.data || { columns: [], rows: [] });

	// Derived columns with fallback
	const allColumns = $derived(fileData.columns || []);

	// Ensure initialColumnsToDisplay is only computed when allColumns is defined
	const initialColumnsToDisplay = $derived(allColumns.length > 0 ? allColumns.slice(0, 10) : []);

	// State to track applied rules
	let appliedRules = $state({
		rule1: false,
		rule2: false,
		rule3: false,
		rule4: false,
		rule5: false,
		cutoffDate: ''
	});

	// State to track API response data
	let apiResponseData = $state(null);

	// State to track if rules have been applied
	let rulesApplied = $state(false);

	onMount(() => {
		if (browser) {
			currentFile = localStorage.getItem('currentFile') || 'No file selected';
		}
	});

	// Handler for when rules are applied, with additional GET API call
	async function handleApplyRules({ rules, success, error }) {
		appliedRules = rules;
		rulesApplied = true;
		isProcessing = true;

		if (success) {
			try {
				const response = await fetch(
					`${VITE_API_URL}/transaction_dataset/fetch_rbi_rules_applied_data/${transaction_id}`
				);
				if (!response.ok) {
					throw new Error('Failed to fetch RBI rules applied data');
				}
				apiResponseData = await response.json();
				console.log('API Response:', apiResponseData);
				isProcessing = false;
				processCompleted = true;
				errorMessage = '';
			} catch (err) {
				isProcessing = false;
				processCompleted = false;
				errorMessage = err.message || 'Failed to fetch data';
			}
		} else {
			isProcessing = false;
			processCompleted = false;
			errorMessage = error || 'Failed to apply rules. Please try again.';
		}
	}

	// Handler for Continue button to save temp to final before navigating
	async function handleContinue() {
		try {
			const response = await fetch(
				`${VITE_API_URL}/transaction_dataset/save_rbi_rules_applied_temp_to_final`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ transaction_id })
				}
			);
			if (!response.ok) {
				throw new Error('Failed to save temporary file to final');
			}
			// Proceed to navigation if the API call is successful
			goto(`/Transactions/sanitised_data/${project_id}`);
		} catch (err) {
			errorMessage = err.message || 'Failed to process Continue action';
			console.error('Continue error:', err);
		}
	}

	$effect(() => {
		$inspect('isProcessing:', isProcessing);
		$inspect('processCompleted:', processCompleted);
		$inspect('errorMessage:', errorMessage);
	});

	// Helper function to format numbers with commas, with safety checks
	function formatNumber(num) {
		if (num === null || num === undefined || isNaN(num)) {
			return '0';
		}
		return Number(num).toLocaleString('en-IN');
	}
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
		<div class="flex h-full flex-col gap-2 px-4 py-6">
			{#if !rulesApplied}
				<h2 class="font-semibold">RBI Rule 1</h2>
				<span class="flex items-center justify-between gap-6 pb-6 font-normal">
					<p class="text-gray-500">Check by loan ID and remove duplicates</p>
					<Button
						color="blue"
						class="bg-[#0161DB]"
						onclick={() => (rbiRulesModal.isRbiRulesModalOpen = true)}>Apply Rules</Button
					>
				</span>
				{#if rbiRulesModal.isRbiRulesModalOpen}
					<RbiRulesModalForm {transaction_id} onApplyRules={handleApplyRules} />
				{/if}
				{#if isloading}
					<p>loading ...</p>
				{:else}
					<div class="flex flex-1 flex-col gap-4 py-4">
						{#if allColumns.length > 0}
							<Table
								data={fileData.rows}
								columns={allColumns}
								initialSelectedColumns={initialColumnsToDisplay}
								showDownloadButton={false}
							/>
						{:else}
							<p>No data available to display.</p>
						{/if}
						<div class="flex items-center justify-end py-10"></div>
					</div>
				{/if}
			{:else}
				<h2 class="font-semibold">Applying RBI Rules</h2>
				{#if isProcessing && !processCompleted}
					<p>Processing rules...</p>
				{:else if errorMessage}
					<p class="text-red-500">{errorMessage}</p>
				{:else}
					<div class="flex flex-1 flex-col gap-4 py-4">
						<FlowbiteTable>
							<TableHead>
								<TableHeadCell>Rules</TableHeadCell>
								<TableHeadCell>Accepted Entries</TableHeadCell>
								<TableHeadCell>Rejected Entries</TableHeadCell>
								<TableHeadCell>Status</TableHeadCell>
							</TableHead>
							<TableBody>
								{#each apiResponseData?.rules_data || [] as rule, index}
									<TableBodyRow class={index % 2 === 1 ? 'bg-gray-100' : ''}>
										<TableBodyCell>
											<span class="flex flex-col justify-center">
												<h3 class="font-semibold text-black">
													RBI Rule {rule.rule_number}
												</h3>
												<h3 class="font-medium text-[#7C7C7C]">{rule.rule_name}</h3>
											</span>
										</TableBodyCell>
										<TableBodyCell>
											<span class="flex flex-col justify-center">
												<h3 class="font-semibold text-[#04940E]">
													{formatNumber(rule.rows_left)} Loans
												</h3>
												<h3 class="font-semibold">
													{formatNumber(rule.loan_amount_left)}/-
												</h3>
											</span>
										</TableBodyCell>
										<TableBodyCell>
											<span class="flex flex-col justify-center">
												<h3 class="font-semibold text-[#EA5044]">
													{formatNumber(rule.rows_removed)} Loans
												</h3>
												<h3 class="font-semibold">
													{formatNumber(rule.loan_amount_removed)}/-
												</h3>
											</span>
										</TableBodyCell>
										<TableBodyCell>
											<span class="flex items-center gap-2">
												<svg
													width="10"
													height="10"
													viewBox="0 0 10 10"
													fill="none"
													xmlns="http://www.w3.org/2000/svg"
												>
													<g clip-path="url(#clip0_115_2038)">
														<path
															d="M9.69667 3.35068L4.41087 8.6365C4.21863 8.82919 3.95805 8.93814 3.68587 8.93965C3.68343 8.93965 3.68101 8.9398 3.67859 8.9398C3.67616 8.9398 3.67372 8.93966 3.6713 8.93963C3.64827 8.93947 3.62526 8.93842 3.60228 8.93672C3.58405 8.93541 3.56582 8.9336 3.54759 8.93127C3.52526 8.92843 3.50296 8.92513 3.48081 8.92086C3.47886 8.92047 3.47691 8.91996 3.47495 8.91959C3.45208 8.91502 3.42941 8.90951 3.40683 8.9034C3.38456 8.89736 3.36243 8.89078 3.34052 8.88322C3.33901 8.88269 3.33749 8.88228 3.33599 8.88175C3.33296 8.8807 3.32997 8.87945 3.32696 8.87836C3.28237 8.86237 3.23894 8.84331 3.19698 8.82132C3.17595 8.81027 3.15532 8.79816 3.13491 8.78554C3.09659 8.76199 3.05986 8.73594 3.02495 8.70757C3.0114 8.69652 2.99806 8.68507 2.98493 8.67322C2.97181 8.66137 2.95893 8.64913 2.9463 8.6365L0.303311 5.99361C0.109103 5.7994 -1.83139e-06 5.53599 0 5.26134C1.83143e-06 4.98668 0.10911 4.72328 0.303321 4.52907C0.497533 4.33486 0.760939 4.22576 1.03559 4.22576C1.31025 4.22576 1.57365 4.33487 1.76786 4.52908L3.67853 6.43972L8.23212 1.88611C8.32818 1.78947 8.44237 1.71273 8.56814 1.6603C8.69391 1.60787 8.82879 1.58077 8.96505 1.58057C9.10132 1.58036 9.23628 1.60705 9.36221 1.6591C9.48814 1.71115 9.60256 1.78754 9.69891 1.88389C9.79526 1.98025 9.87165 2.09467 9.9237 2.2206C9.97575 2.34653 10.0024 2.48149 10.0022 2.61775C10.002 2.75401 9.97492 2.88889 9.92249 3.01467C9.87005 3.14044 9.79332 3.25462 9.69667 3.35068Z"
															fill="#109135"
														/>
													</g>
													<defs>
														<clipPath id="clip0_115_2038">
															<rect width="10" height="10" fill="white" />
														</clipPath>
													</defs>
												</svg>
												<h2 class="font-semibold text-[#109135]">Completed</h2>
											</span>
										</TableBodyCell>
									</TableBodyRow>
								{/each}
								{#if apiResponseData?.summary}
									<TableBodyRow class="bg-[#F7FBFE]">
										<TableBodyCell>
											<h2 class="font-semibold text-[#0161DB]">Final File</h2>
										</TableBodyCell>
										<TableBodyCell>
											<span class="flex flex-col justify-center">
												<h3 class="font-semibold text-[#04940E]">
													{formatNumber(apiResponseData.final_stats?.total_rows || 0)} Loans
												</h3>
												<h3 class="font-semibold">
													{formatNumber(apiResponseData.final_stats?.total_loan_amount || 0)}/-
												</h3>
											</span>
										</TableBodyCell>
										<TableBodyCell>
											<span class="flex flex-col justify-center">
												<h3 class="font-semibold text-[#04940E]">
													{formatNumber(apiResponseData.summary?.total_rows_removed || 0)} Loans
												</h3>
												<h3 class="font-semibold">
													{formatNumber(apiResponseData.summary?.total_loan_amount_removed || 0)}/-
												</h3>
											</span>
										</TableBodyCell>
										<TableBodyCell>
											{#if apiResponseData.file_info?.file_path}
												<a
													href={`${VITE_API_URL}/project/download_file?file_path=${encodeURIComponent(apiResponseData.file_info.file_path)}`}
													download
													class="flex cursor-pointer gap-2 text-[#0161DB]"
												>
													<h2>Download</h2>
												</a>
											{:else}
												<p>No file available for download</p>
											{/if}
										</TableBodyCell>
									</TableBodyRow>
								{/if}
							</TableBody>
						</FlowbiteTable>

						<div class="flex w-full items-center justify-between">
							<Button
								color="dark"
								class="mt-20 h-[38px] w-[144px]"
								onclick={() => {
									rulesApplied = false;
								}}>Reapply Rules</Button
							>
							<Button color="dark" class="mt-20 h-[38px] w-[144px]" onclick={handleContinue}
								>Continue</Button
							>
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>
