<script lang="ts">
	import { Modal, Input, Button, Label, Checkbox } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { CustomRuleModal } from '../../store/toogleModal.svelte';
	import { VITE_API_URL } from '$lib/constants';

	// Receive props, including the callback
	let {
		transaction_id = '',
		parent_version_id = '',
		initialData = null,
		tagName = null,
		isNewVersion = false,
		onRuleApplied = (data: any) => {}
	}: {
		transaction_id?: string;
		parent_version_id?: string;
		initialData?: any[] | null;
		tagName?: string | null;
		isNewVersion?: boolean;
		onRuleApplied?: (data: any) => void;
	} = $props();

	// Define Rule type
	type Rule = {
		column: string;
		operator: string;
		value: string | number;
		connector: 'THEN' | 'AND' | 'OR';
		then: string;
	};

	// Reactive state with default rules
	let rules = $state<Rule[]>([
		{
			column: '',
			operator: 'includes',
			value: '',
			connector: 'THEN',
			then: 'reject'
		}
	]);

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

	// If initialData is provided, use it for editing
	$effect(() => {
		if (initialData) {
			rules = initialData;
		}
	});

	function addRule(index: number, connector: 'THEN' | 'AND' | 'OR') {
		rules.splice(index + 1, 0, {
			column: '',
			operator: 'includes',
			value: '',
			connector: 'THEN',
			then: ''
		});
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
				rules[index - 1].connector = rules[index].connector;
			}
		}
	}

	function handleConnectorChange(index: number, newConnector: 'THEN' | 'AND' | 'OR' | '') {
		if (newConnector && newConnector !== 'THEN') {
			addRule(index, newConnector as 'AND' | 'OR');
		} else if (!newConnector && rules.length > 1) {
			removeRule(index + 1);
		} else if (newConnector) {
			rules[index].connector = newConnector;
		}
	}

	function updateColumn(index: number, value: string) {
		rules[index].column = value;
		rules[index].value = datatypeMapping[value]?.toLowerCase() === 'boolean' ? 'true' : '';
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

	function getInputType(columnName: string): string {
		if (!columnName || !datatypeMapping[columnName]) {
			return 'text';
		}
		const datatype = datatypeMapping[columnName];
		switch (datatype.toLowerCase()) {
			case 'number':
			case 'integer':
			case 'float':
			case 'double':
			case 'decimal':
				return 'number';
			case 'date':
				return 'date';
			case 'datetime':
				return 'datetime-local';
			case 'boolean':
				return 'select-boolean';
			default:
				return 'text';
		}
	}

	function getOperatorsForColumn(columnName: string): string[] {
		if (!columnName || !datatypeMapping[columnName]) {
			return operators;
		}
		const datatype = datatypeMapping[columnName];
		switch (datatype.toLowerCase()) {
			case 'number':
			case 'integer':
			case 'float':
			case 'double':
			case 'decimal':
				return ['equal to', 'less than', 'greater than'];
			case 'date':
			case 'datetime':
				return ['equal to', 'less than', 'greater than'];
			case 'boolean':
				return ['equal to'];
			default:
				return operators;
		}
	}

	// Function to generate the payload for preview or submission
	function generatePayload() {
		const validRules = rules.filter((rule) => rule.column && rule.value !== '');
		if (validRules.length === 0) {
			return { error: 'No valid rules to preview. Please fill in all rule fields.' };
		}
		if (!transaction_id) {
			return { error: 'Transaction ID is missing' };
		}
		if (!isNewVersion && !parent_version_id) {
			return { error: 'Parent Version ID is missing' };
		}

		const formattedRules = [
			validRules.map((rule) => ({
				column: rule.column,
				operator: rule.operator,
				value: rule.value,
				connector: rule.connector,
				then: rule.then
			}))
		];

		const payload = {
			transaction_id,
			rules: formattedRules
		};

		if (!isNewVersion) {
			payload.parent_version_id = parent_version_id;
		}

		return payload;
	}

	// Function to preview the payload in console
	function previewPayload() {
		const payload = generatePayload();
		if ('error' in payload) {
			console.log('Preview Payload Error:', payload.error);
		} else {
			console.log('Preview Payload:', JSON.stringify(payload, null, 2));
		}
	}

	// Function to refetch the data
	async function fetchUpdatedData() {
		try {
			const response = await fetch(
				`${VITE_API_URL}/transaction_dataset/fetch_all_rule_versions/${projectId}`
			);
			if (!response.ok) {
				throw new Error(`Failed to fetch updated data: ${response.status}`);
			}
			const data = await response.json();
			return data;
		} catch (error) {
			console.error('Error fetching updated data:', error);
			return null;
		}
	}

	async function handleSubmit() {
		const payload = generatePayload();
		if ('error' in payload) {
			errorMessage = payload.error;
			alert(errorMessage);
			return;
		}

		try {
			isLoading = true;
			const apiUrl = isNewVersion
				? `${VITE_API_URL}/transaction_dataset/create_new_version_and_apply_rule`
				: `${VITE_API_URL}/transaction_dataset/apply_rule_to_existing_version`;

			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.message || 'Failed to apply rule');
			}

			if (data.status === 'success') {
				console.log('Rule applied successfully:', data.message);
				// Fetch updated data
				const updatedData = await fetchUpdatedData();
				if (updatedData) {
					// Call the callback with updated data
					onRuleApplied(updatedData);
				}
				CustomRuleModal.isCustomRuleModalOpen = false;
			} else {
				throw new Error('API response status is not success');
			}
		} catch (error) {
			console.error('Error applying rule:', error);
			errorMessage = error.message || 'Failed to apply rule';
			alert(errorMessage);
		} finally {
			isLoading = false;
		}
	}

	async function handleSaveRule() {
		const validRules = rules.filter((rule) => rule.column && rule.operator && rule.value !== '');
		if (validRules.length === 0) {
			errorMessage = 'Please fill in all rule fields';
			return;
		}

		if (!ruleName.trim()) {
			errorMessage = 'Rule name is required';
			return;
		}

		const formattedRules = validRules.map((rule) => [rule]);
		const payload = {
			user_id: '68131e7bb9f75b267c7386a9',
			rule_name: ruleName.trim(),
			rules: formattedRules
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
				// Fetch updated data
				const updatedData = await fetchUpdatedData();
				if (updatedData) {
					// Call the callback with updated data
					onRuleApplied(updatedData);
				}
				savingRules = false;
				ruleName = '';
				pinRule = false;
				errorMessage = '';
			}
		} catch (error) {
			console.error('Error saving rule:', error);
			errorMessage = error.message || 'Error saving rule';
		} finally {
			isLoading = false;
		}
	}

	const fetchColumnsAndDatatypes = async () => {
		try {
			isLoading = true;
			const response = await fetch(
				`${VITE_API_URL}/transaction_dataset/fetch_dataset_columns_and_their_datatype/${projectId}`
			);

			if (!response.ok) {
				throw new Error('Failed to fetch columns and datatype mapping');
			}

			const data = await response.json();
			if (data.status === 'success') {
				datatypeMapping = data.column_datatypes;
				columns = Object.keys(data.column_datatypes);
			} else {
				throw Error('API response status is not success');
			}
		} catch (error) {
			console.error('Error fetching columns and datatypes:', error);
			errorMessage = 'Failed to load column data. Please try again.';
		} finally {
			isLoading = false;
		}
	};

	onMount(() => {
		fetchColumnsAndDatatypes();
	});
