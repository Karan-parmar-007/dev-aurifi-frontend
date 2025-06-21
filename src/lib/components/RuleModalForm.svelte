<script>
	import { RuleModal } from '../../store/toogleModal.svelte';
	import { Button, Label, Select, Input, Modal, Checkbox } from 'flowbite-svelte';

	// Props
	let { processRules, initialData, columns } = $props();


	// State
	let rules = $state([
		{
			connector: 'THEN',
			isBoolean: true,
			booleanValue: true,
			valueType: 'boolean'
		}
	]);

	// Initialize with the passed data if we're editing
	$effect(() => {
		if (initialData) {
			rules = [...initialData];
		}
	});

	// Operators
	const operators = [
		'equal to',
		'not equal to',
		'greater than',
		'less than',
		'contains',
		'does not contain',
		'starts with',
		'ends with',
		'multiply',
		'divide'
	];

	// Add another condition
	function addCondition() {
		rules.push({
			column: '',
			operator: 'equal to',
			value: '',
			connector: 'AND',
			valueType: 'column',
			isBoolean: false
		});
		rules = [...rules]; // Trigger reactivity
	}

	// Remove a condition
	function removeCondition(index) {
		if (rules.length > 1) {
			rules.splice(index, 1);
			rules = [...rules]; // Trigger reactivity
		}
	}

	// Function to submit the rules
	function submitRules() {
		// Clean rules to ensure correct structure
		const cleanedRules = rules.map((rule) => {
			if (rule.connector === 'THEN') {
				return {
					connector: 'THEN',
					isBoolean: true,
					booleanValue: rule.booleanValue,
					valueType: 'boolean'
				};
			}
			return {
				column: rule.column,
				operator: rule.operator,
				value: rule.value,
				connector: rule.connector,
				valueType: rule.valueType || 'column',
				isBoolean: false
			};
		});

		// Process rules with callback
		const result = processRules(cleanedRules);

		if (result.success) {
			// Clear form
			rules = [
				{
					connector: 'THEN',
					isBoolean: true,
					booleanValue: true,
					valueType: 'boolean'
				}
			];
		}
	}

	// Function to close the modal
	function closeModal() {
		// Reset form
		rules = [
			{
				connector: 'THEN',
				isBoolean: true,
				booleanValue: true,
				valueType: 'boolean'
			}
		];
		RuleModal.isRuleModalOpen = false;
	}

	// Update rule when connector changes
	function updateRuleConnector(index, connector) {
		if (connector === 'THEN') {
			rules[index] = {
				connector: 'THEN',
				isBoolean: true,
				booleanValue: rules[index].booleanValue || true,
				valueType: 'boolean'
			};
		} else {
			rules[index] = {
				column: rules[index].column || '',
				operator: rules[index].operator || 'equal to',
				value: rules[index].value || '',
				connector: connector,
				valueType: rules[index].valueType || 'column',
				isBoolean: false
			};
		}
		rules = [...rules]; // Trigger reactivity
	}

	// Update valueType
	function updateValueType(index, valueType) {
		rules[index].valueType = valueType;
		rules = [...rules]; // Trigger reactivity
	}
</script>

<Modal size="lg" bind:open={RuleModal.isRuleModalOpen} class="w-full" title="Define Rule">
	<div class="space-y-4 p-4">
		{#each rules as rule, index}
			<div class="flex items-center gap-2 rounded-md border p-3">
				<div class="w-full space-y-3">
					<!-- Condition row -->
					{#if rule.connector !== 'THEN'}
						<div class="flex items-end gap-2">
							<div class="flex-1">
								<Label for="column-{index}">Column</Label>
								<Select id="column-{index}" bind:value={rule.column} required>
									<option value="" disabled selected>Select Column</option>
									{#each columns as column}
										<option value={column}>{column}</option>
									{/each}
								</Select>
							</div>
							<div class="flex-1">
								<Label for="operator-{index}">Operator</Label>
								<Select id="operator-{index}" bind:value={rule.operator}>
									{#each operators as op}
										<option value={op}>{op}</option>
									{/each}
								</Select>
							</div>
							<div class="flex-1">
								<Label for="valueType-{index}">Value Type</Label>
								<Select
									id="valueType-{index}"
									bind:value={rule.valueType}
									on:change={(e) => updateValueType(index, e.target.value)}
								>
									<option value="column">Column</option>
									<option value="static">Static</option>
								</Select>
							</div>
							<div class="flex-1">
								<Label for="value-{index}">Value</Label>
								{#if rule.valueType === 'column'}
									<Select id="value-{index}" bind:value={rule.value} required>
										<option value="" disabled selected>Select Column</option>
										{#each columns as column}
											<option value={column}>{column}</option>
										{/each}
									</Select>
								{:else}
									<Input
										id="value-{index}"
										bind:value={rule.value}
										placeholder="Enter value"
										required
									/>
								{/if}
							</div>

							<!-- Remove button (only if more than one condition) -->
							{#if rules.length > 1}
								<Button
									size="sm"
									color="light"
									class="px-2"
									title="Remove condition"
									onclick={() => removeCondition(index)}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<line x1="18" y1="6" x2="6" y2="18"></line>
										<line x1="6" y1="6" x2="18" y2="18"></line>
									</svg>
								</Button>
							{/if}
						</div>
					{:else}
						<!-- Boolean value for THEN connector -->
						<div class="flex items-center gap-2">
							<div class="flex-1">
								<Label for="boolean-{index}">Boolean Value</Label>
								<Checkbox id="boolean-{index}" bind:checked={rule.booleanValue}>True</Checkbox>
							</div>
						</div>
					{/if}

					<!-- Connector selection -->
					<div class="flex items-center gap-2">
						<div class="flex-1">
							<Label for="connector-{index}">
								{#if index === rules.length - 1}
									Then
								{:else}
									Connector
								{/if}
							</Label>
							<Select
								id="connector-{index}"
								bind:value={rule.connector}
								on:change={(e) => updateRuleConnector(index, e.target.value)}
							>
								{#if index === rules.length - 1}
									<option value="THEN">THEN</option>
								{:else}
									<option value="AND">AND</option>
									<option value="OR">OR</option>
								{/if}
							</Select>
						</div>
					</div>
				</div>
			</div>
		{/each}

		<!-- Add condition button -->
		<Button color="light" class="w-full border border-dashed" onclick={addCondition}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="mr-2"
			>
				<line x1="12" y1="5" x2="12" y2="19"></line>
				<line x1="5" y1="12" x2="19" y2="12"></line>
			</svg>
			Add Condition
		</Button>
	</div>

	<svelte:fragment slot="footer">
		<Button color="light" onclick={closeModal}>Cancel</Button>
		<Button color="green" onclick={submitRules}>Save Rule</Button>
	</svelte:fragment>
</Modal>
