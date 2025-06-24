<script lang="ts">
	import { Modal, Input, Button, Label, Checkbox, Select } from 'flowbite-svelte';
	import { InsertionModal } from '../../store/toogleModal.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { VITE_API_URL, user_id } from '$lib/constants';

	// Receive the function from parent as a prop and initial data for editing
	let {
		processRules,
		initialData = null,
		tagName = null,
		cleanup
	}: {
		processRules: (rules: any[], type: string) => { success: boolean; message: string };
		initialData?: any[] | null;
		tagName?: string | null;
		cleanup: () => Promise<void>;
	} = $props();

	// Define Rule type
	type Rule = {
		column: string;
		operator: string;
		value: string | number;
		connector: 'THEN' | 'AND' | 'OR';
		then: string;
	};

	// Default empty rule
	const defaultRule: Rule = {
		column: '',
		operator: 'includes',
		value: '',
		connector: 'THEN',
		then: 'accept'
	};

	// Reactive state with default rules
	let rules = $state<Rule[]>([{ ...defaultRule }]);

	let pageUrl = page.url.pathname;
	let urlParts = pageUrl.split('/');
	let projectId = urlParts[3];

	const operators = ['includes', 'less than', 'greater than', 'equal to'];

	let isLoading = $state(false);
	let columns = $state<string[]>([]);
	let datatypeMapping = $state<Record<string, string>>({});
	let savingRules = $state(false);
	let ruleName = $state<string>('');
	let pinRule = $state<boolean>(false);
	let errorMessage = $state<string>('');
	let savedRules = $state<any[]>([]);
	let selectedRuleId = $state<string>('');

	// Reset form state when modal opens for new rule or closes
	onDestroy(() => {
		console.log('Modal component destroyed, resetting form');
		// rules = [{ ...defaultRule }];
		console.log('calling cleanup');
		cleanup();
	});

	// If initialData is provided, use it for editing
	$effect(() => {
		console.log('this effect was called');
		if (initialData) {
			console.log('initial data found: ', initialData);
			rules = initialData.map((rule) => ({ ...rule }));
			const matchingRule = savedRules.find(
				(rule) => JSON.stringify(rule.rules.flat()) === JSON.stringify(initialData)
			);
			if (matchingRule) {
				selectedRuleId = matchingRule._id;
				ruleName = matchingRule.rule_name;
				pinRule = matchingRule.pin;
				tagName = matchingRule.tag_name;
			} else {
				selectedRuleId = '';
				ruleName = '';
				pinRule = false;
			}
		}
	});

	// Update form when a rule is selected from dropdown
	$effect(() => {
		if (selectedRuleId) {
			const selectedRule = savedRules.find((rule) => rule.rule_id === selectedRuleId);
			if (selectedRule) {
				rules = selectedRule.rules.flat().map((rule: Rule) => ({ ...rule })); // Flatten the nested rules array
				ruleName = selectedRule.rule_name;
				pinRule = selectedRule.pin;
				tagName = selectedRule.tag_name;
			}
		}
	});

	function addRule(index: number, connector: 'THEN' | 'AND' | 'OR') {
		rules.splice(index + 1, 0, { ...defaultRule, connector: 'THEN', then: '' });
		rules[index].connector = connector;
	}

	function removeRule(index: number, event?: Event) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		if (rules.length > 1) {
			rules.splice(index, 1);
			if (index < rules.length && index > 0) {
				rules[index - 1].connector = rules[index]?.connector || 'THEN';
			}
		}
	}

	function handleConnectorChange(index: number, newConnector: 'THEN' | 'AND' | 'OR' | '') {
		if (newConnector && newConnector !== 'THEN') {
			// Add a new rule when AND/OR is selected
			addRule(index, newConnector as 'AND' | 'OR');
		} else if (!newConnector && rules.length > 1) {
			// Remove the next rule when connector is removed
			removeRule(index + 1);
		} else if (newConnector) {
			// Just update the connector
			rules[index].connector = newConnector;
		}
	}

	// Separate update functions to prevent cross-field resets
	function updateColumn(index: number, value: string) {
		rules[index].column = value;
		// Reset value when column changes
		rules[index].value = '';
	}

	function updateOperator(index: number, value: string) {
		rules[index].operator = value;
	}

	function updateValue(index: number, value: string) {
		rules[index].value = value;
	}

	function updateThen(index: number, value: string) {
		rules[index].then = value;
	}

	// Get input type based on column's datatype
	function getInputType(columnName: string): string {
		if (!columnName || !datatypeMapping[columnName]) return 'text';
		const datatype = datatypeMapping[columnName].toLocaleLowerCase();
		switch (datatype) {
			case 'number':
			case 'integer':
			case 'float':
			case 'double':
				return 'number';
			case 'date':
				return 'date';
			case 'datetime':
				return 'datetime-local';
			case 'boolean':
				return 'checkbox';
			default:
				return 'text';
		}
	}

	// Get appropriate operators based on column's datatype
	function getOperatorsForColumn(columnName: string): string[] {
		if (!columnName || !datatypeMapping[columnName]) return operators;
		const datatype = datatypeMapping[columnName].toLocaleLowerCase();
		switch (datatype) {
			case 'number':
			case 'integer':
			case 'float':
			case 'double':
			case 'date':
			case 'datetime':
				return ['equal to', 'less than', 'greater than'];
			case 'boolean':
				return ['equal to'];
			default:
				return operators;
		}
	}

	// Submit handler for immediate application
	async function handleSubmit() {
		const validRules = rules.filter((rule) => rule.column && rule.value !== '');
		if (validRules.length === 0) {
			errorMessage = 'Please fill in all rule fields';
			return;
		}
		const result = processRules(validRules, 'insertion');
		if (result && result.success) {
			console.log(result.message);
			InsertionModal.isInsertionModalOpen = false;
		} else {
			errorMessage = 'Failed to apply rules';
		}
	}

	// Save rule handler
	async function handleSaveRule() {
		// Validate rules
		const validRules = rules.filter((rule) => rule.column && rule.value !== '');
		if (validRules.length === 0) {
			errorMessage = 'Please fill in all rule fields';
			return;
		}

		// Validate rule name
		if (!ruleName.trim()) {
			errorMessage = 'Rule name is required';
			return;
		}

		// Format rules as array of arrays
		const formattedRules = validRules.map((rule) => [rule]);

		// Prepare payload
		const payload = {
			user_id: user_id,
			rule_name: ruleName.trim(),
			rules: formattedRules,
			pin: pinRule,
			tag_name: tagName,
			type_of_rule: 'insertion'
		};

		try {
			isLoading = true;
			const response = await fetch(`${VITE_API_URL}/rules_book_debt/add_rule?update=true`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Failed to save rule');
			}

			if (data.status === 'success') {
				console.log(data.message, 'Rule ID:', data.rule_id);
				// Apply rules immediately via parent
				const result = processRules(validRules, 'insertion');
				if (result && result.success) {
					console.log(result.message);
					InsertionModal.isInsertionModalOpen = false;
					savingRules = false;
					ruleName = '';
					pinRule = false;
					errorMessage = '';
				} else {
					errorMessage = 'Failed to apply rules';
				}
			}
		} catch (error) {
			console.error('Error saving rule:', error);
			errorMessage = error.message || 'Error saving rule';
		} finally {
			isLoading = false;
		}
	}

	const fetchColumns = async () => {
		try {
			isLoading = true;
			const response = await fetch(
				`${VITE_API_URL}/dataset/get_column_names?project_id=${projectId}`
			);

			if (!response.ok) {
				throw new Error('Failed to fetch column data');
			}

			const data = await response.json();
			console.log('column_data: ', data);
			columns = data.column_names || [];
		} catch (error) {
			console.error('Error fetching column data:', error);
			columns = [];
		} finally {
			isLoading = false;
		}
	};

	const fetchDatatypeMapping = async () => {
		try {
			isLoading = true;
			const response = await fetch(`${VITE_API_URL}/project/get_datatype_mapping/${projectId}`);

			if (!response.ok) {
				throw new Error('Failed to fetch datatype mapping');
			}

			const data = await response.json();
			console.log('datatype: ', data);

			if (data.status === 'success' && data.datatype_mapping) {
				datatypeMapping = data.datatype_mapping;
			}
		} catch (error) {
			console.error('Error fetching datatype mapping:', error);
		} finally {
			isLoading = false;
		}
	};

	async function fetchSavedRules() {
		try {
			isLoading = true;
			const response = await fetch(
				`${VITE_API_URL}/rules_book_debt/get_filtered_rules_for_project?project_id=${projectId}&user_id=${user_id}`
			);
			const result = await response.json();
			if (!response.ok || result.status !== 'success') {
				console.error('API Error:', result.details || response.statusText);
				savedRules = [];
				return;
			}
			savedRules = result.rules.insertion || [];
		} catch (error) {
			console.error('Error fetching saved rules:', error);
			savedRules = [];
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		fetchColumns();
		fetchDatatypeMapping();
		fetchSavedRules();
	});
