<script>
	import { Modal, Button, Toggle, Label, Input } from 'flowbite-svelte';
	import { rbiRulesModal } from '../../store/toogleModal.svelte';
	import { VITE_API_URL } from '$lib/constants';

	// Define props
	const { transaction_id, onApplyRules } = $props();

	// State for form data
	let rule1 = $state(true); // Remove duplicates
	let rule2 = $state(false); // EMI's & Cutoff Dates
	let rule3 = $state(false); // Difference between cutoff and maturity
	let rule4 = $state(false); // No Overdue/DPD = 0
	let rule5 = $state(false); // Remove restructured/rescheduled loans
	let cutoffDate = $state(''); // Cutoff date

	// Format date to DD/MM/YYYY
	function formatDate(date) {
		if (!date) return '01/01/2024'; // Default if not provided
		const [year, month, day] = date.split('-');
		return `${day}/${month}/${year}`;
	}

	// Log payload whenever a rule or cutoff date changes
	$effect(() => {
		const payload = {
			transaction_id: transaction_id,
			rule1,
			rule2,
			rule3,
			rule4,
			rule5,
			cutoff_date: formatDate(cutoffDate)
		};
		console.log('Payload:', payload);
	});

	// Handle form submission
	async function handleApplyRules() {
		const payload = {
			transaction_id: transaction_id,
			rule1,
			rule2,
			rule3,
			rule4,
			rule5,
			cutoff_date: formatDate(cutoffDate)
		};

		try {
			const response = await fetch(
				`${VITE_API_URL}/transaction_dataset/apply_rbi_rules`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(payload)
				}
			);

			if (!response.ok) {
				throw new Error('Failed to apply RBI rules');
			}

			const result = await response.json();
			// Pass the selected rules and API result to the parent component
			onApplyRules({
				rules: {
					rule1,
					rule2,
					rule3,
					rule4,
					rule5,
					cutoffDate: formatDate(cutoffDate)
				},
				success: true,
				data: result
			});
		} catch (error) {
			console.error('Error applying RBI rules:', error);
			// Pass error state to parent
			onApplyRules({
				rules: {
					rule1,
					rule2,
					rule3,
					rule4,
					rule5,
					cutoffDate: formatDate(cutoffDate)
				},
				success: false,
				error: error.message
			});
		}

		// Close the modal
		rbiRulesModal.isRbiRulesModalOpen = false;
	}
</script>

<Modal
	bind:open={rbiRulesModal.isRbiRulesModalOpen}
	title="Apply RBI Rules"
	classHeader="text-black"
>
	<div class="flex w-full flex-col gap-4 p-4">
		<div class="form-group flex items-center justify-between">
			<span class="flex flex-col gap-2">
				<Label for="rule_1"><h3 class="rule">Rule 1</h3></Label>
				<h2 class="">Remove duplicates</h2>
			</span>
			<Toggle color="blue" bind:checked={rule1}></Toggle>
		</div>
		<div class="form-group flex items-center justify-between">
			<span class="flex flex-col gap-2">
				<Label for="rule_2"><h3 class="rule">Rule 2</h3></Label>
				<h2 class="">EMI's & Cutoff Dates</h2>
			</span>
			<Toggle color="blue" bind:checked={rule2}></Toggle>
		</div>
		<div class="flex max-w-[30%] items-center justify-center gap-4">
			<Input class="" type="date" bind:value={cutoffDate} />
		</div>
		<div class="form-group flex items-center justify-between">
			<span class="flex flex-col gap-2">
				<Label for="rule_3"><h3 class="rule">Rule 3</h3></Label>
				<h2 class="">Difference between cutoff and maturity to be under 365 days</h2>
			</span>
			<Toggle color="blue" bind:checked={rule3}></Toggle>
		</div>
		<div class="form-group flex items-center justify-between">
			<span class="flex flex-col gap-2">
				<Label for="rule_4"><h3 class="rule">Rule 4</h3></Label>
				<h2 class="">No Overdue/DPD = 0</h2>
			</span>
			<Toggle color="blue" bind:checked={rule4}></Toggle>
		</div>
		<div class="form-group flex items-center justify-between">
			<span class="flex flex-col gap-2">
				<Label for="rule_5"><h3 class="rule">Rule 5</h3></Label>
				<h2 class="">Remove all Restructured / Rescheduled Loans</h2>
			</span>
			<Toggle color="blue" bind:checked={rule5}></Toggle>
		</div>
	</div>
	<div class="flex items-center justify-end">
		<Button color="dark" onclick={handleApplyRules}>Apply Rules</Button>
	</div>
</Modal>

<style>
	h2 {
		color: black;
	}

	.rule {
		color: gray;
	}
</style>