</script>

<Modal title={'New Rule'} bind:open={CustomRuleModal.isCustomRuleModalOpen}>
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
			<h2>{initialData ? 'Edit' : 'New'} Rule</h2>
			<span class="rule-number">Rule 1</span>
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
						<div class="">IF</div>
						<div class="w-full">
							<select
								value={rule.column}
								onchange={(e) => updateColumn(i, e.target.value)}
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
							class="flex-[1] rounded border border-gray-300 p-2"
							value={rule.operator}
							onchange={(e) => updateOperator(i, e.target.value)}
						>
							{#each getOperatorsForColumn(rule.column) as op}
								<option value={op}>{op}</option>
							{/each}
						</select>
						{#if getInputType(rule.column) === 'select-boolean'}
							<select
								class="flex-[2] rounded border border-gray-300 p-2"
								value={rule.value}
								onchange={(e) => updateValue(i, e.target.value)}
							>
								<option value="" disabled>Select value</option>
								<option value="true">true</option>
								<option value="false">false</option>
							</select>
						{:else}
							<input
								class="flex-[2] rounded border border-gray-300 p-2"
								type={getInputType(rule.column)}
								value={rule.value}
								oninput={(e) => updateValue(i, e.target.value)}
								placeholder={rule.column ? `Enter ${rule.column} value` : 'Enter value'}
							/>
						{/if}
					</div>
					{#if i < rules.length - 1}
						<div class="connector">
							{rule.connector}
						</div>
					{:else}
						<div class="flex gap-2">
							<select
								class="flex-[1] rounded border border-gray-300 p-2"
								value={rule.connector}
								onchange={(e) =>
									handleConnectorChange(i, e.target.value as 'THEN' | 'AND' | 'OR' | '')}
							>
								<option value="THEN">THEN</option>
								<option value="AND">AND</option>
								<option value="OR">OR</option>
							</select>
							<select
								class="flex-[2] rounded border border-gray-300 p-2"
								value={rule.then}
								onchange={(e) => updateThen(i, e.target.value)}
							>
								<option value="reject">Reject</option>
								<option value="accept">Accept</option>
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
							×
						</button>
					{/if}
				</div>
			{/each}
			{#if errorMessage}
				<p class="mt-2 text-sm text-red-500">{errorMessage}</p>
			{/if}
			<div class="mt-4 flex w-full items-center justify-center gap-8">
				<!-- <Button color="light" class="w-[30%]" onclick={previewPayload}>Preview Payload</Button> -->
				<Button color="dark" class="w-[30%]" onclick={handleSubmit}>
					{initialData ? 'Update Rule' : isNewVersion ? 'Apply to New Version' : 'Accept & Apply'}
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
	}
	.rule-number {
		color: #555;
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