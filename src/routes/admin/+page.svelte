<script lang="ts">
	import {
		Button,
		Checkbox,
		Input,
		Label,
		Select,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import TagInput from '$lib/components/TagInput.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { VITE_API_URL } from '$lib/constants.js';

	if (browser) {
		goto('/admin/DebtSheet');
	}

	interface Tag {
		id: string;
		text: string;
	}

	let tags = $state<Tag[]>([]);
	let errorMessage = $state('');
	let { data } = $props();
	console.log('load data: ', data);

	let formVisible = $state(false);
	let CustomError = $state([]);

	let editingColumn = $state(null);
	let editFormData = $state({
		column_name: '',
		description: '',
		alt_name: [],
		asset_class: '',
		datatype: '',
		general_mandatory: false,
		is_currency: false
	});
	let editTags = $state([]);

	let formData = $state({
		column_name: '',
		description: '',
		alt_names: [], // Change to array to store tags
		asset_class: '',
		datatype: '',
		general_mandatory: false, // (True || False)
		is_currency: false // (True || False)
	});

	let assetClassOptions = [
		{ value: 'Real Estate', name: 'Real Estate' },
		{ value: 'Vehicles', name: 'Vehicles' },
		{ value: 'Securities', name: 'Securities' }
	];

	let dataTypes = [
		{ value: 'currency', name: 'currency' },
		{ value: 'string', name: 'string' },
		{ value: 'number', name: 'number' },
		{ value: 'date', name: 'date' },
		{ value: 'boolean', name: 'boolean' }
	];

	function handleTagsChange(newTags: Tag[]) {
		tags = newTags;
		// Update the formData with the text values from tags
		formData.alt_names = newTags.map((tag) => tag.text);
	}

	function handleEdit(column) {
		editingColumn = column;
		editFormData = {
			column_name: column.column_name,
			description: column.description,
			alt_names: Array.isArray(column.alt_names) ? column.alt_names : [column.alt_names],
			asset_class: column.asset_class,
			datatype: column.datatype,
			general_mandatory: column.general_mandatory, // Ensure this is a boolean
			is_currency: column.is_currency
		};
		editTags = createTagsFromAltNames(column.alt_names);
	}
	function handleEditTagsChange(newTags) {
		editTags = newTags;

		editFormData.alt_name = newTags.map((tag) => tag.text);
	}

	function cancelEdit() {
		editingColumn = null;
	}

	async function saveEdit(id) {
		try {
			if (/\s/.test(formData.column_name)) {
				errorMessage = 'Column name cannot contain spaces or whitespace characters.';
				return;
			}

			let newAltName = editTags.map((tag) => tag.text);

			const dataToSubmit = {
				original_column_name: editingColumn.column_name,
				...editFormData,
				alt_names: newAltName
			};

			const response = await fetch(`${VITE_API_URL}/admin/update_system_column/${id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(dataToSubmit)
			});

			if (!response.ok) {
				CustomError = await response.json();
				console.log(CustomError);
				return;
			}

			const result = await response.json();
			console.log(result);
			fetchData();
			editingColumn = null;
		} catch (error) {
			console.log(error.message);
			errorMessage = `Error: ${error.message}`;
		}
	}

	async function handleDelete(id, columnName) {
		if (confirm(`Are you sure you want to delete column "${columnName}"?`)) {
			try {
				const response = await fetch(
					`${VITE_API_URL}/admin/delete_system_column/${id}`,
					{
						method: 'DELETE',
						headers: {
							'Content-Type': 'application/json'
						}
					}
				);

				if (!response.ok) {
					console.log('error deleting column:', response);
					errorMessage = 'Failed to delete column. Please try again.';
					return;
				}

				const result = await response.json();
				fetchData();
			} catch (error) {
				console.log(error);
				errorMessage = `Error: ${error}`;
			}
		}
	}

	async function fetchData() {
		try {
			const response = await fetch(`${VITE_API_URL}/admin/get_system_columns`);

			if (!response.ok) {
				console.log('response is not ok', response);
			}

			data = await response.json();
			console.log('initial load data: ', data);
		} catch (error) {
			console.error('Error loading files:', error);
			data = [];
		}
	}

	// Check if column name already exists
	function isColumnNameUnique(columnName: string): boolean {
		if (!data?.columns || !data.columns.length) return true;

		return !data.columns.some(
			(column) => column.column_name.toLowerCase() === columnName.toLowerCase()
		);
	}

	async function handleSubmit(e) {
		e.preventDefault();
		errorMessage = '';

		// // Check for whitespace in column name
		// if (/\s/.test(formData.column_name)) {
		// 	errorMessage = 'Column name cannot contain spaces or whitespace characters.';
		// 	alert(errorMessage);
		// 	return;
		// }

		// Check for unique column name
		if (!isColumnNameUnique(formData.column_name)) {
			errorMessage = `Column name "${formData.column_name}" already exists. Please use a unique name.`;
			return;
		}

		try {
			// Prepare data to submit
			const dataToSubmit = {
				...formData,
				alt_names: tags.map((tag) => tag.text)
			};

			const response = await fetch(`${VITE_API_URL}/admin/add_system_column`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(dataToSubmit)
			});

			if (!response.ok) {
				console.log('error uploading column data:', response);
				errorMessage = 'Failed to add column. Please try again.';
				return;
			}

			const result = await response.json();
			console.log(result);
			fetchData();

			// Reset form and tags
			formData = {
				column_name: '',
				description: '',
				alt_names: [],
				asset_class: '',
				datatype: '',
				general_mandatory: '',
				is_currency: ''
			};
			tags = [];
			formVisible = false;
		} catch (error) {
			console.log(error.message);
			errorMessage = `Error: ${error.message}`;
		}
	}

	// Function to convert alt_name from string or array to an array of Tag objects
	function createTagsFromAltNames(altNames: string | string[]): Tag[] {
		if (!altNames) {
			return [];
		}

		// If it's a string (from MongoDB), try to parse it as JSON
		if (typeof altNames === 'string') {
			try {
				const names = JSON.parse(altNames);
				if (Array.isArray(names)) {
					return names.map((name) => ({
						id: Date.now().toString(36) + Math.random().toString(36).substring(2),
						text: name
					}));
				}
				// If it's a comma-separated string
				return altNames.split(',').map((name) => ({
					id: Date.now().toString(36) + Math.random().toString(36).substring(2),
					text: name.trim()
				}));
			} catch (e) {
				// If parsing fails, treat it as a single tag
				return [
					{
						id: Date.now().toString(36) + Math.random().toString(36).substring(2),
						text: altNames
					}
				];
			}
		}

		// If it's already an array
		if (Array.isArray(altNames)) {
			return altNames.map((name) => ({
				id: Date.now().toString(36) + Math.random().toString(36).substring(2),
				text: name
			}));
		}

		return [];
	}

	const allColumns = data?.columns?.length > 0 ? Object.keys(data.columns[0]) : [];
</script>

<div class="flex w-full flex-col items-center justify-center">
	<div class="h-[80%] w-[90%] py-10">
		{#if data?.data?.length > 0}
			<div class="h-full w-full py-2">
				<Table>
					<TableHead>
						<TableHeadCell>Column Name</TableHeadCell>
						<TableHeadCell>Description</TableHeadCell>
						<TableHeadCell>Alt Names</TableHeadCell>
						<TableHeadCell>Asset Class</TableHeadCell>
						<TableHeadCell>DataType</TableHeadCell>
						<TableHeadCell>General Mandetory</TableHeadCell>
						<TableHeadCell>Is Currency</TableHeadCell>
					</TableHead>
					<TableBody>
						{#each data.data as column, index}
							<TableBodyRow>
								{#if editingColumn && editingColumn.column_name === column.column_name}
									<TableBodyCell>
										<Input bind:value={editFormData.column_name} required /></TableBodyCell
									>
									<TableBodyCell
										><Input bind:value={editFormData.description} required /></TableBodyCell
									>
									<TableBodyCell
										><TagInput
											tags={editTags}
											placeholder=""
											onTagsChange={handleEditTagsChange}
											name="edit_alt_name"
										/></TableBodyCell
									>
									<TableBodyCell
										><Select id="countries" bind:value={editFormData.asset_class} placeholder="">
											{#each assetClassOptions as { value, name }}
												<option {value}>{name}</option>
											{/each}
										</Select></TableBodyCell
									>
									<TableBodyCell>
										<Select id="countries" bind:value={editFormData.datatype} placeholder="">
											{#each dataTypes as { value, name }}
												<option {value}>{name}</option>
											{/each}
										</Select></TableBodyCell
									>
									<TableBodyCell>
										<div class="form-group flex-1">
											<Label>General Mandetory</Label>
											<Checkbox bind:checked={editFormData.general_mandatory}></Checkbox>
										</div>
									</TableBodyCell>
									<TableBodyCell>
										<div class="form-group">
											<Button
												color="dark"
												onclick={() => {
													saveEdit(column._id);
												}}>Save</Button
											>
											<Button color="dark" onclick={cancelEdit}>Cancel</Button>
										</div></TableBodyCell
									>
								{:else}
									<TableBodyCell>{column.column_name}</TableBodyCell>
									<TableBodyCell>{column.description}</TableBodyCell>
									<TableBodyCell
										><div class="alt-names-display">
											{#if column.alt_names}
												{#each Array.isArray(column.alt_names) ? column.alt_names : [column.alt_names] as altName}
													<span class=" m-1 rounded-xl bg-gray-200 p-1.5">{altName}</span>
												{/each}
											{:else}
												<span class="text-gray-400">No alt names</span>
											{/if}
										</div></TableBodyCell
									>
									<TableBodyCell>{column.asset_class}</TableBodyCell>
									<TableBodyCell>{column.datatype}</TableBodyCell>
									<TableBodyCell>{column.general_mandatory}</TableBodyCell>
									<TableBodyCell>{column.is_currency}</TableBodyCell>
									<TableBodyCell>
										<div class="form-group">
											<Button color="dark" onclick={() => handleEdit(column)}>Edit</Button>
											<Button
												color="dark"
												onclick={() => handleDelete(column._id, column.column_name)}>Delete</Button
											>
										</div></TableBodyCell
									>
								{/if}
							</TableBodyRow>
						{/each}
					</TableBody>
				</Table>

				<hr class="my-4" />
			</div>
		{:else}
			<p>no columns</p>
		{/if}
		{#if formVisible}
			<form
				method="POST"
				onsubmit={(e) => {
					handleSubmit(e);
				}}
				class="relative flex w-full flex-col rounded-xl bg-gray-100 p-4 py-6"
			>
				{#if errorMessage}
					<div class="error-message mb-4 rounded bg-red-100 p-3 text-red-700">
						{errorMessage}
					</div>
				{/if}

				<div class="flex items-center justify-around gap-4">
					<div class="form-group flex-1">
						<Label>Column Name</Label>
						<Input id="column_name" name="column_name" bind:value={formData.column_name} required />
					</div>
					<div class="form-group flex-1">
						<Label>description</Label>
						<Input id="description" name="description" bind:value={formData.description} required />
					</div>
					<div class="form-group flex-1">
						<Label>Alt Names</Label>
						<TagInput {tags} placeholder="" onTagsChange={handleTagsChange} name="alt_name" />
					</div>

					<div class="form-group flex-1">
						<Label>Asset Class</Label>
						<Select id="countries" class="w-full" bind:value={formData.asset_class} placeholder="">
							{#each assetClassOptions as { value, name }}
								<option {value}>{name}</option>
							{/each}
						</Select>
					</div>
					<div class="form-group flex-1">
						<Label>Data Type</Label>
						<Select id="countries" class="w-full" bind:value={formData.datatype} placeholder="">
							{#each dataTypes as { value, name }}
								<option {value}>{name}</option>
							{/each}
						</Select>
					</div>
					<div class="form-group flex-1">
						<Label>General Mandetory</Label>
						<Checkbox checked={false} bind:value={formData.general_mandatory}></Checkbox>
					</div>
					<div class="form-group flex-1">
						<Label>Is Currency</Label>
						<Checkbox checked={false} bind:value={formData.is_currency}></Checkbox>
					</div>
				</div>
				<div class="flex items-center justify-center gap-4">
					<Button
						color="dark"
						type="reset"
						class=" mt-4 w-[10%]"
						onclick={() => {
							formVisible = !formVisible;
						}}>cancel</Button
					>
					<Button color="dark" type="submit" class=" mt-4 w-[10%]">Submit</Button>
				</div>
			</form>
		{/if}
		<Button
			class="block"
			color={'light' == 'light' ? 'dark' : 'alternative'}
			onclick={() => {
				formVisible = !formVisible;
			}}>Add Column Data</Button
		>
	</div>
</div>
