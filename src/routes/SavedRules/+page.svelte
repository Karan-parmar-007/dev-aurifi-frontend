<script lang="ts">
	import {
		Button,
		Input,
		Modal,
		Navbar,
		NavBrand,
		NavHamburger,
		Select,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import { user_id, VITE_API_URL } from '$lib/constants';
	import { SideBar } from '../../store/toogleModal.svelte';
	import { onMount } from 'svelte';

	let { data } = $props();
	console.log('data: ', data);

	let currentTab = $state('Insertion');
	let isFormOpen = $state(false); // Modal closed by default
	let isLoading = $state(false);
	let rules = $state(data?.rules?.rules || []);
	let selectedRule = $state(null); // Store the selected rule for modal

	const fetchFiles = async () => {
		try {
			isLoading = true;
			const response = await fetch(`${VITE_API_URL}/rules_book_debt/get_all_rules/${user_id}`);

			if (!response.ok) {
				console.log('Response not OK: ', response.status, response.statusText);
				rules = [];
				console.log(response);
			}

			const result = await response.json();
			if (result.status !== 'success') {
				console.error('API Error: ', result.details);
				rules = [];
				isLoading = false;
				return;
			}
			rules = result.rules;
			isLoading = false;
		} catch (error) {
			console.error('error: ', error);
			isLoading = false;
		}
	};

	onMount(() => {
		fetchFiles();
	});

	const deleteRule = async (ruleId: string) => {
		try {
			isLoading = true;
			const response = await fetch(`${VITE_API_URL}/rules_book_debt/delete_rule/${ruleId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				console.error('Delete API Error: ', response.status, response.statusText);
				isLoading = false;
				return;
			}

			const result = await response.json();
			if (result.status !== 'success') {
				console.error('Delete API Error: ', result.details);
				isLoading = false;
				return;
			}

			// Refresh the rules list after successful deletion
			await fetchFiles();
		} catch (error) {
			console.error('Delete error: ', error);
			isLoading = false;
		}
	};

	const filteredRules = $derived(
		rules.filter((rule) => rule.type_of_rule === currentTab.toLowerCase())
	);

	// Function to open modal with selected rule
	const openRuleModal = (rule) => {
		selectedRule = rule;
		isFormOpen = true;
	};
</script>

<Modal
	size="md"
	class={`${currentTab === 'Insertion' ? 'bg-[#E9FFEF]' : 'bg-[#FFEDED]'}`}
	bind:open={isFormOpen}
>
	<div class="flex w-full flex-col gap-6 p-2">
		<div class="w-full flex-col items-center justify-center">
			<span class="flex items-center justify-center text-xl font-semibold text-[#000000DE]">
				{selectedRule?.rule_name || 'No Rule Selected'}
			</span>
			<span class="flex items-center justify-center font-medium text-[#00000080]">
				Pinned to: {selectedRule?.pin ? selectedRule.tag_name : 'None'}
			</span>
		</div>
		{#if selectedRule?.rules?.[0]}
			{#each selectedRule.rules[0] as rule, index}
				<div class="flex flex-col gap-4">
					<span class="flex items-center gap-6">
						<h3>{'IF'}</h3>
						<Input
							type="text"
							value={rule.column}
							disabled
							class="cursor-not-allowed bg-gray-100"
						/>
					</span>
					<span class="flex items-center gap-6">
						<Select value={rule.operator} disabled class="cursor-not-allowed bg-gray-100">
							<option value="equal to">equal to</option>
							<option value="less than">less than</option>
							<option value="greater than">greater than</option>
							<option value="includes">includes</option>
						</Select>
						<Input type="text" value={rule.value} disabled class="cursor-not-allowed bg-gray-100" />
					</span>
					<span class="flex w-full items-center justify-center">{rule.connector}</span>
					{#if rule.then}
						<span class="flex items-center gap-6">
							<Select value={rule.then} disabled class="cursor-not-allowed bg-gray-100">
								<option value="accept">accept</option>
								<option value="reject">reject</option>
							</Select>
						</span>
					{/if}
				</div>
			{/each}
		{:else}
			<p class="text-center text-gray-500">No rules defined</p>
		{/if}
	</div>
</Modal>

<div class="absolute w-full px-8 py-4">
	<Navbar>
		<NavBrand class="flex gap-4 px-6">
			<button aria-label="sidebar button" onclick={() => (SideBar.isSideBarVisible = false)}>
				<svg
					class="h-6 w-6 text-gray-800 dark:text-white"
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						stroke="currentColor"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="m7 10 1.99994 1.9999-1.99994 2M12 5v14M5 4h14c.5523 0 1 .44772 1 1v14c0 .5523-.4477 1-1 1H5c-.55228 0-1-.4477-1-1V5c0-.55228.44772-1 1-1Z"
					/>
				</svg>
			</button>
			<button onclick={() => (currentTab = 'Insertion')}>
				<h1
					class="text-2xl font-bold"
					class:text-black={currentTab === 'Insertion'}
					class:text-[#0000005e]={currentTab !== 'Insertion'}
				>
					Insertion Rules
				</h1>
			</button>
			<button onclick={() => (currentTab = 'Ejection')}>
				<h1
					class="cursor-pointer text-2xl font-bold"
					class:text-black={currentTab === 'Ejection'}
					class:text-[#0000005e]={currentTab !== 'Ejection'}
				>
					Ejection Rules
				</h1>
			</button>
		</NavBrand>
		<div class="flex gap-4 md:order-2">
			<NavHamburger />
			<Button
				color="light"
				class="text-primaryBlue-100 cursor-pointer gap-2 rounded-xl border-none bg-[#F0F7FF] hover:bg-[#dfecfc]"
			>
				<svg
					width="21"
					height="21"
					viewBox="0 0 21 21"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M18.679 2.32044C17.2756 0.916992 15.0168 0.916992 10.4992 0.916992C5.98154 0.916992 3.72273 0.916992 2.31929 2.32044C1.59336 3.04636 1.24291 4.00114 1.07373 5.37897C1.58229 4.81292 2.19335 4.34139 2.87952 3.99177C3.62844 3.61017 4.43037 3.45543 5.31828 3.38288C6.17612 3.3128 7.23164 3.31281 8.52228 3.31283H12.476C13.7667 3.31281 14.8222 3.3128 15.68 3.38288C16.568 3.45543 17.3699 3.61017 18.1188 3.99177C18.8049 4.34139 19.4161 4.81292 19.9246 5.37897C19.7554 4.00114 19.405 3.04636 18.679 2.32044Z"
						fill="url(#paint0_linear_2900_7106)"
					/>
					<path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M0.916504 12.4167C0.916504 9.73305 0.916504 8.39129 1.43877 7.3663C1.89815 6.46469 2.63119 5.73165 3.5328 5.27226C4.5578 4.75 5.89959 4.75 8.58317 4.75H12.4165C15.1001 4.75 16.4419 4.75 17.4669 5.27226C18.3685 5.73165 19.1016 6.46469 19.5609 7.3663C20.0832 8.39129 20.0832 9.73305 20.0832 12.4167C20.0832 15.1003 20.0832 16.4421 19.5609 17.4671C19.1016 18.3687 18.3685 19.1017 17.4669 19.561C16.4419 20.0833 15.1001 20.0833 12.4165 20.0833H8.58317C5.89959 20.0833 4.5578 20.0833 3.5328 19.561C2.63119 19.1017 1.89815 18.3687 1.43877 17.4671C0.916504 16.4421 0.916504 15.1003 0.916504 12.4167ZM11.008 15.7999C10.8733 15.9347 10.6904 16.0104 10.4998 16.0104C10.3092 16.0104 10.1264 15.9347 9.99163 15.7999L7.59577 13.404C7.31509 13.1233 7.31509 12.6683 7.59577 12.3876C7.87646 12.1069 8.33155 12.1069 8.61221 12.3876L9.78109 13.5564V9.54167C9.78109 9.14473 10.1029 8.82292 10.4998 8.82292C10.8968 8.82292 11.2186 9.14473 11.2186 9.54167V13.5564L12.3875 12.3876C12.6682 12.1069 13.1232 12.1069 13.4039 12.3876C13.6846 12.6683 13.6846 13.1233 13.4039 13.404L11.008 15.7999Z"
						fill="url(#paint1_linear_2900_7106)"
					/>
					<defs>
						<linearGradient
							id="paint0_linear_2900_7106"
							x1="14.9417"
							y1="15.6663"
							x2="10.8024"
							y2="0.983832"
							gradientUnits="userSpaceOnUse"
						>
							<stop stop-color="#0070FF" />
							<stop offset="1" stop-color="#015ED4" />
						</linearGradient>
						<linearGradient
							id="paint1_linear_2900_7106"
							x1="15.0168"
							y1="55.4352"
							x2="-12.1843"
							y2="26.888"
							gradientUnits="userSpaceOnUse"
						>
							<stop stop-color="#0070FF" />
							<stop offset="1" stop-color="#015ED4" />
						</linearGradient>
					</defs>
				</svg>

				Download Sample File
			</Button>
			<Button color="dark" class="bg-dark-100 cursor-pointer rounded-xl text-white">
				+ New Transaction
			</Button>
		</div>
	</Navbar>
</div>

<div class="flex h-[100vh] w-full flex-col items-center justify-center pt-12">
	<div class="flex h-[85%] w-[90%] items-center justify-center rounded-3xl">
		{#if isLoading}
			<div class="flex items-center justify-center">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
				></div>
				<span class="ml-2">Loading...</span>
			</div>
		{:else if filteredRules && filteredRules.length > 0}
			<div
				class="h-full w-full overflow-y-scroll [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
			>
				<Table divClass={'w-full'} class="border-separate border-spacing-y-2">
					<TableHead class="bg-transparent">
						<TableHeadCell class="w-[300px]">Rule Name</TableHeadCell>
						<TableHeadCell>Pinned To</TableHeadCell>
						<TableHeadCell></TableHeadCell>
						<TableHeadCell></TableHeadCell>
						<TableHeadCell></TableHeadCell>
						<TableHeadCell></TableHeadCell>
						<TableHeadCell></TableHeadCell>
					</TableHead>
					<TableBody tableBodyClass="divide-y">
						{#each filteredRules as rule}
							<TableBodyRow class="bg-[#F9FAFB]">
								<TableBodyCell class="max-w-[300px] truncate rounded-md" title={rule.rule_name}>
									{rule.rule_name}
								</TableBodyCell>
								<TableBodyCell>{rule.pin ? rule.tag_name : 'None'}</TableBodyCell>
								<TableBodyCell></TableBodyCell>
								<TableBodyCell></TableBodyCell>
								<TableBodyCell></TableBodyCell>
								<TableBodyCell>
									<button
										aria-label="view details"
										class="cursor-pointer text-[#2362EB]"
										onclick={() => openRuleModal(rule)}
									>
										View Details
									</button>
								</TableBodyCell>
								<TableBodyCell class="rounded-md">
									<button
										aria-label="Delete"
										class="cursor-pointer text-[#2362EB]"
										onclick={() => deleteRule(rule._id)}
									>
										Delete
									</button>
								</TableBodyCell>
							</TableBodyRow>
						{/each}
					</TableBody>
				</Table>
			</div>
		{:else}
			<p class="opacity-50">No {currentTab} Rules Saved</p>
		{/if}
	</div>
</div>

<style>
	.button-group {
		cursor: pointer;
	}
</style>
