<script lang="ts">
	import { Label, Modal, Select, Button, Input, Checkbox } from 'flowbite-svelte';
	import { additionalRuleModal } from '../../store/toogleModal.svelte';
	interface Props {
		onApply?: () => void;
	}

	let { onApply }: Props = $props();
	let isloading = $state(false);

	let firstRowData = $state({
		'2023-11-01 00:00:00': { value: '0', type: 'number' },
		'2023-12-01 00:00:00': { value: '0', type: 'number' },
		'2024-01-01 00:00:00': { value: '0', type: 'number' },
		'2024-02-01 00:00:00': { value: '0', type: 'number' },
		'2024-03-01 00:00:00': { value: '0', type: 'number' },
		'2024-04-01 00:00:00': { value: '0', type: 'number' },
		'2024-05-01 00:00:00': { value: '0', type: 'number' },
		'2024-06-01 00:00:00': { value: '0', type: 'number' },
		'2024-07-01 00:00:00': { value: '0', type: 'number' },
		'2024-08-01 00:00:00': { value: '0', type: 'number' },
		'2024-09-01 00:00:00': { value: '0', type: 'number' },
		'2024-10-01 00:00:00': { value: '0', type: 'number' },
		'2024-11-01 00:00:00': { value: '0', type: 'number' },
		Address: { value: 'Surat', type: 'string' },
		'Advance EMI Amount ': { value: '0', type: 'number' },
		'Age of Customer at Maturity': { value: '38', type: 'number' },
		'Age of Vehicle at Maturity': { value: '', type: 'number' },
		'Age of the customer as on the date of sanction': { value: '35', type: 'number' },
		'Applicant CIBIL': { value: '', type: 'number' },
		'Asset Manufacturer': { value: 'Hyundai', type: 'string' },
		Branch: { value: 'Surat', type: 'string' },
		'Branch Code': { value: '808', type: 'string' },
		Case_no: { value: '424011808GJ011430', type: 'string' },
		'Chassis No.': { value: 'MALBM51RLFM077288', type: 'string' },
		City: { value: 'Surat', type: 'string' },
		'Client ID': { value: '', type: 'string' },
		'Customer Type (Captive, FTU, Retail, Salaried, SRT, Strategic, Self Employed)': {
			value: 'Self Employed',
			type: 'string'
		},
		'DPD String 12 Month': { value: '', type: 'string' },
		'DPD as of cut off date\n(30.11.2024)': { value: '0', type: 'number' },
		'Date of Birth (DD/MM/YYYY)': { value: '1989-01-02 00:00:00', type: 'date' },
		'Date of Disb': { value: '2024-05-10 00:00:00', type: 'date' },
		'Demand Promissory Note (Yes/ No) ': { value: 'Y', type: 'string' },
		'Disbursement Date': { value: '2024-05-10 00:00:00', type: 'date' },
		'EMI Amount ': { value: '16454', type: 'number' },
		'Engine Number': { value: 'D4FCFM291016', type: 'string' },
		'First EMI Date': { value: '2024-06-15 00:00:00', type: 'date' },
		'Future POS': { value: '', type: 'number' },
		'Individual/Non Individual': { value: '', type: 'string' },
		'Individual/Non-Individual': { value: 'Individual', type: 'string' },
		'Installment Type': { value: 'Monthly', type: 'string' },
		'Insurance (Yes/No)': { value: 'Y', type: 'string' },
		'Interest Rate of the loan (%)': { value: '23.01', type: 'number' },
		'Invoice (Yes / No) (Applicable for New Assets)': { value: '', type: 'string' },
		'Last Emi Date': { value: '2027-05-15 00:00:00', type: 'date' },
		'Loan Agreement (Yes/No)': { value: 'Y', type: 'string' },
		'Loan Amount disbursed': { value: '425000', type: 'number' },
		'Manufacturing year': { value: '2015', type: 'number' },
		'Mode of EMI  (PDC/ ECS/ Cash)': { value: '', type: 'string' },
		'Mode of repayment': { value: 'NACH', type: 'string' },
		'Model No.': { value: 'I-20', type: 'string' },
		Morat: { value: 'No', type: 'string' },
		'Name of Customer': { value: 'SURESHBHARTI SHIVBHARTIJI GWASHAMI', type: 'string' },
		'Nature of Vehicle CAR,CV,Tractor etc.) ': { value: 'PV', type: 'string' },
		'Original LTV (%)': { value: '85', type: 'number' },
		'Original Tenure': { value: '36', type: 'number' },
		'Original cost / Value of vehicle financed': { value: '', type: 'number' },
		'Origination Type (Dealer, Direct)': { value: 'Dealer', type: 'string' },
		'Overdue EMI Amount as on cutoff (30.11.2024)': { value: '0', type: 'number' },
		PAN: { value: 'ATWPG2206K', type: 'string' },
		'PSL (Yes / No)': { value: 'Y', type: 'string' },
		'Peak DPD': { value: '', type: 'number' },
		'Pin code': { value: '', type: 'string' },
		'Pos as of cut off date\n(30.11.2024)': { value: '372721', type: 'number' },
		RC: { value: 'Y', type: 'string' },
		'RC Hypothecation': { value: 'RBSG', type: 'string' },
		'Registration Number': { value: 'GJ05JL5481', type: 'string' },
		'Remaining tenure': { value: '30', type: 'number' },
		'Restructured ': { value: 'N', type: 'string' },
		'Sanctioned Amount': { value: '425000', type: 'number' },
		'Seasoning as on Nov 24': { value: '6', type: 'number' },
		'Sr. No.': { value: '1', type: 'number' },
		State: { value: 'Gujarat', type: 'string' },
		'Tag Type': { value: '', type: 'string' },
		Tags: { value: '', type: 'string' },
		'Udhyam Number': { value: '', type: 'string' },
		'Valuation Report (Yes/No) (Applicable for Used Assets)': { value: 'Y', type: 'string' },
		'Vehicle Model Name': { value: 'I-20', type: 'string' },
		'Vehicle Type (New/ Used) ': { value: 'Used', type: 'string' },
		'Whether contract flagged for securitised (Yes/ No) ': { value: 'YES', type: 'string' }
	});

	// Generate column names from data
	let column_names = $derived.by(() => {
		return Object.keys(firstRowData).map((key) => ({
			value: key,
			name: key,
			type: firstRowData[key].type
		}));
	});

	// Available operators by data type
	const operatorTypes = {
		number: [
			{ value: 'greater than', name: 'Greater Than' },
			{ value: 'less than', name: 'Lesser Than' },
			{ value: 'equal to', name: 'Equals' },
			{ value: 'add', name: 'Add' },
			{ value: 'subtract', name: 'Subtract' },
			{ value: 'divide', name: 'Divide' },
			{ value: 'multiply', name: 'Multiply' }
		],
		string: [
			{ value: 'equal to', name: 'Equals' },
			{ value: 'contains', name: 'Contains' },
			{ value: 'starts with', name: 'Starts With' },
			{ value: 'ends with', name: 'Ends With' }
		],
		date: [
			{ value: 'greater than', name: 'Greater Than' },
			{ value: 'less than', name: 'Lesser Than' },
			{ value: 'equal to', name: 'Equals' }
		]
	};

	// Connectors for combining conditions
	const connectors = [
		{ value: 'AND', name: 'AND' },
		{ value: 'OR', name: 'OR' }
	];

	// State for new column name and output value
	let newColumnName = $state('');

	// State for multiple condition sets and connectors
	let conditions = $state([
		{
			column: '',
			operator: '',
			value: '',
			valueType: 'static',
			columnValue: '',
			inputType: 'text',
			connector: ''
		}
	]);

	// Error message for validation
	let errorMessage = $state('');

	// Update operators and input type based on selected column
	function updateCondition(index: number, field: string, value: string) {
		conditions[index][field] = value;

		if (field === 'column') {
			const selectedColumn = column_names.find((col) => col.value === value);
			if (selectedColumn) {
				conditions[index].inputType =
					selectedColumn.type === 'number'
						? 'number'
						: selectedColumn.type === 'date'
							? 'date'
							: 'text';
				conditions[index].operator = ''; // Reset operator when column changes
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
				connector: ''
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
		for (const condition of conditions) {
			if (!condition.column || !condition.operator) {
				return 'Please fill in all fields (Column, Operator) for each condition.';
			}
			if (condition.valueType === 'static' && !condition.value) {
				return 'Please provide a static value for each condition where applicable.';
			}
			if (condition.valueType === 'column' && !condition.columnValue) {
				return 'Please select answers (e.g., yes/no, true/false) for each condition.';
			}
		}
		return '';
	}

	// Generate rules and send to backend
	async function handleApply() {
		// Validate inputs
		isloading = true;

		const validationError = validateConditions();
		if (validationError) {
			errorMessage = validationError;
			alert(validationError);
			isloading = false;
			return;
		}

		// Clear any existing error message
		errorMessage = '';

		// Generate rules in the specified format
		const rules = conditions.map((condition) => [
			{
				column: condition.column,
				operator: condition.operator.toLowerCase(),
				value: condition.valueType === 'static' ? condition.value : condition.columnValue,
				valueType: condition.valueType,
				connector: condition.connector ? condition.connector : 'THEN'
			}
		]);

		// Create payload with new column name and output value
		const payload = {
			rules
		};

		// Log the payload to console
		console.log('Generated Payload:', JSON.stringify(payload, null, 2));

		// Simulate backend response with 2-second delay
		setTimeout(() => {
			const result = { success: true, message: 'Rules saved successfully' };
			console.log('Simulated Backend Response:', result);

			// Dispatch event to parent component
			onApply?.();
			isloading = false;
			// Close the modal after successful submission
			additionalRuleModal.isAdditionalRuleModalOpen = false;
		}, 2000);

		// Commented out actual backend call
		/*
		// Send rules to backend
		try {
			const response = await fetch('/api/save-formula', {
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

			// Dispatch event to parent component
			dispatch('apply');

			// Close the modal after successful submission
			additionalRuleModal.isAdditionalRuleModalOpen = false;
		} catch (error) {
			console.error('Error sending rules to backend:', error);
			errorMessage = 'Failed to save rules. Please try again.';
		}
		*/
	}
</script>

<Modal
	title="Enter Formula"
	headerClass="text-black flex rounded-tl-xl rounded-tr-xl p-4"
	bind:open={additionalRuleModal.isAdditionalRuleModalOpen}
	size="md"
>
	{#if isloading}
		<div class="flex items-center justify-center">
			<div
				class="border-primary h-12 w-12 animate-spin rounded-full border-4 border-solid border-t-transparent"
			></div>
			<p class="ml-2">Processing...</p>
		</div>
	{/if}
	<div class="flex w-full flex-1 flex-col gap-4 p-4">
		{#each conditions as condition, index}
			<div class="flex flex-1 items-center justify-center gap-4">
				<div class="flex gap-2">
					<Select
						items={column_names}
						placeholder="Select Column"
						bind:value={condition.column}
						on:change={(e) => updateCondition(index, 'column', e.target.value)}
					/>

					<Select
						items={operatorTypes[
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

				{#if conditions.length > 1}
					<Button color="red" on:click={() => removeCondition(index)}>Remove</Button>
				{/if}
			</div>

			{#if condition.connector}
				<div class="text-center font-medium text-gray-700">
					{condition.connector}
				</div>
			{/if}

			{#if index === conditions.length - 1}
				<Select
					items={connectors}
					placeholder="Select Connector"
					on:change={(e) => addCondition(index, e.target.value)}
				/>
			{/if}
		{/each}
		<Button
			color="dark"
			onclick={() => {
				handleApply();
			}}>Enter & Apply</Button
		>
	</div>
</Modal>
