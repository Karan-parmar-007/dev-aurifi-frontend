<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { additionalRuleModal } from '../../store/toogleModal.svelte';
	import AdditionalRuleModalForm from './AdditionalRuleModalForm.svelte';

	interface Rule {
		name: string;
		inputRows: number;
		accepted: number;
		rejected: number;
		isProcessing: boolean;
	}

	// State to track applied rules and their status
	let appliedRules = $state<Rule[]>([]);

	// State to control visibility of second Original File section
	let showSecondFileSection = $state(false);

	// Function to handle rule application
	function handleRuleApplied() {
		console.log('handleRuleApplied called');
		// Add new rule with processing state
		appliedRules = [
			...appliedRules,
			{
				name: 'Processing...',
				inputRows: 500,
				accepted: 0,
				rejected: 0,
				isProcessing: true
			}
		];

		// Simulate backend processing
		setTimeout(() => {
			appliedRules = appliedRules.map((rule, index) =>
				index === appliedRules.length - 1
					? { ...rule, name: 'Rule Name', isProcessing: false, accepted: 480, rejected: 20 }
					: rule
			);
			showSecondFileSection = true; // Show second file section after first rule is applied
		}, 2000); // Simulate 2-second processing delay
	}

	// Function to handle new rule addition
	function handleNewRule() {
		additionalRuleModal.isAdditionalRuleModalOpen = true;
	}
</script>

{#if additionalRuleModal.isAdditionalRuleModalOpen}
	<AdditionalRuleModalForm onApply={handleRuleApplied} />
{/if}

<div class="flex h-full flex-col gap-2 px-4 py-8">
	<div class="flex w-full flex-col">
		<span class="flex w-full items-center justify-between">
			<span class="flex items-center justify-center">
				<img src="/excel.png" alt="excel icon" width="40" />
				Original File
			</span>
			<!-- {#if appliedRules.length === 0 || appliedRules[appliedRules.length - 1].isProcessing === false}
				<Button
					color="blue"
					class="h-[38px] w-[111px] text-nowrap bg-[#0161DB]"
					onclick={() => {
						additionalRuleModal.isAdditionalRuleModalOpen = true;
					}}>+ Apply Rule</Button
				>
			{/if} -->
			{#if !showSecondFileSection}
				<Button
					color="blue"
					class="h-[38px] w-[111px] text-nowrap bg-[#0161DB]"
					onclick={() => {
						additionalRuleModal.isAdditionalRuleModalOpen = true;
					}}>+ Apply Rule</Button
				>
			{/if}
		</span>

		<div class="rule-container mx-auto flex w-[90%] flex-col items-end justify-center">
			{#each appliedRules as rule, index}
				<div class="my-2 flex w-[{90 - index * 5}%] justify-end gap-2">
					<h3 class="">Input Rows: {rule.inputRows}</h3>
					<span
						class="h-[90%] w-[60%] rounded-md bg-[#FFC45B33] px-2 py-1 text-sm font-normal text-[#6B480D]"
						>{rule.name}</span
					>
					<div class="indicator-group flex items-center justify-center gap-2">
						<span
							class=" flex h-[26px] items-center rounded-md border-[1px] border-[#08FF00] bg-[#E9FFEF] px-2 text-xs font-semibold text-black"
							>Accepted: {rule.accepted}</span
						>
						<span
							class=" flex h-[26px] items-center rounded-md border-[1px] border-[#FF0000] bg-[#FFEDED] px-2 text-xs font-semibold text-black"
							>Rejected: {rule.rejected}</span
						>
					</div>
				</div>
				{#if index === appliedRules.length - 1 && !rule.isProcessing}
					<Button
						color="blue"
						class="h-[38px] w-[111px] text-nowrap bg-[#0161DB]"
						onclick={handleNewRule}>+ New Rule</Button
					>
				{/if}
			{/each}
		</div>
	</div>

	{#if showSecondFileSection}
		<hr class="mx-auto my-4 w-[90%] border-[1.5px] border-gray-300" />
		<div class="flex">
			<span class="flex w-full items-center justify-between">
				<span class="flex items-center justify-center">
					<img src="/excel.png" alt="excel icon" width="40" />
					Original File
				</span>
				<Button
					color="blue"
					class="h-[38px] w-[111px] text-nowrap bg-[#0161DB]"
					onclick={() => {
						additionalRuleModal.isAdditionalRuleModalOpen = true;
					}}>+ Apply Rule</Button
				>
			</span>
		</div>
	{/if}
</div>
