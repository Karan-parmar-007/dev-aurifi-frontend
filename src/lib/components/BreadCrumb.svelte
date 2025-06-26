<script>
	import { Breadcrumb, BreadcrumbItem, Button } from 'flowbite-svelte';
	import { page } from '$app/state'; // correct import
	import { SideBar } from '../../store/toogleModal.svelte';

	// Get the current path reactively
	let pathUrl = page.url.pathname;
	let urlParts = pathUrl.split('/');

	// Define steps for DebtSheet
	const DebtSheetPages = [
		{ path: '', label: 'Upload File' },
		{ path: 'file_overview', label: 'File Overview' },
		{ path: 'column_mapping', label: 'Column Mapping' },
		{ path: 'data_validation', label: 'DataType Mapping' },
		{ path: 'Tagging', label: 'Tagging' },
		{ path: 'rule_setup', label: 'Modify Tagged' },
		{ path: 'retagged_items', label: 'Finalize Data Sheet' }
	];

	// Define steps for Transactions
	const TransactionsPages = [
		{ path: 'file_overview', label: 'Parsing file' },
		{ path: 'column_mapping', label: 'Column Mapping' },
		{ path: 'data_validation', label: 'Data Formating' },
		{ path: 'add_fields', label: 'Add Fields' },
		{ path: 'rbi_guidelines', label: 'RBI Guidelines' },
		{ path: 'sanitised_data', label: 'Sanitised Data' },
		{ path: 'custom_rules', label: 'Custom Rules' }
	];

	// Extract directory and current step
	let directory = $state(urlParts[1]);
	let currentPath = $state(urlParts[2] || '');

	// Get current index in breadcrumb for highlighting previous + current steps
	let activeIndex = $derived.by(() => {
		let index;
		if (directory === 'DebtSheet') {
			index = DebtSheetPages.findIndex((page) => page.path === currentPath);
		} else if (directory === 'Transactions') {
			index = TransactionsPages.findIndex((page) => page.path === currentPath);
		} else {
			index = 0;
		}
		return index;
	});
</script>

<div class="flex h-[10vh] w-full p-4">
	<Button onclick={() => (SideBar.isSideBarVisible = !SideBar.isSideBarVisible)}>
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
	</Button>

	<Breadcrumb aria-label="BreadCrumb Progress">
		{#if directory === 'DebtSheet'}
			{#each DebtSheetPages as item, index}
				<BreadcrumbItem>
					<span class={index <= activeIndex ? 'font-semibold text-black' : ''}>
						{item.label}
					</span>
				</BreadcrumbItem>
			{/each}
		{:else if directory === 'Transactions'}
			{#each TransactionsPages as item, index}
				<BreadcrumbItem>
					<span class={index <= activeIndex ? 'font-semibold text-black' : ''}>
						{item.label}
					</span>
				</BreadcrumbItem>
			{/each}
		{:else}
			<BreadcrumbItem><span class="text-gray-400">Unknown Directory</span></BreadcrumbItem>
		{/if}
	</Breadcrumb>
</div>