</script>

<Modal bind:open={InsertionModal.isInsertionModalOpen}>
	{#if savingRules}
		<div class="flex flex-col gap-4">
			{#if errorMessage}
				<p class="text-sm text-red-500">{errorMessage}</p>
			{/if}
			<div class="flex w-full items-center gap-8">
				<Label for="rule_name" class="w-1/4">Rule Name</Label>
				<Input
					type="text"
					name="rule_name"
					id="rule_name"
					class="flex-1"
					placeholder="Enter Rule Name"
					bind:value={ruleName}
				/>
			</div>
			<div class="flex w-full items-center gap-8">
				<Label for="pin_to_this_tag" class="w-1/4">Pin to this tag</Label>
				<Checkbox name="pin_to_this_tag" id="pin_to_this_tag" bind:checked={pinRule} />
			</div>
			<div class="mt-4 flex w-full items-center justify-center gap-8">
				<Button
					color="light"
					class="w-[40%]"
					onclick={() => {
						savingRules = false;
						errorMessage = '';
					}}
				>
					Back
				</Button>
				<Button color="dark" class="w-[40%]" onclick={handleSaveRule} disabled={isLoading}>
					{isLoading ? 'Saving...' : 'Save Rule'}
				</Button>
			</div>
		</div>
	{:else}
		<div class="modal-header">
			<h2>{initialData ? 'Edit' : 'New'} Insertion Rule</h2>
			<span class="w-[40%]">
				<Select bind:value={selectedRuleId} placeholder="Select a saved rule">
					{#each savedRules as rule}
						<option value={rule.rule_id}>{rule.rule_name}</option>
					{/each}
				</Select>
			</span>
		</div>
		{#if isLoading}
			<div class="loading-container">
				<div class="loading-spinner"></div>
				<p>Loading...</p>
			</div>
		{:else}
			{#each rules as rule, i}
				<div class="relative flex flex-1 flex-col gap-4">
					<div class="flex w-full flex-1 items-center gap-2">
						<div>IF</div>
						<div class="w-full">
							<select
								bind:value={rule.column}
								onchange={(e) => updateColumn(i, e.currentTarget.value)}
								class="w-full rounded border border-gray-300 p-2"
							>
								<option value="" disabled>Select Column</option>
								{#each columns as c_name}
									<option value={c_name}>{c_name}</option>
								{/each}
							</select>
						</div>
					</div>
					<div class="flex gap-2">
						<select
							bind:value={rule.operator}
							onchange={(e) => updateOperator(i, e.currentTarget.value)}
							class="flex-[1] rounded border border-gray-300 p-2"
						>
							{#each getOperatorsForColumn(rule.column) as op}
								<option value={op}>{op}</option>
							{/each}
						</select>

						<input
							class="flex-[2] rounded border border-gray-300 p-2"
							type={getInputType(rule.column)}
							bind:value={rule.value}
							oninput={(e) => updateValue(i, e.currentTarget.value)}
							placeholder={rule.column ? `Enter ${rule.column} value` : 'Enter value'}
						/>
					</div>

					{#if i < rules.length - 1}
						<div class="connector">
							{rule.connector}
						</div>
					{:else}
						<div class="flex gap-2">
							<select
								bind:value={rule.connector}
								onchange={(e) =>
									handleConnectorChange(i, e.currentTarget.value as 'THEN' | 'AND' | 'OR' | '')}
								class="flex-[1] rounded border border-gray-300 p-2"
							>
								<option value="THEN">THEN</option>
								<option value="AND">AND</option>
								<option value="OR">OR</option>
							</select>

							<select
								bind:value={rule.then}
								onchange={(e) => updateThen(i, e.currentTarget.value)}
								class="flex-[2] rounded border border-gray-300 p-2"
							>
								<option value="accept">Accept</option>
								<!-- <option value="reject">Reject</option> -->
							</select>
						</div>
					{/if}

					{#if rules.length > 1}
						<button
							type="button"
							class="remove-rule"
							onclick={(e) => removeRule(i, e)}
							aria-label="Remove rule"
						>
							×</button
						>
					{/if}
				</div>
			{/each}

			{#if errorMessage}
				<p class="mt-2 text-sm text-red-500">{errorMessage}</p>
			{/if}

			<div class="mt-4 flex w-full items-center justify-center gap-8">
				<Button
					color="dark"
					class="w-[40%]"
					onclick={() => {
						savingRules = true;
						errorMessage = '';
					}}
				>
					Save As
				</Button>
				<Button color="dark" class="w-[40%]" onclick={handleSubmit}>
					{initialData ? 'Accept & Apply' : 'Accept & Apply'}
				</Button>
			</div>
		{/if}
	{/if}
</Modal>

<style>
	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
		padding-right: 5%;
	}

	.remove-rule {
		position: absolute;
		top: -20%;
		right: 0;
		background: none;
		border: none;
		color: red;
		font-size: 18px;
		cursor: pointer;
		padding: 0 5px;
	}

	.connector {
		font-weight: bold;
		padding: 8px;
		text-align: center;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.loading-spinner {
		border: 4px solid #f3f3f3;
		border-top: 4px solid #1d2634;
		border-radius: 50%;
		width: 30px;
		height: 30px;
		animation: spin 1s linear infinite;
		margin-bottom: 10px;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
