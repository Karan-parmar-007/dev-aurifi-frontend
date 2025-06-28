<script lang="ts">
	import { Label, Modal, Select, Button, Input, Checkbox } from 'flowbite-svelte';
	import { generateFormulaModal } from '../../store/toogleModal.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { VITE_API_URL } from '$lib/constants';

	let { fetchUpdatedData = () => {} } = $props();

	// Extract transaction_id from URL
	let path = page.url.pathname;
	let urlParts = path.split('/');
	let transaction_id = urlParts[3];

	// State for API data
	let datatypeMapping = $state({});
	let errorMessage = $state('');

	// Fetch data from API on component mount
	onMount(async () => {
		try {
			const response = await fetch(
				`${VITE_API_URL}/transaction_dataset/get_datatype_mapping_with_new_column_added/${transaction_id}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);

			if (!response.ok) {
				throw new Error('Failed to fetch datatype mapping');
			}

			const result = await response.json();
			if (result.status === 'success') {
				datatypeMapping = result.datatype_mapping;
			} else {
				throw new Error('API response status is not success');
			}
			console.log($state.snapshot(datatypeMapping));
		} catch (error) {
			console.error('Error fetching datatype mapping:', error);
			errorMessage = 'Failed to load column data. Please try again.';
		}
	});

	// State for multiple condition sets and connectors
	let conditions = $state([
		{
			column: '',
			operator: '',
			value: '',
			valueType: 'static',
			columnValue: '',
			inputType: 'text',
			connector: '',
			isBoolean: true,
			booleanValue: ''
		}
	]);

	// Generate column names from API data and add "Column being created" with dynamic type
	let column_names = $derived.by(() => {
		const apiColumns = Object.keys(datatypeMapping).map((key) => ({
			value: key,
			name: key,
			type: datatypeMapping[key]
		}));

		// Determine the type of "Column being created" based on the previous operator
		let columnBeingCreatedType = 'string'; // Default type
		const lastConditionIndex = conditions.length - 1;

		if (lastConditionIndex >= 0 && conditions[lastConditionIndex].operator) {
			const lastOperator = conditions[lastConditionIndex].operator.toLowerCase();
			const lastColumn = conditions[lastConditionIndex].column;
			const lastColumnType = apiColumns.find((col) => col.value === lastColumn)?.type;

			// Infer type based on operator and column type
			if (['add', 'subtract', 'multiply', 'divide', 'modulo', 'power'].includes(lastOperator)) {
				columnBeingCreatedType = 'number';
			} else if (
				['greater than', 'less than', 'greater than or equal', 'less than or equal'].includes(
					lastOperator
				)
			) {
				if (lastColumnType === 'date') {
					columnBeingCreatedType = 'date';
				} else {
					columnBeingCreatedType = 'number';
				}
			} else if (['contains', 'not contains'].includes(lastOperator)) {
				columnBeingCreatedType = 'string';
			} else if (
				['equal', 'equals', 'not equal'].includes(lastOperator) &&
				lastColumnType === 'boolean'
			) {
				columnBeingCreatedType = 'boolean';
			}
		}

		return [
			...apiColumns,
			{
				value: 'Column being created',
				name: 'Column being created',
				type: columnBeingCreatedType
			}
		];
	});

	// Available operators by data type
	const operatorTypes = {
		number: [
			{ value: 'equal', name: 'Equal' },
			{ value: 'equals', name: 'Equals' },
			{ value: 'not equal', name: 'Not Equal' },
			{ value: 'greater than', name: 'Greater Than' },
			{ value: 'less than', name: 'Less Than' },
			{ value: 'greater than or equal', name: 'Greater Than or Equal' },
			{ value: 'less than or equal', name: 'Less Than or Equal' },
			{ value: 'add', name: 'Add' },
			{ value: 'subtract', name: 'Subtract' },
			{ value: 'multiply', name: 'Multiply' },
			{ value: 'divide', name: 'Divide' },
			{ value: 'modulo', name: 'Modulo' },
			{ value: 'power', name: 'Power' }
		],
		decimal: [
			{ value: 'equal', name: 'Equal' },
			{ value: 'equals', name: 'Equals' },
			{ value: 'not equal', name: 'Not Equal' },
			{ value: 'greater than', name: 'Greater Than' },
			{ value: 'less than', name: 'Less Than' },
			{ value: 'greater than or equal', name: 'Greater Than or Equal' },
			{ value: 'less than or equal', name: 'Less Than or Equal' },
			{ value: 'add', name: 'Add' },
			{ value: 'subtract', name: 'Subtract' },
			{ value: 'multiply', name: 'Multiply' },
			{ value: 'divide', name: 'Divide' },
			{ value: 'modulo', name: 'Modulo' },
			{ value: 'power', name: 'Power' }
		],
		string: [
			{ value: 'equal', name: 'Equal' },
			{ value: 'equals', name: 'Equals' },
			{ value: 'not equal', name: 'Not Equal' },
			{ value: 'contains', name: 'Contains' },
			{ value: 'not contains', name: 'Not Contains' }
		],
		date: [
			{ value: 'equal', name: 'Equal' },
			{ value: 'equals', name: 'Equals' },
			{ value: 'not equal', name: 'Not Equal' },
			{ value: 'greater than', name: 'Greater Than' },
			{ value: 'less than', name: 'Less Than' },
			{ value: 'greater than or equal', name: 'Greater Than or Equal' },
			{ value: 'less than or equal', name: 'Less Than or Equal' }
		],
		boolean: [
			{ value: 'equal', name: 'Equal' },
			{ value: 'equals', name: 'Equals' },
			{ value: 'not equal', name: 'Not Equal' }
		]
	};

	// Combine all operators for "Column being created"
	const allOperators = [
		...new Set(
			[
				...operatorTypes.number,
				...operatorTypes.decimal,
				...operatorTypes.string,
				...operatorTypes.date,
				...operatorTypes.boolean
			].map((op) => JSON.stringify(op))
		)
	].map((str) => JSON.parse(str));

	// Connectors for combining conditions
	const connectors = [
		{ value: 'AND', name: 'AND' },
		{ value: 'OR', name: 'OR' },
		{ value: 'THEN', name: 'THEN' }
	];

	// Boolean value options for dropdown
	const booleanValues = [
		{ value: 'true', name: 'True' },
		{ value: 'false', name: 'False' }
	];

	// State for new column name
	let newColumnName = $state('');

	// Update operators and input type based on selected column
	function updateCondition(index: number, field: string, value: string) {
		conditions[index][field] = value;

		if (field === 'column') {
			const selectedColumn = column_names.find((col) => col.value === value);
			if (selectedColumn) {
				conditions[index].inputType =
					selectedColumn.type === 'number' || selectedColumn.type === 'decimal'
						? 'number'
						: selectedColumn.type === 'date'
							? 'date'
							: selectedColumn.type === 'boolean'
								? 'select'
								: 'text';
				conditions[index].operator = '';
			}
		}
	}

	// Toggle between static value and column reference
	function toggleValueType(index: number) {
		conditions[index].valueType = conditions[index].valueType === 'static' ? 'column' : 'static';
		conditions[index].value = '';
		conditions[index].columnValue = '';
	}

	// Add new condition set when connector is selected
	function addCondition(index: number, connector: string) {
		conditions[index].connector = connector;
		conditions = [
			...conditions,
			{
				column: '',
				operator: '',
				value: '',
				valueType: 'static',
				columnValue: '',
				inputType: 'text',
				connector: '',
				isBoolean: connector === 'THEN' ? true : false,
				booleanValue: ''
			}
		];
	}

	// Remove condition set
	function removeCondition(index: number) {
		if (conditions.length > 1) {
			conditions = conditions.filter((_, i) => i !== index);
			if (index > 0 && conditions[index - 1]) {
				conditions[index - 1].connector = '';
			}
		}
	}

	// Validate conditions for empty values
	function validateConditions() {
		if (!newColumnName) {
			return 'New column name is required.';
		}

		for (let i = 0; i < conditions.length; i++) {
			const condition = conditions[i];
			const prevCondition = i > 0 ? conditions[i - 1] : null;

			if (!prevCondition || prevCondition.connector !== 'THEN') {
				if (!condition.column || !condition.operator) {
					return 'Please fill in all fields (Column, Operator) for each condition.';
				}
				if (condition.valueType === 'static' && !condition.value) {
					return 'Please provide a static value for each condition where applicable.';
				}
				if (condition.valueType === 'column' && !condition.columnValue) {
					return 'Please select a column value for each condition.';
				}
			} else if (condition.isBoolean && !condition.booleanValue) {
				return 'Please select a boolean value for the condition following a "THEN" connector.';
			}
		}
		return '';
	}

	// Generate rules and send to backend
	async function handleApply() {
		// Validate inputs
		const validationError = validateConditions();
		if (validationError) {
			errorMessage = validationError;
			alert(validationError);
			return;
		}

		// Clear any existing error message
		errorMessage = '';

		// Generate rules in the specified format
		const rules = conditions.map((condition, index) => {
			const prevCondition = index > 0 ? conditions[index - 1] : null;

			// If the previous condition's connector is "THEN" and isBoolean is true, return only boolean-related fields
			if (prevCondition && prevCondition.connector === 'THEN' && condition.isBoolean) {
				return [
					{
						valueType: condition.valueType,
						isBoolean: condition.isBoolean,
						booleanValue: condition.booleanValue === 'true'
					}
				];
			}

			// Otherwise, generate the full rule
			const rule = {
				[index === 0 ? 'column_one' : 'column']: condition.column,
				operator: condition.operator.toLowerCase(),
				value: condition.valueType === 'static' ? condition.value : condition.columnValue,
				valueType: condition.valueType,
				connector: condition.connector ? condition.connector : ''
			};

			// Add boolean field if the operator is applied to a boolean column
			const selectedColumn = column_names.find((col) => col.value === condition.column);
			if (selectedColumn && selectedColumn.type === 'boolean' && condition.valueType === 'static') {
				rule.boolean = condition.value === 'true';
			}

			return [rule];
		});

		// Create payload with transaction_id, new column name, and rules
		const payload = {
			transaction_id,
			newColumnName,
			rules
		};

		// Log the payload to console
		console.log('Generated Payload:', JSON.stringify(payload, null, 2));

		// Send rules to backend
		try {
			const response = await fetch(`${VITE_API_URL}/transaction_dataset/add_column_with_rules`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				throw new Error('Failed to save rules');
			}

			const result = await response.json();
			console.log('Backend Response:', result);
			fetchUpdatedData();

			// Close the modal after successful submission
			generateFormulaModal.isGenerateFormulaModalOpen = false;
		} catch (error) {
			console.error('Error sending rules to backend:', error);
			errorMessage = 'Failed to save rules. Please try again.';
		}
	}
</script>

<Modal
	title="Enter Formula"
	headerClass="text-black flex rounded-tl-xl rounded-tr-xl p-4"
	bind:open={generateFormulaModal.isGenerateFormulaModalOpen}
	size="md"
>
	<div class="flex w-full flex-1 flex-col gap-4 p-4">
		{#if errorMessage}
			<div class="text-center text-red-500">{errorMessage}</div>
		{/if}

		<div class="flex flex-col gap-2">
			<Label for="newColumnName">New Column Name</Label>
			<Input id="newColumnName" placeholder="Enter new column name" bind:value={newColumnName} />
		</div>

		{#each conditions as condition, index}
			<div class="flex flex-1 items-center justify-center gap-4">
				<!-- Check if the previous condition has "THEN" connector -->
				{#if index === 0 || conditions[index - 1].connector !== 'THEN'}
					<div class="flex gap-2">
						<Select
							items={column_names}
							placeholder="Select Column"
							bind:value={condition.column}
							on:change={(e) => updateCondition(index, 'column', e.target.value)}
						/>

						<Select
							items={condition.column === 'Column being created'
								? allOperators
								: operatorTypes[
										column_names.find((col) => col.value === condition.column)?.type || 'string'
									]}
							placeholder="Select Operator"
							bind:value={condition.operator}
							on:change={(e) => updateCondition(index, 'operator', e.target.value)}
						/>
					</div>

					<div class="flex items-center gap-2">
						<Checkbox
							checked={condition.valueType === 'column'}
							on:change={() => toggleValueType(index)}
						>
							Use Column
						</Checkbox>

						{#if condition.valueType === 'static'}
							<Input
								type={condition.inputType}
								placeholder="Enter Value"
								bind:value={condition.value}
							/>
						{:else}
							<Select
								items={column_names}
								placeholder="Select Column"
								bind:value={condition.columnValue}
								on:change={(e) => updateCondition(index, 'columnValue', e.target.value)}
							/>
						{/if}
					</div>
				{:else}
					<div class="flex items-center gap-2">
						<!-- <Checkbox bind:checked={condition.isBoolean}>Is Boolean</Checkbox> -->

						<Select
							items={booleanValues}
							placeholder="Select Boolean Value"
							bind:value={condition.booleanValue}
							on:change={(e) => updateCondition(index, 'booleanValue', e.target.value)}
						/>
					</div>
				{/if}

				{#if conditions.length > 1}
					<Button color="red" on:click={() => removeCondition(index)}>Remove</Button>
				{/if}
			</div>

			<div class="flex w-full items-center justify-center">
				{#if condition.connector}
					<div class="my-2 text-center font-medium text-gray-700">
						{condition.connector}
					</div>
				{/if}

				<!-- Only show the "Select Connector" dropdown if no condition has "THEN" connector and this is not a THEN condition -->
				{#if index === conditions.length - 1 && !conditions.some((cond) => cond.connector === 'THEN') && (!conditions[index - 1] || conditions[index - 1].connector !== 'THEN')}
					<Select
						items={connectors}
						placeholder="Select Connector"
						on:change={(e) => addCondition(index, e.target.value)}
					/>
				{/if}
			</div>
		{/each}
		<Button
			color="dark"
			onclick={() => {
				handleApply();
			}}
		>
			Enter & Apply
		</Button>
	</div>
</Modal>
