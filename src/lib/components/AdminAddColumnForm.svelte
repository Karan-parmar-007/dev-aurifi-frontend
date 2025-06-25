<script lang="ts">
	import { Checkbox, Input, Label, Modal, Select, Button } from 'flowbite-svelte';
	import TagInput from '$lib/components/TagInput.svelte';
	import { systemColumnModal } from '../../store/toogleModal.svelte';
	import { VITE_API_URL } from '$lib/constants';
	import { onMount, onDestroy } from 'svelte';

	onDestroy(() => {
		console.log('Modal component destroyed, resetting form');
		resetForm();
	});

	interface Tag {
		id: string;
		text: string;
	}

	interface Column {
		_id?: string | { $oid: string };
		column_name: string | null;
		description: string | null;
		alt_names: string[] | string | null;
		asset_class: string | null;
		datatype: string | null;
		general_mandatory: boolean | null;
		is_currency: boolean | null;
		created_at?: string;
		updated_at?: string;
		original_column_name?: string;
	}

	let { editingColumn, purpose, fetchData, cleanup } = $props<{
		fetchData: () => Promise<void>;
		cleanup: () => Promise<void>;
		purpose: string | null;
		editingColumn: Column | null;
	}>();

	let formData = $state({
		column_name: '',
		description: '',
		alt_names: [],
		asset_class: '',
		datatype: '',
		general_mandatory: false,
		is_currency: false
	});

	let editTags = $derived.by(() => {
		return createTagsFromAltNames(editingColumn?.alt_names);
	});

	let isLoading = $state(false);
	let errorMessage = $state('');
	let tags = $state<Tag[]>([]);
	let assetClassOptions = $state<{ value: string; name: string }[]>([]);
	let assetClassFetchError = $state<string | null>(null);

	const dataTypeOptions = [
		{ value: 'currency', name: 'currency' },
		{ value: 'string', name: 'string' },
		{ value: 'number', name: 'number' },
		{ value: 'date', name: 'date' },
		{ value: 'boolean', name: 'boolean' }
	];

	onMount(async () => {
		try {
			const response = await fetch(`${VITE_API_URL}/admin/get_asset_classes`, {
				headers: { 'Content-Type': 'application/json' }
			});
			if (!response.ok) {
				throw new Error(`Failed to fetch asset classes: ${response.statusText}`);
			}
			const data = await response.json();
			if (data.status === 'success' && Array.isArray(data.data)) {
				assetClassOptions = data.data.map((item: { name: string }) => ({
					value: item.name,
					name: item.name
				}));
			} else {
				throw new Error('Invalid API response format');
			}
		} catch (error) {
			console.error('Error fetching asset classes:', error);
			assetClassFetchError = 'Failed to load asset classes. Please try again later.';
		}
	});

	$effect(() => {
		if (systemColumnModal.isSystemColumnModalOpen) {
			if (purpose === 'edit' && editingColumn) {
				console.log('Initializing form with editingColumn:', editingColumn);
				formData = {
					column_name: editingColumn.column_name || '',
					description: editingColumn.description || '',
					alt_names: Array.isArray(editingColumn.alt_names)
						? editingColumn.alt_names
						: [editingColumn.alt_names].filter(Boolean),
					asset_class: editingColumn.asset_class || '',
					datatype: editingColumn.datatype || '',
					general_mandatory: editingColumn.general_mandatory || false,
					is_currency: editingColumn.is_currency || false
				};
				editTags = createTagsFromAltNames(editingColumn.alt_names);
			} else {
				resetForm();
			}
		}
	});

	function handleEditTagsChange(newTags: Tag[]) {
		editTags = newTags;
		formData.alt_names = newTags.map((tag) => tag.text);
	}

	$effect(() => {
		if (!systemColumnModal.isSystemColumnModalOpen) {
			resetForm();
		}
	});

	function createTagsFromAltNames(altNames: string | string[] | null): Tag[] {
		if (!altNames) {
			return [];
		}
		if (typeof altNames === 'string') {
			try {
				const names = JSON.parse(altNames);
				if (Array.isArray(names)) {
					return names.map((name) => ({
						id: Date.now().toString(36) + Math.random().toString(36).substring(2),
						text: name
					}));
				}
				return altNames.split(',').map((name) => ({
					id: Date.now().toString(36) + Math.random().toString(36).substring(2),
					text: name.trim()
				}));
			} catch (e) {
				return [
					{
						id: Date.now().toString(36) + Math.random().toString(36).substring(2),
						text: altNames
					}
				];
			}
		}
		if (Array.isArray(altNames)) {
			return altNames.map((name) => ({
				id: Date.now().toString(36) + Math.random().toString(36).substring(2),
				text: name
			}));
		}
		return [];
	}

	function resetForm() {
		console.log('resetForm called');
		formData = {
			column_name: '',
			description: '',
			alt_names: [],
			asset_class: '',
			datatype: '',
			general_mandatory: false,
			is_currency: false
		};
		editingColumn = {
			column_name: '',
			description: '',
			alt_names: [],
			asset_class: '',
			datatype: '',
			general_mandatory: false,
			is_currency: false
		};
		tags = [];
		errorMessage = '';
		isLoading = false;
		purpose = null;
		cleanup();
	}

	async function saveEdit(event: Event) {
		event.preventDefault();
		try {
			isLoading = true;
			errorMessage = '';

			// Validate column_name

			// Validate _id
			if (!editingColumn || !editingColumn._id) {
				errorMessage = 'Invalid column ID. Cannot update column.';
				console.error('Invalid editingColumn._id:', editingColumn);
				return;
			}

			// Normalize _id (handle { $oid: string } format)
			const columnId =
				typeof editingColumn._id === 'string' ? editingColumn._id : editingColumn._id.$oid;
			if (!columnId) {
				errorMessage = 'Invalid column ID format.';
				console.error('Invalid columnId:', editingColumn._id);
				return;
			}

			// Validate required fields
			if (!formData.column_name || !formData.description || !formData.datatype) {
				errorMessage = 'Column name, description, and datatype are required.';
				return;
			}

			const dataToSubmit = {
				...formData,
				alt_names: editTags.map((tag) => tag.text)
			};

			console.log('Submitting data to API:', { columnId, dataToSubmit });

			const response = await fetch(`${VITE_API_URL}/admin/update_system_column/${columnId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(dataToSubmit)
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(`Error updating system column: ${error.message || error}`);
			}

			const data = await response.json();
			console.log('API response:', data);
			await fetchData();
			systemColumnModal.isSystemColumnModalOpen = false; // Close modal only on success
		} catch (error) {
			console.error('Submission error:', error);
			errorMessage = error.message || 'An error occurred while updating the column.';
		} finally {
			isLoading = false;
			if (!errorMessage) {
				// Only reset form if no error occurred
				resetForm();
			}
		}
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		try {
			isLoading = true;
			errorMessage = '';

			const isUnique = await isColumnNameUnique(formData.column_name, editingColumn?.column_name);
			if (!isUnique) {
				errorMessage = 'Column name already exists';
				isLoading = false;
				return;
			}

			const payload = {
				...formData,
				alt_names: editTags.map((tag) => tag.text)
			};

			console.log('Submitting payload to:', `${VITE_API_URL}/admin/add_system_column`, payload);
			const response = await fetch(`${VITE_API_URL}/admin/add_system_column`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(`Error adding system column: ${error.message || error}`);
			}

			const data = await response.json();
			console.log('API response:', data);
			await fetchData();
			systemColumnModal.isSystemColumnModalOpen = false;
			resetForm();
		} catch (error) {
			console.error('Submission error:', error);
			errorMessage = error.message || 'An error occurred';
		} finally {
			isLoading = false;
		}
	}

	async function isColumnNameUnique(columnName: string, originalName?: string): Promise<boolean> {
		try {
			const response = await fetch(`${VITE_API_URL}/admin/get_system_columns`);
			if (!response.ok) {
				throw new Error('Failed to fetch columns');
			}
			const data = await response.json();
			if (!data?.data || !data.data.length) return true;
			return !data.data.some(
				(column) =>
					column.column_name.toLowerCase() === columnName.toLowerCase() &&
					(originalName ? column.column_name.toLowerCase() !== originalName.toLowerCase() : true)
			);
		} catch (error) {
			console.error('Error checking column name uniqueness:', error);
			return false;
		}
	}
</script>

<Modal bind:open={systemColumnModal.isSystemColumnModalOpen} title="System Column">
	{#if isLoading}
		<div class="absolute inset-0 z-30 flex h-full w-full items-center justify-center">
			<div
				class="z-40 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
			></div>
		</div>
	{/if}

	{#if purpose === 'edit'}
		<form
			onsubmit={saveEdit}
			action="javascript:void(0)"
			class="flex h-full w-full flex-col items-center gap-4 p-2"
		>
			{#if errorMessage}
				<div class="error-message mb-4 rounded bg-red-100 p-3 text-red-700">
					{errorMessage}
				</div>
			{/if}
			{#if assetClassFetchError}
				<div class="error-message mb-4 rounded bg-red-100 p-3 text-red-700">
					{assetClassFetchError}
				</div>
			{/if}

			<span class="flex w-full items-center gap-4">
				<span class="flex flex-1 flex-col gap-2">
					<Label for="name">Column Name</Label>
					<Input
						type="text"
						name="name"
						placeholder="Enter Name"
						bind:value={formData.column_name}
						required
					/>
				</span>
				<span class="flex flex-1 flex-col gap-2">
					<Label for="desc">Description</Label>
					<Input
						type="text"
						name="desc"
						placeholder="Enter Description"
						bind:value={formData.description}
						required
					/>
				</span>
			</span>
			<span class="flex w-full flex-1 flex-col gap-2">
				<Label for="alt_name">Alt Names</Label>
				<TagInput tags={editTags} onTagsChange={handleEditTagsChange} name="edit_alt_name" />
			</span>
			<span class="flex w-full items-center gap-4">
				<span class="flex flex-1 flex-col gap-2">
					<Label for="asset_class">Asset Class</Label>
					<Select
						items={assetClassOptions}
						bind:value={formData.asset_class}
						placeholder={assetClassOptions.length ? 'Select Asset Class' : 'Loading...'}
						disabled={!assetClassOptions.length}
					/>
				</span>
				<span class="flex flex-1 flex-col gap-2">
					<Label for="datatype">DataType</Label>
					<Select items={dataTypeOptions} bind:value={formData.datatype} />
				</span>
				<span class="flex h-full flex-1 flex-col justify-end gap-4">
					<span class="mx-auto flex w-[70%] flex-col">
						<span class="flex items-center justify-between">
							<Label for="mandatory">Mandatory</Label>
							<Checkbox name="mandatory" bind:checked={formData.general_mandatory} />
						</span>
						<span class="flex items-center justify-between">
							<Label for="is_currency">Is Currency</Label>
							<Checkbox name="is_currency" bind:checked={formData.is_currency} />
						</span>
					</span>
				</span>
			</span>
			<div class="mt-4 flex items-center justify-center gap-4">
				<Button
					color="dark"
					type="button"
					onclick={() => {
						systemColumnModal.isSystemColumnModalOpen = false;
						resetForm();
					}}
				>
					Cancel
				</Button>
				<Button color="dark" type="submit">Save</Button>
			</div>
		</form>
	{:else}
		<form
			onsubmit={handleSubmit}
			action="javascript:void(0)"
			class="flex h-full w-full flex-col items-center gap-4 p-2"
		>
			{#if errorMessage}
				<div class="error-message mb-4 rounded bg-red-100 p-3 text-red-700">
					{errorMessage}
				</div>
			{/if}
			{#if assetClassFetchError}
				<div class="error-message mb-4 rounded bg-red-100 p-3 text-red-700">
					{assetClassFetchError}
				</div>
			{/if}

			<span class="flex w-full items-center gap-4">
				<span class="flex flex-1 flex-col gap-2">
					<Label for="name">Column Name</Label>
					<Input
						type="text"
						name="name"
						placeholder="Enter Name"
						bind:value={formData.column_name}
						required
					/>
				</span>
				<span class="flex flex-1 flex-col gap-2">
					<Label for="desc">Description</Label>
					<Input
						type="text"
						name="desc"
						placeholder="Enter Description"
						bind:value={formData.description}
						required
					/>
				</span>
			</span>
			<span class="flex w-full flex-1 flex-col gap-2">
				<Label for="alt_name">Alt Names</Label>
				<TagInput
					tags={editTags}
					placeholder=""
					onTagsChange={handleEditTagsChange}
					name="edit_alt_name"
				/>
			</span>
			<span class="flex w-full items-center gap-4">
				<span class="flex flex-1 flex-col gap-2">
					<Label for="asset_class">Asset Class</Label>
					<Select
						items={assetClassOptions}
						bind:value={formData.asset_class}
						placeholder={assetClassOptions.length ? 'Select Asset Class' : 'Loading...'}
						disabled={!assetClassOptions.length}
					/>
				</span>
				<span class="flex flex-1 flex-col gap-2">
					<Label for="datatype">DataType</Label>
					<Select items={dataTypeOptions} bind:value={formData.datatype} />
				</span>
				<span class="flex h-full flex-1 flex-col justify-end gap-4">
					<span class="mx-auto flex w-[70%] flex-col">
						<span class="flex items-center justify-between">
							<Label for="mandatory">Mandatory</Label>
							<Checkbox name="mandatory" bind:checked={formData.general_mandatory} />
						</span>
						<span class="flex items-center justify-between">
							<Label for="is_currency">Is Currency</Label>
							<Checkbox name="is_currency" bind:checked={formData.is_currency} />
						</span>
					</span>
				</span>
			</span>
			<div class="mt-4 flex items-center justify-center gap-4">
				<Button
					color="dark"
					type="button"
					onclick={() => {
						systemColumnModal.isSystemColumnModalOpen = false;
						resetForm();
					}}
				>
					Cancel
				</Button>
				<Button color="dark" type="submit">Submit</Button>
			</div>
		</form>
	{/if}
</Modal>
